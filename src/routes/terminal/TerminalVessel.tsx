import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { FLEET_BY_ID, roleLabel } from '@/config/fleet'
import { useFleetStore, useUnit } from '@/store/usvStore'
import { deriveVesselTelemetry } from '@/lib/telemetry'
import { FpvCanvas } from '@/components/terminal/FpvCanvas'
import { Badge, Dot } from '@/components/ui'
import type { USVId } from '@/types/usv'
import { cn } from '@/lib/utils'

const USV_IDS: USVId[] = ['USV-1', 'USV-2', 'USV-3', 'USV-4', 'USV-5', 'USV-6']

/** 通信 sparkline 采样数与间隔（秒） */
const SPARK_N = 24
const SPARK_DT = 0.9

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

  // 最近 N 个派生采样（确定性函数，随 updatedAt 滚动）
  const latencySeries = Array.from({ length: SPARK_N }, (_, i) =>
    deriveVesselTelemetry(unit, updatedAt - (SPARK_N - 1 - i) * SPARK_DT).latencyMs,
  )
  const lossSeries = Array.from({ length: SPARK_N }, (_, i) =>
    deriveVesselTelemetry(unit, updatedAt - (SPARK_N - 1 - i) * SPARK_DT).packetLossPct,
  )

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

        {/* 遥测 bento 仪表盘（五域分组，视觉融合为小卡） */}
        <section className="stagger grid content-start grid-cols-2 gap-2.5 xl:grid-cols-3">
          <BentoCard title="姿态" domain="运动控制">
            <div className="flex items-center gap-3">
              <AttitudeBall pitchDeg={tel.pitchDeg} rollDeg={tel.rollDeg} />
              <div className="min-w-0 flex-1">
                <Metric label="纵摇" value={`${tel.pitchDeg.toFixed(1)}°`} />
                <Metric label="横摇" value={`${tel.rollDeg.toFixed(1)}°`} />
                <Metric label="控制输入" value={tel.controlInput.toFixed(3)} />
              </div>
            </div>
          </BentoCard>

          <BentoCard title="航速" domain="运行状态">
            <div className="flex items-center gap-3">
              <SpeedGauge speed={unit.speed} max={4} />
              <div className="min-w-0 flex-1">
                <Metric label="航速" value={`${unit.speed.toFixed(2)} m/s`} highlight />
                <Metric label="航向" value={`${hdgDeg.toFixed(1)}°`} />
              </div>
            </div>
          </BentoCard>

          <BentoCard title="位置" domain="感知">
            <Metric label="位置 · 北" value={unit.x.toFixed(2)} />
            <Metric label="位置 · 东" value={unit.y.toFixed(2)} />
            <Metric label="姿态 · 航向" value={`${hdgDeg.toFixed(1)}°`} />
          </BentoCard>

          <BentoCard title="电源电量" domain="机舱">
            <div className="flex items-center gap-3">
              <RadialRing
                pct={tel.batteryPct}
                stroke={tel.batteryPct < 30 ? 'var(--color-warn)' : 'var(--color-ok)'}
                text={`${tel.batteryPct.toFixed(0)}%`}
              />
              <div className="min-w-0 flex-1">
                <Metric label="剩余电量" value={`${tel.batteryPct.toFixed(1)}%`} highlight />
                <Metric label="状态" value={tel.batteryPct < 30 ? '偏低' : '正常'} />
              </div>
            </div>
          </BentoCard>

          <BentoCard title="船舱温度" domain="机舱">
            <TempScale valueC={tel.cabinTempC} />
            <Metric label="舱温" value={`${tel.cabinTempC.toFixed(1)} °C`} highlight />
          </BentoCard>

          <BentoCard title="信号强度" domain="通信">
            <div className="flex items-center gap-3">
              <SignalBars dbm={tel.signalDbm} />
              <div className="min-w-0 flex-1">
                <Metric label="信号" value={`${tel.signalDbm.toFixed(1)} dBm`} highlight />
                <Metric label="链路" value={tel.signalDbm > -70 ? '良好' : '偏弱'} />
              </div>
            </div>
          </BentoCard>

          <BentoCard title="时延 · 丢包" domain="通信" className="col-span-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11.5px] text-ink-faint">时延</span>
                  <span className="font-mono text-[13px] font-700 tabular-nums text-primary">
                    {tel.latencyMs.toFixed(1)} ms
                  </span>
                </div>
                <Sparkline data={latencySeries} className="mt-1 h-7 w-full text-water" />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11.5px] text-ink-faint">丢包率</span>
                  <span className="font-mono text-[13px] font-700 tabular-nums text-ink">
                    {tel.packetLossPct.toFixed(2)} %
                  </span>
                </div>
                <Sparkline data={lossSeries} className="mt-1 h-7 w-full text-ink-faint" />
              </div>
            </div>
          </BentoCard>

          <BentoCard title="健康状态" domain="预测与健康">
            <div className="flex items-center gap-3">
              <RadialRing
                pct={tel.healthEval}
                stroke={
                  unit.isFault
                    ? 'var(--color-accent)'
                    : tel.healthEval >= 90
                      ? 'var(--color-ok)'
                      : 'var(--color-warn)'
                }
                text={`${tel.healthEval.toFixed(0)}`}
              />
              <div className="min-w-0 flex-1">
                <Metric label="异常检测" value={tel.anomaly} />
                <Metric label="故障状态" value={tel.faultState} />
              </div>
            </div>
          </BentoCard>
        </section>
      </div>
    </div>
  )
}

