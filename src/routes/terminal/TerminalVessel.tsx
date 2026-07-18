import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { FLEET_BY_ID, roleLabel } from '@/config/fleet'
import { useFleetStore, useUnit } from '@/store/usvStore'
import { deriveVesselTelemetry } from '@/lib/telemetry'
import { FpvCanvas } from '@/components/terminal/FpvCanvas'
import { Badge, Dot, Progress } from '@/components/ui'
import type { USVId } from '@/types/usv'
import { cn } from '@/lib/utils'

const USV_IDS: USVId[] = ['USV-1', 'USV-2', 'USV-3', 'USV-4', 'USV-5', 'USV-6']

function isUsvId(v: string | undefined): v is USVId {
  return !!v && (USV_IDS as string[]).includes(v)
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
  const updatedAt = useFleetStore((s) => s.updatedAt)
  const cfg = FLEET_BY_ID[id]
  const tel = deriveVesselTelemetry(unit, updatedAt)
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
        <div className="text-right">
          <div className="font-mono text-[20px] font-700 leading-none tabular-nums text-ok">
            {tel.taskProgressPct.toFixed(0)}
            <span className="text-[12px] text-ink-faint">%</span>
          </div>
          <div className="chip mt-0.5 text-ink-faint">任务进度</div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        {/* FPV 第一人称视角（演示轨迹驱动） */}
        <section className="panel scan-sheen relative flex min-h-[300px] flex-col overflow-hidden rounded-lg">
          <FpvCanvas id={id} />

          <div className="relative z-10 flex items-start justify-between p-3">
            <Badge tone="primary">FPV · 第一人称视角</Badge>
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
            <Metric label="控制输入" value={tel.controlInput.toFixed(3)} />
            <Metric label="速度" value={unit.speed.toFixed(3)} />
          </DomainCard>
          <DomainCard title="通信域" emphasize>
            <Metric label="时延" value={`${tel.latencyMs.toFixed(1)} ms`} highlight />
            <Metric label="丢包率" value={`${tel.packetLossPct.toFixed(2)} %`} />
            <Metric label="信号强度" value={`${tel.signalDbm.toFixed(1)} dBm`} />
          </DomainCard>
          <DomainCard title="机舱域">
            <Metric label="电源电量" value={`${tel.batteryPct.toFixed(1)}%`} />
            <Progress value={tel.batteryPct} tone={tel.batteryPct < 30 ? 'warn' : 'ok'} className="mt-1" />
            <Metric label="船舱温度" value={`${tel.cabinTempC.toFixed(1)} °C`} />
          </DomainCard>
          <DomainCard title="预测与健康状态管理域">
            <Metric label="异常检测" value={tel.anomaly} />
            <Metric label="故障状态监测" value={tel.faultState} />
            <Metric label="健康状态评估" value={`${tel.healthEval.toFixed(1)}%`} />
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
      <div className="font-mono text-[13px] font-600 tabular-nums text-surface">{value}</div>
    </div>
  )
}
