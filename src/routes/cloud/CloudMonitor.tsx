import { useMemo } from 'react'
import { FLEET } from '@/config/fleet'
import { useFleetStore } from '@/store/usvStore'
import { Badge } from '@/components/ui'

/** 用当前帧派生一段“历史”序列，体现长周期监测（演示用） */
function useSyntheticHistory() {
  const frame = useFleetStore((s) => s.frame)
  const updatedAt = useFleetStore((s) => s.updatedAt)

  return useMemo(() => {
    const steps = 48
    return FLEET.map((u) => {
      const base = frame[u.id]
      const healthSeries: number[] = []
      const trail: { x: number; y: number }[] = []
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1)
        const wobble = Math.sin((updatedAt || 0) * 0.002 + i * 0.35 + u.angleDeg) * 4
        healthSeries.push(Math.max(55, Math.min(100, base.health + wobble - (1 - t) * 3)))
        trail.push({
          x: base.x - Math.cos(base.heading) * (steps - i) * 1.8,
          y: base.y - Math.sin(base.heading) * (steps - i) * 1.8,
        })
      }
      return { id: u.id, healthSeries, trail, health: base.health }
    })
  }, [frame, updatedAt])
}

export default function CloudMonitor() {
  const history = useSyntheticHistory()

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto px-6 py-4">
      <header>
        <div className="label-eyebrow">Monitor · History</div>
        <h2 className="mt-1 font-display text-[20px] font-600 text-ink">状态检测与历史回溯</h2>
        <p className="mt-1 max-w-3xl text-[13px] text-ink-soft">
          实时监测服务在线决策；历史过程回溯仅用于复盘与定位，
          <span className="font-600 text-ink">不向集群决策提供在线输入</span>。
        </p>
        <div className="mt-2 flex gap-2">
          <Badge tone="ok">实时态势</Badge>
          <Badge tone="ghost">历史回溯（离线）</Badge>
        </div>
      </header>

      <div className="stagger grid gap-4 lg:grid-cols-2">
        <section className="panel rounded-lg p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-[15px] font-600">健康状态 · 长周期曲线</h3>
            <Badge tone="ok">48 采样点</Badge>
          </div>
          <div className="blueprint-bg rounded-md ring-1 ring-line-soft/70">
            <HealthChart series={history} />
          </div>
        </section>
        <section className="panel rounded-lg p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-[15px] font-600">历史轨迹回溯</h3>
            <Badge tone="ghost">离线复盘</Badge>
          </div>
          <TrailChart series={history} />
        </section>
      </div>
    </div>
  )
}

function HealthChart({
  series,
}: {
  series: { id: string; healthSeries: number[] }[]
}) {
  const W = 560
  const H = 240
  const colors = ['#1a406e', '#2a5a88', '#3a6a97', '#4a82b8', '#2aba8a', '#b87522']

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      {[0, 25, 50, 75, 100].map((v) => {
        const y = H - 20 - (v / 100) * (H - 40)
        return (
          <g key={v}>
            <line x1={40} y1={y} x2={W - 10} y2={y} stroke="var(--color-line-soft)" />
            <text x={8} y={y + 3} fontSize="10" fill="var(--color-ink-faint)">
              {v}
            </text>
          </g>
        )
      })}
      {series.map((s, si) => {
        const pts = s.healthSeries
          .map((h, i) => {
            const x = 40 + (i / (ptsLen(s.healthSeries) - 1)) * (W - 50)
            const y = H - 20 - (h / 100) * (H - 40)
            return `${x},${y}`
          })
          .join(' ')
        return (
          <polyline
            key={s.id}
            points={pts}
            fill="none"
            stroke={colors[si % colors.length]}
            strokeWidth="1.8"
          />
        )
      })}
      {series.map((s, si) => (
        <text
          key={`l-${s.id}`}
          x={48 + si * 85}
          y={16}
          fontSize="11"
          fill={colors[si % colors.length]}
          fontWeight="600"
        >
          {s.id.replace('USV-', 'U')}
        </text>
      ))}
    </svg>
  )
}

function ptsLen(a: number[]) {
  return Math.max(a.length, 2)
}

function TrailChart({
  series,
}: {
  series: { id: string; trail: { x: number; y: number }[] }[]
}) {
  const all = series.flatMap((s) => s.trail)
  const minX = Math.min(...all.map((p) => p.x)) - 5
  const maxX = Math.max(...all.map((p) => p.x)) + 5
  const minY = Math.min(...all.map((p) => p.y)) - 5
  const maxY = Math.max(...all.map((p) => p.y)) + 5
  const W = 560
  const H = 240
  const sx = (x: number) => ((x - minX) / (maxX - minX || 1)) * (W - 30) + 15
  const sy = (y: number) => H - (((y - minY) / (maxY - minY || 1)) * (H - 30) + 15)
  const colors = ['#1a406e', '#2a5a88', '#3a6a97', '#4a82b8', '#2aba8a', '#b87522']

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full rounded-md bg-frost/30">
      {series.map((s, si) => {
        const d = s.trail.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x)} ${sy(p.y)}`).join(' ')
        const last = s.trail[s.trail.length - 1]
        return (
          <g key={s.id}>
            <path d={d} fill="none" stroke={colors[si % colors.length]} strokeWidth="1.6" opacity="0.85" />
            <circle cx={sx(last.x)} cy={sy(last.y)} r="4" fill={colors[si % colors.length]} />
          </g>
        )
      })}
    </svg>
  )
}
