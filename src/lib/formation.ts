import { FORMATION_RADIUS, FLEET } from '@/config/fleet'
import { THEIR_CENTER } from '@/lib/coords'
import type { FleetFrame, USVId } from '@/types/usv'

/** 编队圆心（对方：北 / 东） */
export const FORMATION_CENTER = { x: THEIR_CENTER.x, y: THEIR_CENTER.y }
/** 编队旋转角速度（弧度/秒），逆时针慢转；半径增大后略降 */
export const FORMATION_OMEGA = 0.035
/** 各艇沿编队方向的额外前进微动（单位/秒） */
export const BOAT_FORWARD = 0.0

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

const toRad = (d: number) => (d * Math.PI) / 180

/**
 * 计算 t 时刻的编队运动学（对方水平面：X 北 / Y 东）。
 * - 整体编队绕中心逆时针慢转 ωt
 * - 每艇沿切线方向航行，航速 = R·ω
 * 后续接 WS 实时位姿时，停止调用此函数即可。
 */
export function formationAt(t: number): Record<USVId, BoatKinematics> {
  const ω = FORMATION_OMEGA
  const out = {} as Record<USVId, BoatKinematics>
  for (const u of FLEET) {
    const φ = toRad(u.angleDeg) + ω * t
    const x = FORMATION_CENTER.x + Math.cos(φ) * FORMATION_RADIUS
    const y = FORMATION_CENTER.y + Math.sin(φ) * FORMATION_RADIUS
    // 切线方向（逆时针）：d/dφ (cosφ, sinφ) = (-sinφ, cosφ) → (北, 东)
    const fx = -Math.sin(φ)
    const fy = Math.cos(φ)
    const heading = Math.atan2(fy, fx)
    const speed = FORMATION_RADIUS * ω + BOAT_FORWARD
    out[u.id] = { id: u.id, x, y, fx, fy, heading, speed }
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
  const k = formationAt(t)
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
