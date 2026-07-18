import { useEffect } from 'react'
import { useMockFleet } from '@/hooks/useMockFleet'
import { buildFleetWsUrl, parseFleetWire } from '@/lib/fleetWire'
import { useFleetStore } from '@/store/usvStore'
import type { ReceiverStatus } from '@/types/usv'

const SOURCE_TIMEOUT_MS = 2_000
const RECONNECT_BASE_MS = 500
const RECONNECT_MAX_MS = 5_000

/**
 * 演示模式开关：false = 停用 WebSocket 接入，全量使用内置自定义演示轨迹。
 * 接入代码完整保留，置回 true 即恢复真实链路。
 */
export const ENABLE_LIVE_WS = false

/** 在 Layout 生命周期内唯一挂载的舰队数据运行时（浏览器与 Tauri 同源 WebSocket）。 */
export function useFleetRuntime() {
  const shouldPlayMock = useFleetStore((state) => !state.hasReceivedLive)
  const fleetHost = useFleetStore((state) => state.fleetHost)
  const fleetPort = useFleetStore((state) => state.fleetPort)
  const wsUrl = buildFleetWsUrl(fleetHost, fleetPort)
  useMockFleet(shouldPlayMock)

  useEffect(() => {
    if (!ENABLE_LIVE_WS) {
      useFleetStore.getState().updateReceiver({
        state: 'idle',
        bindAddress: 'demo://trajectory',
        sender: null,
        lastPacketAtMs: null,
        droppedPackets: 0,
      })
      return
    }

    let disposed = false
    let socket: WebSocket | undefined
    let reconnectTimer: number | undefined
    let watchdogTimer: number | undefined
    let attempt = 0
    let streamId: string | undefined
    let lastSeq: number | undefined
    let lastFrameAtMs: number | null = null
    let droppedPackets = 0

    const publishStatus = (
      state: ReceiverStatus['state'],
      sender: string | null = useFleetStore.getState().receiver.sender,
    ) => {
      useFleetStore.getState().updateReceiver({
        state,
        bindAddress: wsUrl,
        sender,
        lastPacketAtMs: lastFrameAtMs,
        droppedPackets,
      })
    }

    const clearReconnect = () => {
      if (reconnectTimer !== undefined) {
        window.clearTimeout(reconnectTimer)
        reconnectTimer = undefined
      }
    }

    const scheduleReconnect = () => {
      if (disposed) return
      clearReconnect()
      const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS)
      attempt += 1
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = undefined
        connect()
      }, delay)
    }

    const connect = () => {
      if (disposed) return
      clearReconnect()
      publishStatus('listening', null)

      try {
        socket = new WebSocket(wsUrl)
      } catch (error) {
        useFleetStore
          .getState()
          .setReceiverError(error instanceof Error ? error.message : String(error), true)
        scheduleReconnect()
        return
      }

      socket.addEventListener('open', () => {
        if (disposed) return
        attempt = 0
        useFleetStore.getState().setReceiverError(null)
        publishStatus('listening', null)
      })

      socket.addEventListener('message', (event) => {
        if (disposed) return
        if (typeof event.data !== 'string') {
          droppedPackets += 1
          useFleetStore.getState().setReceiverError('ignored non-text WebSocket frame')
          publishStatus(useFleetStore.getState().receiver.state)
          return
        }

        try {
          const { wire, message } = parseFleetWire(event.data)
          if (streamId !== wire.streamId) {
            streamId = wire.streamId
            lastSeq = undefined
          }
          if (lastSeq !== undefined && wire.seq <= lastSeq) {
            droppedPackets += 1
            useFleetStore.getState().setReceiverError('ignored duplicate or out-of-order sequence')
            publishStatus(useFleetStore.getState().receiver.state)
            return
          }
          lastSeq = wire.seq
          lastFrameAtMs = Date.now()
          useFleetStore.getState().ingestLive(message)
          publishStatus('live', wsUrl)
        } catch (error) {
          droppedPackets += 1
          useFleetStore
            .getState()
            .setReceiverError(error instanceof Error ? error.message : String(error))
          publishStatus(useFleetStore.getState().receiver.state)
        }
      })

      socket.addEventListener('error', () => {
        if (disposed) return
        useFleetStore.getState().setReceiverError(`WebSocket error: ${wsUrl}`)
      })

      socket.addEventListener('close', () => {
        if (disposed) return
        socket = undefined
        const wasLive = useFleetStore.getState().receiver.state === 'live'
        publishStatus(wasLive || lastFrameAtMs !== null ? 'timedOut' : 'listening', null)
        scheduleReconnect()
      })
    }

    watchdogTimer = window.setInterval(() => {
      if (disposed) return
      const state = useFleetStore.getState().receiver.state
      if (state === 'live' && lastFrameAtMs !== null && Date.now() - lastFrameAtMs >= SOURCE_TIMEOUT_MS) {
        publishStatus('timedOut', wsUrl)
      }
    }, 200)

    connect()

    return () => {
      disposed = true
      clearReconnect()
      if (watchdogTimer !== undefined) {
        window.clearInterval(watchdogTimer)
      }
      const active = socket
      socket = undefined
      if (active && (active.readyState === WebSocket.OPEN || active.readyState === WebSocket.CONNECTING)) {
        active.close()
      }
    }
  }, [wsUrl])
}
