import { FLEET } from '@/config/fleet'
import { useFleetStore } from '@/store/usvStore'
import { Badge, Dot, Progress } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function CloudDecision() {
  const frame = useFleetStore((s) => s.frame)
  const faults = FLEET.filter((u) => frame[u.id].isFault)
  const avgHealth =
    FLEET.reduce((a, u) => a + frame[u.id].health, 0) / FLEET.length

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto px-6 py-4">
      <header>
        <div className="label-eyebrow">Cluster Decision</div>
        <h2 className="mt-1 font-display text-[20px] font-600 text-ink">集群决策</h2>
        <p className="mt-1 max-w-3xl text-[13px] text-ink-soft">
          仅使用当前集群态势：全局航迹规划、任务重规划、应急响应与接管。不读取全生命周期档案。
        </p>
      </header>

      <div className="stagger grid gap-4 lg:grid-cols-3">
        <DecisionCard
          title="全局航迹规划"
          body="面向任务区域确定各艇/艇组总体航行路径，形成可下发边侧的全局航迹。"
          status="运行中"
          tone="ok"
        />
        <DecisionCard
          title="任务重规划"
          body={
            faults.length > 0
              ? `检测到 ${faults.length} 艘异常艇，触发可用性重分配与航迹更新。`
              : '当前六艇可用，维持既定任务分配与航迹版本。'
          }
          status={faults.length > 0 ? '重规划就绪' : '稳态'}
          tone={faults.length > 0 ? 'warn' : 'ok'}
        />
        <DecisionCard
          title="应急响应与接管"
          body="严重故障、边侧不可用或人工请求时，经直达链路向端侧下发高优先级接管指令。"
          status="待命"
          tone="ghost"
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[58%_42%]">
        <GlobalTrackSketch />

        <section className="panel rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-[15px] font-600 text-ink">当前全局态势摘要</h3>
            <div className="flex items-center gap-3">
              <Badge tone="water">均值健康 {avgHealth.toFixed(1)}%</Badge>
              <Badge tone={faults.length ? 'alert' : 'ok'}>
                {faults.length ? `${faults.length} 告警` : '无告警'}
              </Badge>
            </div>
          </div>
          <div className="stagger grid gap-2 sm:grid-cols-2">
            {FLEET.map((u) => {
              const unit = frame[u.id]
              return (
                <div
                  key={u.id}
                  className={cn(
                    'card-hover rounded-md border px-3 py-2.5',
                    unit.isFault ? 'border-accent/40 bg-accent/8' : 'border-line-soft bg-surface/70',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[13px] font-600">{u.id}</span>
                    <Dot tone={unit.isFault ? 'alert' : 'ok'} />
                  </div>
                  <Progress
                    value={unit.health}
                    tone={unit.isFault ? 'alert' : unit.health >= 90 ? 'ok' : 'warn'}
                    className="mt-2"
                  />
                  <div className="mt-1.5 flex justify-between font-mono text-[11px] text-ink-faint">
                    <span>
                      N {unit.x.toFixed(1)} · E {unit.y.toFixed(1)}
                    </span>
                    <span>{(unit.speed * 1).toFixed(2)} m/s</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function DecisionCard({
  title,
  body,
  status,
  tone,
}: {
  title: string
  body: string
  status: string
  tone: 'ok' | 'warn' | 'ghost'
}) {
  return (
    <div className="panel card-hover rounded-lg p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="label-eyebrow">Decision</div>
          <h3 className="mt-0.5 font-display text-[15px] font-600 text-ink">{title}</h3>
        </div>
        <Badge tone={tone}>{status}</Badge>
      </div>
      <div className="hairline mt-2.5 opacity-70" />
      <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">{body}</p>
    </div>
  )
}

/** 简化全局航迹示意：六艇当前点 + 朝向 */
function GlobalTrackSketch() {
  const frame = useFleetStore((s) => s.frame)
  const pts = FLEET.map((u) => frame[u.id])
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const minX = Math.min(...xs) - 20
  const maxX = Math.max(...xs) + 20
  const minY = Math.min(...ys) - 20
  const maxY = Math.max(...ys) + 20
  const W = 640
  const H = 280
  const sx = (x: number) => ((x - minX) / (maxX - minX || 1)) * (W - 40) + 20
  const sy = (y: number) => H - (((y - minY) / (maxY - minY || 1)) * (H - 40) + 20)

  return (
    <section className="panel rounded-lg p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-[15px] font-600 text-ink">全局航迹 / 态势平面</h3>
        <Badge tone="water">实时</Badge>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="blueprint-bg h-auto w-full rounded-md ring-1 ring-line-soft">
        {pts.map((p) => {
          const x = sx(p.x)
          const y = sy(p.y)
          const hx = x + Math.cos(p.heading) * 18
          const hy = y - Math.sin(p.heading) * 18
          return (
            <g key={p.id}>
              <line x1={x} y1={y} x2={hx} y2={hy} stroke="var(--color-primary)" strokeWidth="2" />
              <circle cx={x} cy={y} r="7" fill={p.isFault ? 'var(--color-accent)' : 'var(--color-primary)'} />
              <text x={x} y={y - 12} textAnchor="middle" fontSize="10" fill="var(--color-ink)">
                {p.id.replace('USV-', '')}
              </text>
            </g>
          )
        })}
      </svg>
    </section>
  )
}
