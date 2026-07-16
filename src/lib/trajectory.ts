import trajectoryUSV2 from '../../assets/trajecytory/trajectory1对应USV2.csv?raw'
import trajectoryUSV3 from '../../assets/trajecytory/trajectory2对应USV3.csv?raw'
import trajectoryVirtual1 from '../../assets/trajecytory/trajectory3对应虚拟节点1.csv?raw'
import trajectoryVirtual6 from '../../assets/trajecytory/trajectory4对应虚拟节点6.csv?raw'
import trajectoryUSV4 from '../../assets/trajecytory/trajectory5对应USV4.csv?raw'
import trajectoryUSV5 from '../../assets/trajecytory/trajectory6对应USV5.csv?raw'
import type { USVId } from '@/types/usv'

const configuredSampleInterval = Number(
  import.meta.env.VITE_TRAJECTORY_SAMPLE_INTERVAL_SECONDS ?? 0.1,
)

if (!Number.isFinite(configuredSampleInterval) || configuredSampleInterval <= 0) {
  throw new Error('VITE_TRAJECTORY_SAMPLE_INTERVAL_SECONDS 必须是大于 0 的有限数值')
}

/** CSV 无时间列；默认按 0.1 秒/点回放，可由同名 Vite 环境变量覆盖。 */
export const TRAJECTORY_SAMPLE_INTERVAL_SECONDS = configuredSampleInterval

export interface TrajectoryPoint {
  x: number
  y: number
}

const RAW_TRAJECTORIES: Record<USVId, string> = {
  'USV-1': trajectoryVirtual1,
  'USV-2': trajectoryUSV2,
  'USV-3': trajectoryUSV3,
  'USV-4': trajectoryUSV4,
  'USV-5': trajectoryUSV5,
  'USV-6': trajectoryVirtual6,
}

function parseTrajectory(id: USVId, csv: string): readonly TrajectoryPoint[] {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.shift()?.trim().toLowerCase() !== 'x,y') {
    throw new Error(`${id} 轨迹缺少 x,y 表头`)
  }

  const points = lines.map((line, index) => {
    const [xRaw, yRaw, ...extra] = line.split(',')
    if (xRaw?.trim() === '' || yRaw?.trim() === '') {
      throw new Error(`${id} 轨迹第 ${index + 2} 行坐标不能为空`)
    }
    const x = Number(xRaw)
    const y = Number(yRaw)
    if (extra.length > 0 || !Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`${id} 轨迹第 ${index + 2} 行格式无效`)
    }
    return { x, y }
  })

  if (points.length < 2) throw new Error(`${id} 轨迹至少需要两个点`)
  return points
}

export const TRAJECTORIES = Object.fromEntries(
  Object.entries(RAW_TRAJECTORIES).map(([id, csv]) => [id, parseTrajectory(id as USVId, csv)]),
) as Record<USVId, readonly TrajectoryPoint[]>

function directionAt(points: readonly TrajectoryPoint[], index: number) {
  const origin = points[index]

  for (let i = index + 1; i < points.length; i += 1) {
    const dx = points[i].x - origin.x
    const dy = points[i].y - origin.y
    const length = Math.hypot(dx, dy)
    if (length > 0) return { fx: dx / length, fy: dy / length }
  }

  for (let i = index - 1; i >= 0; i -= 1) {
    const dx = origin.x - points[i].x
    const dy = origin.y - points[i].y
    const length = Math.hypot(dx, dy)
    if (length > 0) return { fx: dx / length, fy: dy / length }
  }

  return { fx: 1, fy: 0 }
}

export function sampleTrajectory(id: USVId, elapsedSeconds: number) {
  if (!Number.isFinite(elapsedSeconds)) {
    throw new Error(`${id} 轨迹采样时间必须是有限数值`)
  }
  const points = TRAJECTORIES[id]
  const samplePosition = Math.max(0, elapsedSeconds) / TRAJECTORY_SAMPLE_INTERVAL_SECONDS
  const fromIndex = Math.min(Math.floor(samplePosition), points.length - 1)
  const toIndex = Math.min(fromIndex + 1, points.length - 1)
  const alpha = Math.min(samplePosition - fromIndex, 1)
  const from = points[fromIndex]
  const to = points[toIndex]
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.hypot(dx, dy)
  const direction = distance > 0
    ? { fx: dx / distance, fy: dy / distance }
    : directionAt(points, fromIndex)

  return {
    x: from.x + dx * alpha,
    y: from.y + dy * alpha,
    fx: direction.fx,
    fy: direction.fy,
    heading: Math.atan2(direction.fy, direction.fx),
    speed: toIndex === fromIndex ? 0 : distance / TRAJECTORY_SAMPLE_INTERVAL_SECONDS,
  }
}
