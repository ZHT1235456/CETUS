use std::{
    collections::{BTreeMap, BTreeSet},
    net::IpAddr,
    sync::OnceLock,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use serde::{Deserialize, Serialize};
use tauri::{ipc::Channel, State};
use tokio::{
    net::UdpSocket,
    sync::{oneshot, Mutex},
    task::JoinHandle,
    time::{interval, MissedTickBehavior},
};

pub const DEFAULT_PORT: u16 = 5005;
pub const MAX_DATAGRAM_BYTES: usize = 1400;
const SOURCE_TIMEOUT_MS: u64 = 2_000;
const FLEET_IDS: [&str; 6] = ["USV-1", "USV-2", "USV-3", "USV-4", "USV-5", "USV-6"];

fn fleet_ids() -> &'static BTreeSet<&'static str> {
    static IDS: OnceLock<BTreeSet<&'static str>> = OnceLock::new();
    IDS.get_or_init(|| FLEET_IDS.into_iter().collect())
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WireFleetDatagramV1 {
    pub version: u8,
    #[serde(rename = "type")]
    pub message_type: String,
    pub stream_id: String,
    pub seq: u64,
    pub sent_at_ms: u64,
    pub frame: BTreeMap<String, WireFleetUnit>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WireFleetUnit {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub heading: f64,
    pub speed: f64,
    pub is_fault: bool,
    pub health: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FleetUnit {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub heading: f64,
    pub speed: f64,
    pub is_fault: bool,
    pub health: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FleetMessage {
    #[serde(rename = "type")]
    pub message_type: &'static str,
    pub timestamp: u64,
    pub frame: BTreeMap<String, FleetUnit>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ReceiverState {
    Listening,
    Live,
    TimedOut,
    Stopped,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiverStatus {
    pub state: ReceiverState,
    pub bind_address: String,
    pub sender: Option<String>,
    pub last_packet_at_ms: Option<u64>,
    pub dropped_packets: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", content = "payload", rename_all = "camelCase")]
pub enum FleetReceiverEvent {
    Frame(FleetMessage),
    Status(ReceiverStatus),
    Error(ErrorPayload),
}

#[derive(Debug, Clone, Serialize)]
pub struct ErrorPayload {
    pub message: String,
}

struct ReceiverTask {
    cancel: oneshot::Sender<()>,
    handle: JoinHandle<()>,
}

#[derive(Default)]
pub struct FleetReceiverManager {
    task: Mutex<Option<ReceiverTask>>,
}

#[derive(Debug, Default)]
struct PacketGate {
    active_sender: Option<IpAddr>,
    stream_id: Option<String>,
    last_seq: Option<u64>,
    last_valid_at_ms: Option<u64>,
    dropped_packets: u64,
}

impl PacketGate {
    fn accept(
        &mut self,
        sender: IpAddr,
        stream_id: &str,
        seq: u64,
        now_ms: u64,
    ) -> Result<(), &'static str> {
        if let Some(active_sender) = self.active_sender {
            if active_sender != sender && !self.is_timed_out(now_ms) {
                self.dropped_packets += 1;
                return Err("ignored datagram from a non-active sender");
            }
        }

        let sender_changed = self.active_sender != Some(sender);
        let stream_changed = self.stream_id.as_deref() != Some(stream_id);
        if sender_changed || stream_changed {
            self.active_sender = Some(sender);
            self.stream_id = Some(stream_id.to_owned());
            self.last_seq = None;
        }

        if self.last_seq.is_some_and(|last| seq <= last) {
            self.dropped_packets += 1;
            return Err("ignored duplicate or out-of-order sequence number");
        }

        self.last_seq = Some(seq);
        self.last_valid_at_ms = Some(now_ms);
        Ok(())
    }

    fn is_timed_out(&self, now_ms: u64) -> bool {
        self.last_valid_at_ms
            .is_some_and(|last| now_ms.saturating_sub(last) >= SOURCE_TIMEOUT_MS)
    }

    fn drop_invalid(&mut self) {
        self.dropped_packets += 1;
    }
}

fn validate_wire(datagram: WireFleetDatagramV1) -> Result<FleetMessage, String> {
    if datagram.version != 1 {
        return Err(format!("unsupported protocol version {}", datagram.version));
    }
    if datagram.message_type != "fleet" {
        return Err("message type must be 'fleet'".into());
    }
    if datagram.stream_id.is_empty() || datagram.stream_id.len() > 128 {
        return Err("streamId must contain 1 to 128 characters".into());
    }

    let actual_ids: BTreeSet<&str> = datagram.frame.keys().map(String::as_str).collect();
    if &actual_ids != fleet_ids() {
        return Err(format!(
            "frame must contain exactly {}",
            FLEET_IDS.join(", ")
        ));
    }

    let mut frame = BTreeMap::new();
    for (id, unit) in datagram.frame {
        let values = [
            unit.x,
            unit.y,
            unit.z,
            unit.heading,
            unit.speed,
            unit.health,
        ];
        if values.iter().any(|value| !value.is_finite()) {
            return Err(format!("{id} contains a non-finite number"));
        }
        if unit.speed < 0.0 {
            return Err(format!("{id}.speed must be non-negative"));
        }
        if !(0.0..=100.0).contains(&unit.health) {
            return Err(format!("{id}.health must be between 0 and 100"));
        }

        frame.insert(
            id.clone(),
            FleetUnit {
                id,
                x: unit.x,
                y: unit.y,
                z: unit.z,
                heading: unit.heading,
                speed: unit.speed,
                is_fault: unit.is_fault,
                health: unit.health,
            },
        );
    }

    Ok(FleetMessage {
        message_type: "fleet",
        timestamp: datagram.sent_at_ms,
        frame,
    })
}

fn parse_datagram(bytes: &[u8]) -> Result<(WireFleetDatagramV1, FleetMessage), String> {
    if bytes.len() > MAX_DATAGRAM_BYTES {
        return Err(format!(
            "datagram exceeds the {MAX_DATAGRAM_BYTES}-byte limit"
        ));
    }
    let wire: WireFleetDatagramV1 =
        serde_json::from_slice(bytes).map_err(|error| format!("invalid JSON datagram: {error}"))?;
    let message = validate_wire(wire.clone())?;
    Ok((wire, message))
}

fn epoch_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

fn receiver_status(
    state: ReceiverState,
    bind_address: &str,
    gate: &PacketGate,
    last_packet_at_ms: Option<u64>,
) -> ReceiverStatus {
    ReceiverStatus {
        state,
        bind_address: bind_address.to_owned(),
        sender: gate.active_sender.map(|ip| ip.to_string()),
        last_packet_at_ms,
        dropped_packets: gate.dropped_packets,
    }
}

async fn run_receiver(
    socket: UdpSocket,
    bind_address: String,
    channel: Channel<FleetReceiverEvent>,
    mut cancel: oneshot::Receiver<()>,
) {
    let started = Instant::now();
    let mut gate = PacketGate::default();
    let mut state = ReceiverState::Listening;
    let mut last_packet_at_ms = None;
    // Read the full UDP payload so an oversized datagram is rejected without
    // turning Windows' WSAEMSGSIZE into a fatal receive error.
    let mut buffer = vec![0_u8; u16::MAX as usize];
    let mut timeout_tick = interval(Duration::from_millis(200));
    timeout_tick.set_missed_tick_behavior(MissedTickBehavior::Skip);

    if channel
        .send(FleetReceiverEvent::Status(receiver_status(
            state,
            &bind_address,
            &gate,
            last_packet_at_ms,
        )))
        .is_err()
    {
        return;
    }

    loop {
        tokio::select! {
          _ = &mut cancel => {
            let _ = channel.send(FleetReceiverEvent::Status(receiver_status(
              ReceiverState::Stopped,
              &bind_address,
              &gate,
              last_packet_at_ms,
            )));
            break;
          }
          _ = timeout_tick.tick() => {
            let elapsed_ms = started.elapsed().as_millis() as u64;
            if state == ReceiverState::Live && gate.is_timed_out(elapsed_ms) {
              state = ReceiverState::TimedOut;
              if channel.send(FleetReceiverEvent::Status(receiver_status(
                state,
                &bind_address,
                &gate,
                last_packet_at_ms,
              ))).is_err() {
                break;
              }
            }
          }
          result = socket.recv_from(&mut buffer) => {
            let (length, sender) = match result {
              Ok(value) => value,
              Err(error) => {
                let _ = channel.send(FleetReceiverEvent::Error(ErrorPayload {
                  message: format!("UDP receive failed: {error}"),
                }));
                break;
              }
            };
            let elapsed_ms = started.elapsed().as_millis() as u64;
            match parse_datagram(&buffer[..length]) {
              Ok((wire, message)) => {
                match gate.accept(sender.ip(), &wire.stream_id, wire.seq, elapsed_ms) {
                  Ok(()) => {
                    state = ReceiverState::Live;
                    last_packet_at_ms = Some(epoch_ms());
                    if channel.send(FleetReceiverEvent::Frame(message)).is_err() {
                      break;
                    }
                    if channel.send(FleetReceiverEvent::Status(receiver_status(
                      state,
                      &bind_address,
                      &gate,
                      last_packet_at_ms,
                    ))).is_err() {
                      break;
                    }
                  }
                  Err(message) => {
                    let _ = channel.send(FleetReceiverEvent::Error(ErrorPayload {
                      message: message.to_owned(),
                    }));
                    let _ = channel.send(FleetReceiverEvent::Status(receiver_status(
                      state,
                      &bind_address,
                      &gate,
                      last_packet_at_ms,
                    )));
                  }
                }
              }
              Err(message) => {
                gate.drop_invalid();
                let _ = channel.send(FleetReceiverEvent::Error(ErrorPayload { message }));
                let _ = channel.send(FleetReceiverEvent::Status(receiver_status(
                  state,
                  &bind_address,
                  &gate,
                  last_packet_at_ms,
                )));
              }
            }
          }
        }
    }
}

#[tauri::command]
pub async fn start_fleet_receiver(
    port: Option<u16>,
    channel: Channel<FleetReceiverEvent>,
    manager: State<'_, FleetReceiverManager>,
) -> Result<(), String> {
    let port = port.unwrap_or(DEFAULT_PORT);

    // Replacing an existing task makes React StrictMode remounts safe while still
    // guaranteeing that only one socket is active at a time.
    let mut task_slot = manager.task.lock().await;
    if let Some(task) = task_slot.take() {
        let _ = task.cancel.send(());
        let _ = task.handle.await;
    }

    let bind_address = format!("0.0.0.0:{port}");
    let socket = UdpSocket::bind(&bind_address)
        .await
        .map_err(|error| format!("could not bind UDP {bind_address}: {error}"))?;
    let (cancel, cancel_rx) = oneshot::channel();
    let handle = tokio::spawn(run_receiver(socket, bind_address, channel, cancel_rx));
    *task_slot = Some(ReceiverTask { cancel, handle });
    Ok(())
}

#[tauri::command]
pub async fn stop_fleet_receiver(manager: State<'_, FleetReceiverManager>) -> Result<(), String> {
    let mut task_slot = manager.task.lock().await;
    if let Some(task) = task_slot.take() {
        let _ = task.cancel.send(());
        let _ = task.handle.await;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::{IpAddr, Ipv4Addr};

    fn unit() -> WireFleetUnit {
        WireFleetUnit {
            x: 1.0,
            y: 2.0,
            z: 0.0,
            heading: 0.5,
            speed: 3.0,
            is_fault: false,
            health: 100.0,
        }
    }

    fn datagram() -> WireFleetDatagramV1 {
        WireFleetDatagramV1 {
            version: 1,
            message_type: "fleet".into(),
            stream_id: "c764650e-bf2e-4e68-82a7-403a71118b52".into(),
            seq: 0,
            sent_at_ms: 1_700_000_000_000,
            frame: FLEET_IDS
                .iter()
                .map(|id| ((*id).to_owned(), unit()))
                .collect(),
        }
    }

    #[test]
    fn accepts_a_complete_valid_frame() {
        let message = validate_wire(datagram()).expect("valid frame");
        assert_eq!(message.frame.len(), 6);
        assert_eq!(message.frame["USV-1"].id, "USV-1");
    }

    #[test]
    fn rejects_missing_and_unknown_boats() {
        let mut missing = datagram();
        missing.frame.remove("USV-6");
        assert!(validate_wire(missing).is_err());

        let mut unknown = datagram();
        unknown.frame.remove("USV-6");
        unknown.frame.insert("USV-7".into(), unit());
        assert!(validate_wire(unknown).is_err());
    }

    #[test]
    fn rejects_non_finite_numbers_and_invalid_health() {
        let mut non_finite = datagram();
        non_finite.frame.get_mut("USV-1").unwrap().x = f64::NAN;
        assert!(validate_wire(non_finite).is_err());

        let mut unhealthy = datagram();
        unhealthy.frame.get_mut("USV-2").unwrap().health = 100.1;
        assert!(validate_wire(unhealthy).is_err());
    }

    #[test]
    fn rejects_oversized_datagrams() {
        let payload = vec![b' '; MAX_DATAGRAM_BYTES + 1];
        assert!(parse_datagram(&payload).unwrap_err().contains("1400-byte"));
    }

    #[test]
    fn drops_duplicate_and_out_of_order_sequences() {
        let sender = IpAddr::V4(Ipv4Addr::new(192, 168, 1, 10));
        let mut gate = PacketGate::default();
        assert!(gate.accept(sender, "stream-a", 4, 0).is_ok());
        assert!(gate.accept(sender, "stream-a", 4, 10).is_err());
        assert!(gate.accept(sender, "stream-a", 3, 20).is_err());
        assert_eq!(gate.dropped_packets, 2);
    }

    #[test]
    fn a_new_stream_can_restart_at_zero() {
        let sender = IpAddr::V4(Ipv4Addr::LOCALHOST);
        let mut gate = PacketGate::default();
        assert!(gate.accept(sender, "stream-a", 100, 0).is_ok());
        assert!(gate.accept(sender, "stream-b", 0, 10).is_ok());
        assert_eq!(gate.last_seq, Some(0));
    }

    #[test]
    fn another_sender_cannot_take_over_before_timeout() {
        let first = IpAddr::V4(Ipv4Addr::new(192, 168, 1, 10));
        let second = IpAddr::V4(Ipv4Addr::new(192, 168, 1, 11));
        let mut gate = PacketGate::default();
        assert!(gate.accept(first, "stream-a", 0, 0).is_ok());
        assert!(gate.accept(second, "stream-b", 0, 1_999).is_err());
        assert_eq!(gate.active_sender, Some(first));
        assert!(gate.accept(second, "stream-b", 0, 2_000).is_ok());
        assert_eq!(gate.active_sender, Some(second));
    }

    #[test]
    fn timeout_clears_after_a_recovered_packet() {
        let sender = IpAddr::V4(Ipv4Addr::LOCALHOST);
        let mut gate = PacketGate::default();
        assert!(gate.accept(sender, "stream-a", 0, 0).is_ok());
        assert!(gate.is_timed_out(2_000));
        assert!(gate.accept(sender, "stream-a", 1, 2_100).is_ok());
        assert!(!gate.is_timed_out(2_100));
    }

    #[tokio::test]
    async fn udp_loop_emits_a_validated_frame_event() {
        let receiver_socket = UdpSocket::bind("127.0.0.1:0").await.unwrap();
        let receiver_address = receiver_socket.local_addr().unwrap();
        let sender_socket = UdpSocket::bind("127.0.0.1:0").await.unwrap();
        let (event_tx, mut event_rx) = tokio::sync::mpsc::unbounded_channel();
        let channel = Channel::new(move |body| {
            let _ = event_tx.send(body.deserialize::<serde_json::Value>().unwrap());
            Ok(())
        });
        let (cancel, cancel_rx) = oneshot::channel();
        let task = tokio::spawn(run_receiver(
            receiver_socket,
            receiver_address.to_string(),
            channel,
            cancel_rx,
        ));

        let listening = tokio::time::timeout(Duration::from_secs(1), event_rx.recv())
            .await
            .unwrap()
            .unwrap();
        assert_eq!(listening["kind"], "status");
        assert_eq!(listening["payload"]["state"], "listening");

        let payload = serde_json::to_vec(&datagram()).unwrap();
        sender_socket
            .send_to(&payload, receiver_address)
            .await
            .unwrap();

        let frame = tokio::time::timeout(Duration::from_secs(1), event_rx.recv())
            .await
            .unwrap()
            .unwrap();
        assert_eq!(frame["kind"], "frame");
        assert_eq!(frame["payload"]["frame"].as_object().unwrap().len(), 6);

        let _ = cancel.send(());
        task.await.unwrap();
    }
}
