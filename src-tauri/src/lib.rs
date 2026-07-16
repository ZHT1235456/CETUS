mod fleet_receiver;

use fleet_receiver::{start_fleet_receiver, stop_fleet_receiver, FleetReceiverManager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(FleetReceiverManager::default())
        .invoke_handler(tauri::generate_handler![
            start_fleet_receiver,
            stop_fleet_receiver
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
