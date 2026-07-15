import { create } from 'zustand'
import type { FleetFrame, FleetMessage, USVId } from '@/types/usv'
import { FLEET } from '@/config/fleet'
import { frameAt } from '@/lib/formation'

const EMPTY_FRAME = (): FleetFrame => {
  const f = {} as FleetFrame
  for (const u of FLEET) {
    f[u.id] = {
      id: u.id,
      x: 0,
      z: 0,
      heading: 0,
      speed: 0,
      isFault: false,
      health: 100,
    }
  }
  return f
}

interface FleetStore {
  /** 数据来源：'mock' | 'live'（live = WebSocket/Tauri 接入后切换） */
  source: 'mock' | 'live'
  /** WS 隧道状态 */
  wsConnected: boolean
  frame: FleetFrame
  /** 最近一次更新（秒） */
  updatedAt: number

  /** 由 mock 驱动逐帧更新 */
  tickMock: (t: number) => void
  /** 由 WS/Tauri 注入实时帧（待扩展接口） */
  ingestLive: (msg: FleetMessage) => void
  setSource: (s: 'mock' | 'live') => void
  setWsConnected: (v: boolean) => void
}

export const useFleetStore = create<FleetStore>((set) => ({
  source: 'mock',
  wsConnected: false,
  frame: EMPTY_FRAME(),
  updatedAt: 0,

  tickMock: (t) => set({ frame: frameAt(t), updatedAt: t, source: 'mock' }),
  ingestLive: (msg) =>
    set({ frame: msg.frame, updatedAt: msg.timestamp, source: 'live' }),
  setSource: (s) => set({ source: s }),
  setWsConnected: (v) => set({ wsConnected: v }),
}))

/** 便捷 selector：单艇状态 */
export const useUnit = (id: USVId) =>
  useFleetStore((s) => s.frame[id])