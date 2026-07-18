import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { VesselTelemetry } from '@/lib/telemetry'

/**
 * 艇遥测仪表盘组件库（纯 SVG/CSS）。
 * 视觉语言统一：地平球 / 弧形表 / 径向环 / 刻度条 / 柱状格 / sparkline。
 * 数据全部来自 deriveVesselTelemetry（端侧同源）。
 */

/** bento 小卡：卡名 + 所属域标签，内容区垂直居中（配合 auto-rows-fr 填满行高） */
export function GaugeCard({
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
        'flex flex-col rounded-md border border-line-soft bg-surface/75 px-3 py-2.5 transition-shadow duration-300 hover:shadow-1',
        className,
      )}
    >
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="font-display text-[12.5px] font-600 text-ink">{title}</span>
        <span className="chip text-ink-ghost">{domain}</span>
      </div>
      <div className="flex flex-1 flex-col justify-center">{children}</div>
    </div>
  )
}

/** 文本读数行 */
export function GaugeMetric({
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

/** 姿态迷你地平球：滚转转盘 + 纵摇平移 */
export function AttitudeBall({
  pitchDeg,
  rollDeg,
  className,
}: {
  pitchDeg: number
  rollDeg: number
  className?: string
}) {
  const clipId = useId()
  const pitchPx = Math.max(-12, Math.min(12, pitchDeg * 2.2))
  return (
    <svg viewBox="0 0 64 64" className={cn('shrink-0', className)}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="32" cy="32" r="26" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
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
export function SpeedGauge({
  speed,
  max = 4,
  className,
}: {
  speed: number
  max?: number
  className?: string
}) {
  const ARC = Math.PI * 26 // 半圆弧长
  const ratio = Math.max(0, Math.min(1, speed / max))
  return (
    <svg viewBox="0 0 64 40" className={cn('shrink-0', className)}>
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

/** 径向圆环（电量 / 健康 / 进度共用） */
export function RadialRing({
  pct,
  stroke,
  text,
  className,
}: {
  pct: number
  stroke: string
  text: string
  className?: string
}) {
  const R = 24
  const C = 2 * Math.PI * R
  const ratio = Math.max(0, Math.min(1, pct / 100))
  return (
    <svg viewBox="0 0 64 64" className={cn('shrink-0', className)}>
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
export function TempScale({ valueC, className }: { valueC: number; className?: string }) {
  const MIN = 20
  const MAX = 40
  const ratio = Math.max(0, Math.min(1, (valueC - MIN) / (MAX - MIN)))
  return (
    <div className={cn('mb-2 mt-1 px-0.5', className)}>
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
export function SignalBars({ dbm, className }: { dbm: number; className?: string }) {
  const bars = Math.max(1, Math.min(5, Math.round((dbm + 85) / 7)))
  return (
    <div
      className={cn(
        'flex shrink-0 items-end justify-center gap-1 rounded-md border border-line-soft/70 bg-surface/60 p-2',
        className,
      )}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn('w-1.5 rounded-[1.5px]', i <= bars ? 'bg-water' : 'bg-line-soft/70')}
          style={{ height: `${18 + i * 16}%` }}
        />
      ))}
    </div>
  )
}

/** 细 sparkline（最近 N 个派生采样） */
export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pts = data
    .map(
      (v, i) =>
        `${((i / (data.length - 1)) * 100).toFixed(1)},${(26 - ((v - min) / span) * 22).toFixed(1)}`,
    )
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

/* ── 组合件 ────────────────────────────────────────────────── */

const STRIP_GAUGE = { sm: 'h-10 w-10', md: 'h-14 w-14' } as const

/**
 * 紧凑单行仪表组：姿态 / 航速 / 电量 / 信号 四联。
 * 窄版面（侧栏、小卡）用 size="sm"，宽卡用 size="md"。
 */
export function VesselGaugeStrip({
  tel,
  speed,
  size = 'md',
  className,
}: {
  tel: VesselTelemetry
  speed: number
  size?: keyof typeof STRIP_GAUGE
  className?: string
}) {
  const g = STRIP_GAUGE[size]
  return (
    <div className={cn('flex items-start justify-between gap-1.5', className)}>
      <GaugeCell label="姿态">
        <AttitudeBall pitchDeg={tel.pitchDeg} rollDeg={tel.rollDeg} className={g} />
      </GaugeCell>
      <GaugeCell label="航速">
        <SpeedGauge speed={speed} className={g} />
      </GaugeCell>
      <GaugeCell label="电量">
        <RadialRing
          pct={tel.batteryPct}
          stroke={tel.batteryPct < 30 ? 'var(--color-warn)' : 'var(--color-ok)'}
          text={`${tel.batteryPct.toFixed(0)}%`}
          className={g}
        />
      </GaugeCell>
      <GaugeCell label="信号">
        <SignalBars dbm={tel.signalDbm} className={g} />
      </GaugeCell>
    </div>
  )
}

function GaugeCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5">
      {children}
      <span className="chip text-ink-ghost">{label}</span>
    </div>
  )
}
