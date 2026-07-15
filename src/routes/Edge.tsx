import { useMockFleet } from '@/hooks/useMockFleet'
import { EDGE_FORMATIONS, FLEET_BY_ID } from '@/config/fleet'
import { useFleetStore } from '@/store/usvStore'
import { Badge, Dot, Progress } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { USVId } from '@/types/usv'

export default function Edge() {
  useMockFleet(true)
  return (
    <div className="relative h-full w-full px-7 py-6">
      <div className="grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        <FormationCard key="A" fk="A" />
        <FormationCard key="B" fk="B" />
      </div>

      {/* 底部注解条 */}
      <div className="pointer-events-none absolute bottom-4 left-7 right-7 flex items-center justify-between">
        <div className="panel-flat flex items-center gap-3 rounded-sm px-3.5 py-2">
          <Dot tone="water" pulse />
          <span className="chip text-ink-soft">leader → follower 数据流（边编队内协同）</span>
        </div>
      </div>
    </div>
  )
}

function FormationCard({ fk }: { fk: 'A' | 'B' }) {
  const f = EDGE_FORMATIONS[fk]
  return (
    <section className="panel relative flex h-full flex-col rounded-md p-5 rise overflow-hidden">
      {/* 装饰：三角几何水印 */}
      <svg
        className="pointer-events-none absolute -right-6 -top-6 h-44 w-44 opacity-[0.06]"
        viewBox="0 0 100 100"
        fill="none"
      >
        <polygon points="50,8 92,90 8,90" stroke="#1e4576" strokeWidth="2" />
      </svg>

      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="label-eyebrow">Edge Formation</span>
            <Badge tone="water">F{fk}</Badge>
          </div>
          <h3 className="mt-0.5 font-display text-[20px] font-700 text-ink">
            编队 {fk} · Leader-Follower
          </h3>
        </div>
        <FormationStat fk={fk} />
      </header>

      <div className="hairline my-4" />

      {/* 三角形拓扑 */}
      <div className="relative flex flex-1 items-center justify-center">
        <TriangleSVG fk={fk} />
      </div>

      {/* 成员故障摘要 */}
      <div className="grid grid-cols-3 gap-2.5 pt-2">
        {f.members.map((id) => (
          <MemberStat key={id} id={id} />
        ))}
      </div>
    </section>
  )
}

function FormationStat({ fk }: { fk: 'A' | 'B' }) {
  const f = EDGE_FORMATIONS[fk]
  const frame = useFleetStore((s) => s.frame)
  const avg = f.members.reduce((a, id) => a + frame[id].health, 0) / f.members.length
  const faults = f.members.filter((id) => frame[id].isFault).length
  return (
    <div className="text-right">
      <div className="font-mono text-[22px] font-700 leading-none text-ok">
        {avg.toFixed(1)}
        <span className="text-[12px] text-ink-faint">%</span>
      </div>
      <div className={cn('chip', faults > 0 ? 'text-accent' : 'text-ink-faint')}>
        {faults > 0 ? `${faults} 告警` : '组内正常'}
      </div>
    </div>
  )
}

