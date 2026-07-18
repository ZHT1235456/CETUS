/** 演示轨迹到舰队状态的组装边界。 */
import { FLEET } from '@/config/fleet'
import { sampleTrajectory } from '@/lib/trajectory'
import type { FleetFrame, USVId } from '@/types/usv'

export interface BoatKinematics {
  id: USVId
  /** 北 */
  x: number
  /** 东 */
  y: number
  /** 船首方向单位向量（北 / 东） */
  fx: number
  fy: number
  heading: number
  speed: number
}

/**
 * 由内置演示轨迹（确定性时间函数）计算 t 时刻的编队运动学（水平面：X 北 / Y 东）。
 */
export function trajectoryAt(t: number): Record<USVId, BoatKinematics> {
  const out = {} as Record<USVId, BoatKinematics>
  for (const u of FLEET) {
    out[u.id] = { id: u.id, ...sampleTrajectory(u.id, t) }
  }
  return out
}

/** mock 健康/故障：缓慢呼吸波动，全部"无故障"。
 *  后续由 WS 推送真实值时整体替换。 */
export function mockFaultAt(t: number): Record<USVId, { isFault: boolean; health: number }> {
  const out = {} as Record<USVId, { isFault: boolean; health: number }>
  for (const u of FLEET) {
    const base = u.role === 'virtual' ? 100 : 94
    const wob = u.role === 'virtual' ? 0 : 4 * (0.5 + 0.5 * Math.sin(t * 0.4 + u.angleDeg))
    out[u.id] = { isFault: false, health: Math.max(60, Math.round((base + wob) * 10) / 10) }
  }
  return out
}

/** 组装成完整 FleetFrame（对方：X 北 / Y 东 / Z 天） */
export function frameAt(t: number): FleetFrame {
  const k = trajectoryAt(t)
  const f = mockFaultAt(t)
  const frame = {} as FleetFrame
  for (const idStr of Object.keys(k) as USVId[]) {
    frame[idStr] = {
      id: idStr,
      x: k[idStr].x,
      y: k[idStr].y,
      z: 0,
      heading: k[idStr].heading,
      speed: k[idStr].speed,
      isFault: f[idStr].isFault,
      health: f[idStr].health,
    }
  }
  return frame
}
