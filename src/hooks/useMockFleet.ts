import { useEffect, useRef } from 'react'
import { useFleetStore } from '@/store/usvStore'

/**
 * mock 舰队驱动：按 rAF 推进编队时间并写入 store。
 * 后期接 WebSocket + Tauri 后，停止挂载此 hook，改由 ws 消息驱动 `ingestLive`
 */
export function useMockFleet(enabled = true) {
  const tickMock = useFleetStore((s) => s.tickMock)
  const tRef = useRef(0)
  const lastRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return
    const loop = (now: number) => {
      if (lastRef.current == null) lastRef.current = now
      const dt = (now - lastRef.current) / 1000
      lastRef.current = now
      tRef.current += dt
      tickMock(tRef.current)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [enabled, tickMock])
}