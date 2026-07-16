import { useEffect } from 'react'
import { Channel, invoke, isTauri } from '@tauri-apps/api/core'
import { useMockFleet } from '@/hooks/useMockFleet'
import { useFleetStore } from '@/store/usvStore'
import type { FleetReceiverEvent } from '@/types/usv'

const UDP_PORT = 5005
let pendingStop: number | undefined

/** 在 Layout 生命周期内唯一挂载的舰队数据运行时。 */
export function useFleetRuntime() {
  const shouldPlayMock = useFleetStore((state) => !state.hasReceivedLive)
  useMockFleet(shouldPlayMock)

  useEffect(() => {
    if (!isTauri()) return

    if (pendingStop !== undefined) {
      window.clearTimeout(pendingStop)
      pendingStop = undefined
    }
    let disposed = false
    const channel = new Channel<FleetReceiverEvent>((event) => {
      if (disposed) return
      const store = useFleetStore.getState()
      if (event.kind === 'frame') {
        store.ingestLive(event.payload)
      } else if (event.kind === 'status') {
        store.updateReceiver(event.payload)
      } else {
        store.setReceiverError(event.payload.message)
      }
    })

    const startTimer = window.setTimeout(() => {
      void invoke('start_fleet_receiver', { port: UDP_PORT, channel }).catch((error: unknown) => {
        if (!disposed) {
          useFleetStore
            .getState()
            .setReceiverError(error instanceof Error ? error.message : String(error), true)
        }
      })
    }, 0)

    return () => {
      disposed = true
      window.clearTimeout(startTimer)
      pendingStop = window.setTimeout(() => {
        pendingStop = undefined
        void invoke('stop_fleet_receiver').catch(() => undefined)
      }, 0)
    }
  }, [])
}