function MemberStat({ id }: { id: USVId }) {
  const unit = useFleetStore((s) => s.frame[id])
  const cfg = FLEET_BY_ID[id]
  const isLeader = cfg.role === 'virtual-leader'
  const tone = unit.isFault ? 'alert' : unit.health >= 90 ? 'ok' : 'warn'
  return (
    <div
      className={cn(
        'rounded-sm border px-2.5 py-2',
        unit.isFault ? 'border-accent/40 bg-accent/8' : 'border-line-soft bg-surface/60',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              'grid h-5 w-5 place-items-center rounded-xs font-mono text-[10px] font-700',
              isLeader ? 'bg-water/15 text-water' : 'bg-primary/10 text-primary',
            )}
          >
            {id.replace('USV-', '')}
          </span>
          <span className="font-display text-[12.5px] font-600 text-ink">{id}</span>
        </span>
        <Dot tone={unit.isFault ? 'alert' : 'ok'} pulse={unit.isFault} />
      </div>
      <Progress
        value={unit.health}
        tone={tone}
        className="mt-1.5"
      />
      <div className="mt-1 flex items-center justify-between">
        <span className="chip text-ink-faint">
          {isLeader ? 'Leader' : 'Follower'}
        </span>
        <span
          className={cn(
            'font-mono text-[11px] font-600',
            tone === 'alert' ? 'text-accent' : tone === 'warn' ? 'text-warn' : 'text-ok',
          )}
        >
          {unit.health.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────
// 三角形 SVG 拓扑
// ──────────────────────────────────────────────────────

function TriangleSVG({ fk }: { fk: 'A' | 'B' }) {
  const f = EDGE_FORMATIONS[fk]
  // 顶点：leader 在顶，两 follower 在底
  const W = 360
  const H = 320
  const apex = { x: 180, y: 56 }
  const bl = { x: 66, y: 252 }
  const br = { x: 294, y: 252 }

  const pos: Record<string, { x: number; y: number }> = {}
  const members = f.members as USVId[]
  // leader = f.leader → apex；其余两按出现顺序为 bl, br
  pos[f.leader] = apex
  const followers = members.filter((m) => m !== f.leader)
  pos[followers[0]] = bl
  pos[followers[1]] = br

  const leaderR = 38
  const followerR = 32

  const radiusOf = (id: USVId) => (id === f.leader ? leaderR : followerR)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-full max-h-[360px] w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker
          id={`arrow-${fk}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-water)" />
        </marker>
        <radialGradient id="tri-fill" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="rgba(74,130,184,0.10)" />
          <stop offset="100%" stopColor="rgba(74,130,184,0.02)" />
        </radialGradient>
        <linearGradient id={`node-${fk}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dce9f5" />
        </linearGradient>
      </defs>

      {/* 三角形填充底色 */}
      <polygon
        points={`${apex.x},${apex.y} ${bl.x},${bl.y} ${br.x},${br.y}`}
        fill="url(#tri-fill)"
        stroke="rgba(127,168,204,0.45)"
        strokeWidth="1.2"
        strokeDasharray="2 6"
      />

      {/* 边（带方向 + 流动） */}
      {f.edges.map(([from, to]) => {
        const a = pos[from]
        const b = pos[to]
        const { ax, ay, bx, by } = shorten(a, b, radiusOf(from), radiusOf(to) + 6)
        return (
          <g key={`${from}-${to}`}>
            {/* 主线 */}
            <path
              d={`M ${ax} ${ay} L ${bx} ${by}`}
              fill="none"
              stroke="var(--color-line-strong)"
              strokeWidth="1.6"
              markerEnd={`url(#arrow-${fk})`}
            />
            {/* 流动叠加 */}
            <path
              d={`M ${ax} ${ay} L ${bx} ${by}`}
              fill="none"
              stroke="var(--color-water)"
              strokeWidth="1.6"
              className="flow-edge"
              opacity="0.85"
            />
          </g>
        )
      })}

      {/* 节点 */}
      {members.map((id) => {
        const p = pos[id]
        const isLeader = id === f.leader
        const virt = FLEET_BY_ID[id].role === 'virtual-leader'
        return (
          <FormationNode
            key={id}
            x={p.x}
            y={p.y}
            r={radiusOf(id)}
            id={id}
            isLeader={isLeader}
            virt={virt}
          />
        )
      })}
    </svg>
  )
}

function FormationNode({
  x,
  y,
  r,
  id,
  isLeader,
  virt,
}: {
  x: number
  y: number
  r: number
  id: USVId
  isLeader: boolean
  virt: boolean
}) {
  const unit = useFleetStore((s) => s.frame[id])
  const tone = unit.isFault ? '#ff7a6b' : unit.health >= 90 ? '#2dc993' : '#f5b335'
  const circ = 2 * Math.PI * (r + 5)
  const ratio = Math.max(0, Math.min(1, unit.health / 100))
  return (
    <g>
      {/* 虚拟领导者：外环虚线 */}
      {virt && (
        <circle
          cx={x}
          cy={y}
          r={r + 9}
          fill="none"
          stroke="var(--color-water)"
          strokeWidth="1.2"
          strokeDasharray="3 4"
          opacity="0.7"
        />
      )}
      {/* 健康度环 */}
      <circle
        cx={x}
        cy={y}
        r={r + 5}
        fill="none"
        stroke="var(--color-line-soft)"
        strokeWidth="2"
      />
      <circle
        cx={x}
        cy={y}
        r={r + 5}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${circ * ratio} ${circ}`}
        transform={`rotate(-90 ${x} ${y})`}
      />
      {/* 节点本体 */}
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="url(#tri-fill)"
        stroke={isLeader ? 'var(--color-water)' : 'var(--color-primary)'}
        strokeWidth="1.8"
      />
      <circle cx={x} cy={y} r={r - 3} fill="white" opacity="0.5" />
      {/* 编号 */}
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Chakra Petch, sans-serif"
        fontSize="17"
        fontWeight="700"
        fill="var(--color-ink)"
      >
        {id.replace('USV-', '')}
      </text>
      {/* 角标 */}
      <foreignObject x={x - r} y={y - r - 16} width={r * 2} height="14">
        <div className="flex justify-center">
          <span
            className="font-mono text-[9px] font-700 uppercase tracking-[0.16em]"
            style={{ color: isLeader ? 'var(--color-water)' : 'var(--color-primary)' }}
          >
            {isLeader ? 'L · Leader' : 'Follower'}
          </span>
        </div>
      </foreignObject>
      {/* 健康文字 */}
      <foreignObject x={x - r} y={y + r + 4} width={r * 2} height="16">
        <div className="text-center font-mono text-[10px]" style={{ color: tone }}>
          {unit.isFault ? 'FAULT' : `${unit.health.toFixed(0)}%`}
        </div>
      </foreignObject>
    </g>
  )
}

function shorten(
  a: { x: number; y: number },
  b: { x: number; y: number },
  rA: number,
  rB: number,
) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  return {
    ax: a.x + ux * rA,
    ay: a.y + uy * rA,
    bx: b.x - ux * rB,
    by: b.y - uy * rB,
  }
}