/** bento 小卡：卡名 + 所属域标签 */
function BentoCard({
  title,
  domain,
  children,
  className,
}: {
  title: string
  domain: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-md border border-line-soft bg-surface/75 px-3 py-2.5 transition-shadow duration-300 hover:shadow-1',
        className,
      )}
    >
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="font-display text-[12.5px] font-600 text-ink">{title}</span>
        <span className="chip text-ink-ghost">{domain}</span>
      </div>
      {children}
    </div>
  )
}

/** 姿态迷你地平球：滚转转盘 + 纵摇平移 */
function AttitudeBall({ pitchDeg, rollDeg }: { pitchDeg: number; rollDeg: number }) {
  const pitchPx = Math.max(-12, Math.min(12, pitchDeg * 2.2))
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0">
      <defs>
        <clipPath id="att-clip">
          <circle cx="32" cy="32" r="26" />
        </clipPath>
      </defs>
      <g clipPath="url(#att-clip)">
        <g transform={`rotate(${-rollDeg} 32 32) translate(0 ${pitchPx})`}>
          <rect x="-24" y="-24" width="112" height="56" fill="#9cc7ec" />
          <rect x="-24" y="32" width="112" height="56" fill="#d3b285" />
          <rect x="-24" y="31" width="112" height="2" fill="#5b7a96" />
        </g>
        <line x1="14" y1="32" x2="27" y2="32" stroke="#1a406e" strokeWidth="2.6" strokeLinecap="round" />
        <line x1="37" y1="32" x2="50" y2="32" stroke="#1a406e" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="32" cy="32" r="1.9" fill="#1a406e" />
      </g>
      <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(26,64,110,0.35)" strokeWidth="1.6" />
      <circle cx="32" cy="32" r="29" fill="none" stroke="rgba(26,64,110,0.14)" strokeWidth="1" />
    </svg>
  )
}

/** 航速弧形表（半圆 0..max m/s） */
function SpeedGauge({ speed, max }: { speed: number; max: number }) {
  const ARC = Math.PI * 26 // 半圆弧长
  const ratio = Math.max(0, Math.min(1, speed / max))
  return (
    <svg viewBox="0 0 64 40" className="h-16 w-16 shrink-0">
      <path
        d="M6 34 A26 26 0 0 1 58 34"
        fill="none"
        stroke="rgba(26,64,110,0.14)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M6 34 A26 26 0 0 1 58 34"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${ratio * ARC} ${ARC}`}
      />
      <text
        x="32"
        y="33"
        textAnchor="middle"
        className="font-mono"
        fill="var(--color-ink)"
        fontSize="11"
        fontWeight="700"
      >
        {speed.toFixed(1)}
      </text>
      <text x="32" y="39.5" textAnchor="middle" fill="var(--color-ink-faint)" fontSize="4.6">
        m/s
      </text>
    </svg>
  )
}

/** 径向圆环（电量 / 健康共用） */
function RadialRing({ pct, stroke, text }: { pct: number; stroke: string; text: string }) {
  const R = 24
  const C = 2 * Math.PI * R
  const ratio = Math.max(0, Math.min(1, pct / 100))
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0">
      <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(26,64,110,0.12)" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={R}
        fill="none"
        stroke={stroke}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${ratio * C} ${C}`}
        transform="rotate(-90 32 32)"
      />
      <text
        x="32"
        y="36.5"
        textAnchor="middle"
        className="font-mono"
        fill="var(--color-ink)"
        fontSize="13"
        fontWeight="700"
      >
        {text}
      </text>
    </svg>
  )
}

/** 船舱温度刻度条（20..40 °C） */
function TempScale({ valueC }: { valueC: number }) {
  const MIN = 20
  const MAX = 40
  const ratio = Math.max(0, Math.min(1, (valueC - MIN) / (MAX - MIN)))
  return (
    <div className="mb-2 mt-1 px-0.5">
      <div className="relative h-2 rounded-full bg-gradient-to-r from-water/50 via-warn/50 to-accent/60">
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-ink shadow-1"
          style={{ left: `${ratio * 100}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[9px] tabular-nums text-ink-ghost">
        <span>20</span>
        <span>25</span>
        <span>30</span>
        <span>35</span>
        <span>40</span>
      </div>
    </div>
  )
}

/** 信号强度柱状格（-85..-50 dBm → 1..5 格） */
function SignalBars({ dbm }: { dbm: number }) {
  const bars = Math.max(1, Math.min(5, Math.round((dbm + 85) / 7)))
  return (
    <div className="flex h-16 w-16 shrink-0 items-end justify-center gap-1 rounded-md border border-line-soft/70 bg-surface/60 px-2 py-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            'w-1.5 rounded-[1.5px]',
            i <= bars ? 'bg-water' : 'bg-line-soft/70',
          )}
          style={{ height: `${18 + i * 16}%` }}
        />
      ))}
    </div>
  )
}

/** 细 sparkline（最近 N 个派生采样） */
function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pts = data
    .map((v, i) => `${((i / (data.length - 1)) * 100).toFixed(1)},${(26 - ((v - min) / span) * 22).toFixed(1)}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={className}>
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
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
