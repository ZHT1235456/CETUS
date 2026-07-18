import type { USVId } from '@/types/usv'

/**
 * 内置演示轨迹（确定性时间函数，取代原 CSV 回放）。
 *
 * 六艇编队感设计：
 *   - USV-2 / USV-3 为两队领航艇，沿同一闭合椭圆反相位环绕（周期 150s）；
 *   - USV-5 / USV-4 分别为其跟随艇，在领航艇体坐标系内保持「后-侧」偏移，
 *     偏移量随时间缓慢呼吸，呈现三角队形 ↔ 梯队变换；
 *   - USV-1 / USV-6（虚艇）以更大偏移伴随，整体构成长循环编队。
 *
 * 坐标约定与 WS 一致：x = 北，y = 东；heading 0 = 朝 +x 北。
 */

export const TRAJECTORY_LOOP_SECONDS = 150

const TAU = Math.PI * 2
/** 作业区中心（对齐 coords.ts THEIR_CENTER：北 380 / 东 -470） */
const CENTER = { x: 380, y: -470 }
const LOOP_RX = 38
const LOOP_RY = 24

type OffsetSpec = { base: number; amp: number; period: number; phase: number }

type BoatSpec =
  | { kind: 'leader'; phase: number }
  | {
      kind: 'follower'
      leader: 'USV-2' | 'USV-3'
      back: OffsetSpec
      side: OffsetSpec
      sideSign: 1 | -1
    }

const SPECS: Record<USVId, BoatSpec> = {
  'USV-2': { kind: 'leader', phase: 0 },
  'USV-3': { kind: 'leader', phase: Math.PI },
  'USV-5': {
    kind: 'follower',
    leader: 'USV-2',
    back: { base: 5, amp: 1.75, period: 80, phase: 0 },
    side: { base: 3.25, amp: 1.75, period: 65, phase: 1.1 },
    sideSign: 1,
  },
  'USV-1': {
    kind: 'follower',
    leader: 'USV-2',
    back: { base: 8.5, amp: 2, period: 95, phase: 0.7 },
    side: { base: 5.5, amp: 2, period: 70, phase: 2.2 },
    sideSign: -1,
  },
  'USV-4': {
    kind: 'follower',
    leader: 'USV-3',
    back: { base: 5, amp: 1.75, period: 80, phase: 0.5 },
    side: { base: 3.25, amp: 1.75, period: 65, phase: 1.6 },
    sideSign: -1,
  },
  'USV-6': {
    kind: 'follower',
    leader: 'USV-3',
    back: { base: 8.5, amp: 2, period: 95, phase: 1.9 },
    side: { base: 5.5, amp: 2, period: 70, phase: 0.4 },
    sideSign: 1,
  },
}

function leaderPhase(leader: 'USV-2' | 'USV-3') {
  return leader === 'USV-2' ? 0 : Math.PI
}

function leaderPos(phase: number, t: number) {
  const th = (TAU * t) / TRAJECTORY_LOOP_SECONDS + phase
  return {
    x: CENTER.x + LOOP_RX * Math.cos(th),
    y: CENTER.y + LOOP_RY * Math.sin(th),
  }
}

function offsetAt(spec: OffsetSpec, t: number) {
  return spec.base + spec.amp * Math.sin((TAU * t) / spec.period + spec.phase)
}

/** t 时刻某艇位置（x 北 / y 东） */
export function demoPositionAt(id: USVId, t: number) {
  const spec = SPECS[id]
  if (spec.kind === 'leader') return leaderPos(spec.phase, t)
  const phase = leaderPhase(spec.leader)
  const lp = leaderPos(phase, t)
  const ahead = leaderPos(phase, t + 0.3)
  let fx = ahead.x - lp.x
  let fy = ahead.y - lp.y
  const len = Math.hypot(fx, fy) || 1
  fx /= len
  fy /= len
  const back = offsetAt(spec.back, t)
  const side = spec.sideSign * offsetAt(spec.side, t)
  // 左法向 (-fy, fx)：pos = lp - fwd·back + left·side
  return {
    x: lp.x - fx * back - fy * side,
    y: lp.y - fy * back + fx * side,
  }
}

/**
 * 采样某艇在 t 时刻的运动学状态。
 * 朝向/速度由中心差分获得（轨迹为光滑三角函数，差分足够精确）。
 */
export function sampleTrajectory(id: USVId, elapsedSeconds: number) {
  const t = Math.max(0, elapsedSeconds)
  const e = 0.08
  const before = demoPositionAt(id, t - e)
  const after = demoPositionAt(id, t + e)
  const vx = (after.x - before.x) / (2 * e)
  const vy = (after.y - before.y) / (2 * e)
  const speed = Math.hypot(vx, vy)
  const heading = Math.atan2(vy, vx)
  const p = demoPositionAt(id, t)
  return {
    x: p.x,
    y: p.y,
    fx: Math.cos(heading),
    fy: Math.sin(heading),
    heading,
    speed,
  }
}
