import { Navigate, useParams } from 'react-router-dom'
import { EDGE_STATIONS, isEdgeStationId } from '@/config/edgeStations'
import { FLEET_BY_ID, roleLabel } from '@/config/fleet'
import { useFleetStore } from '@/store/usvStore'
import { Badge, Dot, Progress } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { USVId } from '@/types/usv'

export default function EdgeStation() {
  const { stationId } = useParams()
  if (!isEdgeStationId(stationId)) {
    return <Navigate to="/edge/overview" replace />
  }
  return <EdgeStationView stationId={stationId} />
}

function EdgeStationView({ stationId }: { stationId: '1' | '2' }) {
  const station = EDGE_STATIONS[stationId]
  const f = station.formation
  const frame = useFleetStore((s) => s.frame)
  const avg = f.members.reduce((a, id) => a + frame[id].health, 0) / f.members.length
  const faults = f.members.filter((id) => frame[id].isFault).length

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto px-6 py-4">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="label-eyebrow">Edge Station</span>
            <Badge tone="water">{station.label}</Badge>
          </div>
          <h2 className="mt-1 font-display text-[22px] font-700 text-ink">
            {station.label} · 领航艇 {f.leader.replace('USV-', '')}
          </h2>
          <p className="mt-1 text-[13px] text-ink-soft">
            分管 {f.members.join('、')} · 近实时位置 / 姿态 / 健康 · 无长周期历史图
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-[22px] font-700 leading-none text-ok">
            {avg.toFixed(1)}
            <span className="text-[12px] text-ink-faint">%</span>
          </div>
          <div className={cn('chip', faults > 0 ? 'text-accent' : 'text-ink-faint')}>
            {faults > 0 ? `${faults} 告警` : '组内正常'}
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="panel flex flex-col rounded-lg p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-[15px] font-600">局部编队态势</h3>
            <Badge tone="water">近实时</Badge>
          </div>
          <div className="blueprint-bg flex flex-1 items-center justify-center rounded-md ring-1 ring-line-soft/70">
            <TriangleSVG members={f.members as USVId[]} leader={f.leader} edges={f.edges} sid={stationId} />
          </div>
        </section>

        <section className="stagger flex flex-col gap-3">
          {f.members.map((id) => (
            <MemberCard key={id} id={id} />
          ))}
        </section>
      </div>
    </div>
  )
}

function MemberCard({ id }: { id: USVId }) {
  const unit = useFleetStore((s) => s.frame[id])
  const cfg = FLEET_BY_ID[id]
  const tone = unit.isFault ? 'alert' : unit.health >= 90 ? 'ok' : 'warn'
  const hdgDeg = ((unit.heading * 180) / Math.PI + 360) % 360

  return (
    <div
      className={cn(
        'panel card-hover rounded-lg px-4 py-3',
        unit.isFault && 'ring-1 ring-accent/40',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-[15px] font-700">{id}</span>
          <Badge tone="ghost">{roleLabel(cfg.role)}</Badge>
          <Dot tone={unit.isFault ? 'alert' : 'ok'} />
        </div>
        <span
          className={cn(
            'font-mono text-[13px] font-600',
            tone === 'alert' ? 'text-accent' : tone === 'warn' ? 'text-warn' : 'text-ok',
          )}
        >
          {unit.health.toFixed(0)}%
        </span>
      </div>
      <Progress value={unit.health} tone={tone} className="mt-2" />
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11.5px] text-ink-soft">
        <span>北 X {unit.x.toFixed(2)}</span>
        <span>东 Y {unit.y.toFixed(2)}</span>
        <span>航向 {hdgDeg.toFixed(1)}°</span>
        <span>航速 {unit.speed.toFixed(2)}</span>
      </div>
    </div>
  )
}

function TriangleSVG({
  members,
  leader,
  edges,
  sid,
}: {
  members: USVId[]
  leader: USVId
  edges: readonly { from: USVId; to: USVId; dir: 'uni' | 'bi' }[]
  sid: string
}) {
  const W = 360
  const H = 320
  const apex = { x: 180, y: 56 }
  const bl = { x: 66, y: 252 }
  const br = { x: 294, y: 252 }
  const pos: Record<string, { x: number; y: number }> = {}
  pos[leader] = apex
  const others = members.filter((m) => m !== leader)
  pos[others[0]] = bl
  pos[others[1]] = br
  const radiusOf = (id: USVId) => (id === leader ? 38 : 32)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full max-h-[360px] w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id={`ae-${sid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-water)" />
        </marker>
        <marker id={`as-${sid}`} viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M10,0 L0,5 L10,10 z" fill="var(--color-water)" />
        </marker>
        <radialGradient id={`tf-${sid}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="rgba(74,130,184,0.10)" />
          <stop offset="100%" stopColor="rgba(74,130,184,0.02)" />
        </radialGradient>
      </defs>
      <polygon
        points={`${apex.x},${apex.y} ${bl.x},${bl.y} ${br.x},${br.y}`}
        fill={`url(#tf-${sid})`}
        stroke="rgba(127,168,204,0.45)"
        strokeWidth="1.2"
        strokeDasharray="2 6"
      />
      {edges.map(({ from, to, dir }) => {
        const a = pos[from]
        const b = pos[to]
        const { ax, ay, bx, by } = shorten(a, b, radiusOf(from), radiusOf(to) + 6)
        const bi = dir === 'bi'
        return (
          <path
            key={`${from}-${to}`}
            d={`M ${ax} ${ay} L ${bx} ${by}`}
            fill="none"
            stroke="var(--color-water)"
            strokeWidth="1.6"
            markerStart={bi ? `url(#as-${sid})` : undefined}
            markerEnd={`url(#ae-${sid})`}
            className="flow-edge"
          />
        )
      })}
      {members.map((id) => (
        <FormationNode
          key={id}
          id={id}
          x={pos[id].x}
          y={pos[id].y}
          r={radiusOf(id)}
          fillId={`tf-${sid}`}
        />
      ))}
    </svg>
  )
}

function FormationNode({
  id,
  x,
  y,
  r,
  fillId,
}: {
  id: USVId
  x: number
  y: number
  r: number
  fillId: string
}) {
  const unit = useFleetStore((s) => s.frame[id])
  const role = FLEET_BY_ID[id].role
  const tone = unit.isFault ? '#ff7a6b' : unit.health >= 90 ? '#2dc993' : '#f5b335'
  return (
    <g>
      {role === 'virtual' && (
        <circle
          cx={x}
          cy={y}
          r={r + 9}
          fill="none"
          stroke="var(--color-water)"
          strokeWidth="1.2"
          strokeDasharray="3 4"
        />
      )}
      <circle cx={x} cy={y} r={r} fill={`url(#${fillId})`} stroke="var(--color-primary)" strokeWidth="1.8" />
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="17"
        fontWeight="700"
        fill="var(--color-ink)"
      >
        {id.replace('USV-', '')}
      </text>
      <text x={x} y={y + r + 14} textAnchor="middle" fontSize="10" fill={tone}>
        {unit.isFault ? 'FAULT' : `${unit.health.toFixed(0)}%`}
      </text>
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
