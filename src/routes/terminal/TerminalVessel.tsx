import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { FLEET_BY_ID, roleLabel } from '@/config/fleet'
import { useUnit } from '@/store/usvStore'
import { Badge, Dot, Progress } from '@/components/ui'
import { TerminalVesselSwitcher } from './TerminalLayout'
import type { FleetUnit, USVId } from '@/types/usv'
import { cn } from '@/lib/utils'

const USV_IDS: USVId[] = ['USV-1', 'USV-2', 'USV-3', 'USV-4', 'USV-5', 'USV-6']

function isUsvId(v: string | undefined): v is USVId {
  return !!v && (USV_IDS as string[]).includes(v)
}

/** 由现有遥测派生艇端演示量（未接真值时） */
export function deriveTerminalTelemetry(unit: FleetUnit) {
  const seed = unit.id.charCodeAt(4) || 1
  const latencyMs = 18 + (100 - unit.health) * 0.55 + Math.abs(Math.sin(unit.heading + seed)) * 12
  const batteryPct = Math.max(18, Math.min(100, unit.health * 0.9 + 8 - unit.speed * 1.5))
  const cabinTempC = 26.5 + (100 - unit.health) * 0.04 + seed * 0.15
  const controlInput = unit.speed * 0.42 + Math.sin(unit.heading) * 0.08
  return {
    latencyMs,
    batteryPct,
    cabinTempC,
    controlInput,
    anomaly: unit.isFault ? '通信/动力异常' : '无',
    faultState: unit.isFault ? unit.code ?? 'FAULT' : '正常',
    healthEval: unit.health,
  }
}

export default function TerminalVessel() {
  const { usvId } = useParams()
  if (!isUsvId(usvId)) {
    return <Navigate to="/terminal/overview" replace />
  }
  return <VesselPanel id={usvId} />
}

function VesselPanel({ id }: { id: USVId }) {
  const unit = useUnit(id)
  const cfg = FLEET_BY_ID[id]
  const tel = deriveTerminalTelemetry(unit)
  const hdgDeg = ((unit.heading * 180) / Math.PI + 360) % 360

  return (
    <div className="flex h-full min-h-0 flex-col gap-3.5 overflow-auto px-6 pt-4 pb-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="label-eyebrow">Single USV</span>
            <Badge tone="water">{roleLabel(cfg.role)}</Badge>
            <Dot tone={unit.isFault ? 'alert' : 'ok'} pulse={unit.isFault} />
          </div>
          <h2 className="mt-1 font-display text-[22px] font-700 text-ink">{id}</h2>
        </div>
        <TerminalVesselSwitcher />
      </header>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        {/* 2D 第一人称监控占位 — 不上 3D */}
        <section className="panel scan-sheen relative flex min-h-[280px] flex-col overflow-hidden rounded-lg">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, #7eb6d9 0%, #a8cfe6 38%, #3d6b8a 38.2%, #2a4a66 100%)',
            }}
          />
          <div
            className="absolute inset-x-0 top-[38%] h-[62%] opacity-40"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(255,255,255,0.12) 18px, rgba(255,255,255,0.12) 19px)',
            }}
          />
          {/* horizon heading cue */}
          <div className="absolute left-1/2 top-[36%] h-0.5 w-24 -translate-x-1/2 bg-surface/80" />
          <div className="absolute left-1/2 top-[34%] -translate-x-1/2 font-mono text-[11px] text-surface">
            HDG {hdgDeg.toFixed(0)}°
          </div>

          <div className="relative z-10 flex items-start justify-between p-3">
            <Badge tone="ghost">模拟监控 · 后期换视频</Badge>
            <span className="rounded-sm bg-ink/45 px-2 py-1 font-mono text-[11px] text-surface">
              CAM-FWD · {id}
            </span>
          </div>

          <div className="relative z-10 mt-auto grid grid-cols-3 gap-2 p-3">
            <HudChip label="SPD" value={`${unit.speed.toFixed(2)}`} />
            <HudChip label="HDG" value={`${hdgDeg.toFixed(1)}°`} />
            <HudChip label="LAT" value={`${tel.latencyMs.toFixed(0)} ms`} />
          </div>
        </section>

        <section className="stagger flex flex-col gap-2.5">
          <DomainCard title="感知域">
            <Metric label="位置 · 北" value={unit.x.toFixed(2)} />
            <Metric label="位置 · 东" value={unit.y.toFixed(2)} />
            <Metric label="姿态 · 航向" value={`${hdgDeg.toFixed(1)}°`} />
          </DomainCard>
          <DomainCard title="运动控制域">
            <Metric label="速度" value={unit.speed.toFixed(3)} />
            <Metric label="控制输入" value={tel.controlInput.toFixed(3)} />
          </DomainCard>
          <DomainCard title="通信域" emphasize>
            <Metric label="时延" value={`${tel.latencyMs.toFixed(1)} ms`} highlight />
            <p className="mt-1 text-[11px] text-ink-faint">本演示以时延为主要量化指标</p>
          </DomainCard>
          <DomainCard title="机能域">
            <Metric label="电源电量" value={`${tel.batteryPct.toFixed(1)}%`} />
            <Progress value={tel.batteryPct} tone={tel.batteryPct < 30 ? 'warn' : 'ok'} className="mt-1" />
            <Metric label="船舱温度" value={`${tel.cabinTempC.toFixed(1)} °C`} />
          </DomainCard>
          <DomainCard title="决策与运行状态管理域">
            <Metric label="异常检测" value={tel.anomaly} />
            <Metric label="故障状态" value={tel.faultState} />
            <Metric label="健康评估" value={`${tel.healthEval.toFixed(1)}%`} />
            <Progress
              value={tel.healthEval}
              tone={unit.isFault ? 'alert' : tel.healthEval >= 90 ? 'ok' : 'warn'}
              className="mt-1"
            />
          </DomainCard>
        </section>
      </div>
    </div>
  )
}

function DomainCard({
  title,
  children,
  emphasize,
}: {
  title: string
  children: ReactNode
  emphasize?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-md border bg-surface/75 px-3 py-2.5 transition-shadow duration-300 hover:shadow-1',
        emphasize ? 'border-primary/30 shadow-1' : 'border-line-soft',
      )}
    >
      <div className="mb-1.5 font-display text-[12.5px] font-600 text-ink">{title}</div>
      {children}
    </div>
  )
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-[11.5px] text-ink-faint">{label}</span>
      <span
        className={cn(
          'font-mono text-[12.5px] font-600 tabular-nums',
          highlight ? 'text-primary' : 'text-ink',
        )}
      >
        {value}
      </span>
    </div>
  )
}

function HudChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-ink/50 px-2 py-1.5 text-center backdrop-blur-sm">
      <div className="font-mono text-[9px] tracking-wider text-surface/70">{label}</div>
      <div className="font-mono text-[13px] font-600 text-surface">{value}</div>
    </div>
  )
}
