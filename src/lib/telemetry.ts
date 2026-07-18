import { TRAJECTORY_LOOP_SECONDS } from '@/lib/trajectory'
import type { FleetUnit } from '@/types/usv'

/**
 * 由实时帧派生的单艇演示遥测（确定性函数：同一 t 各页面读数一致）。
 * 数据分类对齐 main.tex：
 *   运行状态 = 位置 / 姿态 / 速度 / 任务进度
 *   通信状态 = 时延 / 丢包率 / 信号强度
 *   机舱状态 = 电源电量 / 船舱温度
 *   健康状态 = 异常 / 故障 / 健康评估
 */
export interface VesselTelemetry {
  latencyMs: number
  packetLossPct: number
  signalDbm: number
  batteryPct: number
  cabinTempC: number
  controlInput: number
  anomaly: string
  faultState: string
  healthEval: number
  taskProgressPct: number
}

export function deriveVesselTelemetry(unit: FleetUnit, t: number): VesselTelemetry {
  const seed = unit.id.charCodeAt(4) || 1
  const latencyMs =
    16 + (100 - unit.health) * 0.5 + Math.abs(Math.sin(unit.heading + seed)) * 10 + 3 * Math.sin(t * 0.7 + seed)
  const packetLossPct = Math.max(
    0,
    Math.min(3.2, 0.25 + (100 - unit.health) * 0.02 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.43 + seed * 2))),
  )
  const signalDbm = -58 - (100 - unit.health) * 0.12 - Math.abs(Math.sin(t * 0.31 + seed)) * 6
  const batteryPct = Math.max(18, Math.min(100, unit.health * 0.9 + 8 - unit.speed * 1.5))
  const cabinTempC = 26.5 + (100 - unit.health) * 0.04 + seed * 0.15
  const controlInput = unit.speed * 0.42 + Math.sin(unit.heading) * 0.08
  const taskProgressPct = (((t / TRAJECTORY_LOOP_SECONDS + seed * 0.13) % 1) + 1) % 1 * 100
  return {
    latencyMs,
    packetLossPct,
    signalDbm,
    batteryPct,
    cabinTempC,
    controlInput,
    anomaly: unit.isFault ? '通信/动力异常' : '无',
    faultState: unit.isFault ? unit.code ?? 'FAULT' : '正常',
    healthEval: unit.health,
    taskProgressPct,
  }
}
