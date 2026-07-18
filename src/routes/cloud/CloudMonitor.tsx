import { useEffect, useMemo, useState } from 'react'
import { FLEET } from '@/config/fleet'
import { useFleetStore } from '@/store/usvStore'
import { demoPositionAt, sampleTrajectory, TRAJECTORY_LOOP_SECONDS } from '@/lib/trajectory'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

const COLORS = ['#1a406e', '#2a5a88', '#3a6a97', '#4a82b8', '#2aba8a', '#b87522']

/** 用当前帧派生一段“历史”序列，体现长周期监测（演示用） */
function useSyntheticHistory() {
  const frame = useFleetStore((s) => s.frame)
  const updatedAt = useFleetStore((s) => s.updatedAt)

  return useMemo(() => {
    const steps = 48
    return FLEET.map((u) => {
      const base = frame[u.id]
      const healthSeries: number[] = []
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1)
        const wobble = Math.sin((updatedAt || 0) * 0.002 + i * 0.35 + u.angleDeg) * 4
        healthSeries.push(Math.max(55, Math.min(100, base.health + wobble - (1 - t) * 3)))
      }
      return { id: u.id, healthSeries }
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
            <h3 className="font-display text-[15px] font-600">历史轨迹回溯 · 全循环回放</h3>
            <Badge tone="ghost">离线复盘</Badge>
          </div>
          <HistoryReplay />
        </section>
      </div>
    </div>
  )
}

/** 全循环轨迹回放：播放 / 暂停 / 进度滑杆 / 倍速 */
function HistoryReplay() {
  const W = 560
  const H = 260
  const M = 20

  // 全 loop 采样（1.5s 步长）
  const tracks = useMemo(() => {
    const step = 1.5
    const n = Math.round(TRAJECTORY_LOOP_SECONDS / step)
    return FLEET.map((u, i) => ({
      id: u.id,
      color: COLORS[i % COLORS.length],
      pts: Array.from({ length: n + 1 }, (_, k) => demoPositionAt(u.id, k * step)),
    }))
  }, [])

  // 视图映射：screen x = 东（右），screen y = 北（上）
  const view = useMemo(() => {
    const all = tracks.flatMap((s) => s.pts)
    const minE = Math.min(...all.map((p) => p.y))
    const maxE = Math.max(...all.map((p) => p.y))
    const minN = Math.min(...all.map((p) => p.x))
    const maxN = Math.max(...all.map((p) => p.x))
    const scale = Math.min((W - 2 * M) / (maxE - minE || 1), (H - 2 * M) / (maxN - minN || 1))
    const eMid = (minE + maxE) / 2
    const nMid = (minN + maxN) / 2
    return {
      sx: (e: number) => W / 2 + (e - eMid) * scale,
      sy: (n: number) => H / 2 - (n - nMid) * scale,
    }
  }, [tracks])

  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(4)

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setT((prev) => (prev + dt * speed) % TRAJECTORY_LOOP_SECONDS)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed])

  // 当前时刻各艇状态 + 最近 12s 彗星段
  const now = useMemo(
    () =>
      tracks.map((s) => {
        const cur = sampleTrajectory(s.id, t)
        const comet = Array.from({ length: 17 }, (_, i) =>
          demoPositionAt(s.id, t - 12 + (i / 16) * 12),
        )
        return { id: s.id, color: s.color, cur, comet }
      }),
    [tracks, t],
  )

  const mm = String(Math.floor(t / 60)).padStart(2, '0')
  const ss = String(Math.floor(t % 60)).padStart(2, '0')

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5">
        <Button
          size="sm"
          variant={playing ? 'outline' : 'primary'}
          className="w-16 shrink-0"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? '暂停' : '播放'}
        </Button>
        <input
          type="range"
          min={0}
          max={TRAJECTORY_LOOP_SECONDS}
          step={0.5}
          value={t}
          onChange={(e) => setT(parseFloat(e.target.value))}
          className="min-w-0 flex-1 accent-water"
          aria-label="回放进度"
        />
        <div className="flex shrink-0 gap-1">
          {[1, 4, 8].map((v) => (
            <button
              key={v}
              onClick={() => setSpeed(v)}
              className={cn(
                'rounded-sm px-2 py-1 font-mono text-[11px] font-600 transition-colors',
                speed === v ? 'bg-water/15 text-water ring-1 ring-water/25' : 'text-ink-faint hover:bg-frost',
              )}
            >
              {v}×
            </button>
          ))}
        </div>
        <span className="shrink-0 font-mono text-[12px] font-600 text-ink-soft tabular-nums">
          {mm}:{ss}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="blueprint-bg h-auto w-full rounded-md ring-1 ring-line-soft/70"
      >
        {/* 全路径淡线 */}
        {tracks.map((s) => (
          <polyline
            key={`full-${s.id}`}
            points={s.pts.map((p) => `${view.sx(p.y)},${view.sy(p.x)}`).join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth="1"
            opacity="0.22"
          />
        ))}
        {/* 最近 12s 彗星段 */}
        {now.map((s) => (
          <polyline
            key={`comet-${s.id}`}
            points={s.comet.map((p) => `${view.sx(p.y)},${view.sy(p.x)}`).join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.75"
          />
        ))}
        {/* 当前 marker：圆点 + 航向短刻 + 艇号 */}
        {now.map((s) => {
          const cx = view.sx(s.cur.y)
          const cy = view.sy(s.cur.x)
          const tx = cx + Math.sin(s.cur.heading) * 11
          const ty = cy - Math.cos(s.cur.heading) * 11
          return (
            <g key={`cur-${s.id}`}>
              <line x1={cx} y1={cy} x2={tx} y2={ty} stroke={s.color} strokeWidth="1.6" />
              <circle cx={cx} cy={cy} r="4" fill={s.color} stroke="#fff" strokeWidth="1.2" />
              <text x={cx + 7} y={cy - 6} fontSize="10" fontWeight="700" fill={s.color}>
                {s.id.replace('USV-', '')}
              </text>
            </g>
          )
        })}
        <text x={10} y={H - 8} fontSize="9.5" fill="var(--color-ink-faint)">
          北 ↑ · 一个完整轨迹循环 {TRAJECTORY_LOOP_SECONDS}s
        </text>
      </svg>
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
            stroke={COLORS[si % COLORS.length]}
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
          fill={COLORS[si % COLORS.length]}
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
