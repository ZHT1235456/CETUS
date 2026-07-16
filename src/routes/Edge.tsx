import { EDGE_FORMATIONS, FLEET_BY_ID, roleLabel } from '@/config/fleet'
import { useFleetStore } from '@/store/usvStore'
import { Badge, Dot, Progress } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { USVId } from '@/types/usv'

export default function Edge() {
  return (
    <div className="relative flex h-full w-full flex-col px-7 pt-5 pb-6">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <div className="label-eyebrow">Edge Tier · Formations</div>
          <h2 className="mt-1 font-display text-[22px] font-600 text-ink">边侧编队协同</h2>
        </div>
        <span className="chip text-ink-faint">领航 · 跟随 · 虚艇</span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        <FormationCard key="A" fk="A" />
        <FormationCard key="B" fk="B" />
      </div>
    </div>
  )
}

function FormationCard({ fk }: { fk: 'A' | 'B' }) {
  const f = EDGE_FORMATIONS[fk]
  return (
    <section className="panel relative flex h-full flex-col overflow-hidden rounded-lg p-5 rise">
      <svg
        className="pointer-events-none absolute -right-6 -top-6 h-48 w-48 opacity-[0.07]"
        viewBox="0 0 100 100"
        fill="none"
      >
        <polygon points="50,8 92,90 8,90" stroke="#1a406e" strokeWidth="2" />
        <circle cx="50" cy="55" r="18" stroke="#1a406e" strokeWidth="1.2" strokeDasharray="3 4" />
      </svg>

      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="label-eyebrow">Edge Formation</span>
            <Badge tone="water">F{fk}</Badge>
          </div>
          <h3 className="mt-1 font-display text-[22px] font-700 text-ink">
            编队 {fk} · 领航艇 {f.leader.replace('USV-', '')}
          </h3>
        </div>
        <FormationStat fk={fk} />
      </header>

      <div className="hairline my-4" />

      <div className="relative flex flex-1 items-center justify-center">
        <TriangleSVG fk={fk} />
      </div>

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
  const isLeader = cfg.role === 'leader'
  const isVirtual = cfg.role === 'virtual'
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
              isVirtual
                ? 'bg-water/15 text-water'
                : isLeader
                  ? 'bg-primary/15 text-primary'
                  : 'bg-primary/10 text-primary',
            )}
          >
            {id.replace('USV-', '')}
          </span>
          <span className="font-display text-[12.5px] font-600 text-ink">{id}</span>
        </span>
        <Dot tone={unit.isFault ? 'alert' : 'ok'} pulse={unit.isFault} />
      </div>
      <Progress value={unit.health} tone={tone} className="mt-1.5" />
      <div className="mt-1 flex items-center justify-between">
        <span className={cn('chip', isVirtual ? 'text-water' : 'text-ink-faint')}>
          {roleLabel(cfg.role)}
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

function TriangleSVG({ fk }: { fk: 'A' | 'B' }) {
  const f = EDGE_FORMATIONS[fk]
  const W = 360
  const H = 320
  const apex = { x: 180, y: 56 }
  const bl = { x: 66, y: 252 }
  const br = { x: 294, y: 252 }

  const pos: Record<string, { x: number; y: number }> = {}
  const members = f.members as USVId[]
  pos[f.leader] = apex
  const others = members.filter((m) => m !== f.leader)
  pos[others[0]] = bl
  pos[others[1]] = br

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
          id={`arrow-end-${fk}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-water)" />
        </marker>
        <marker
          id={`arrow-start-${fk}`}
          viewBox="0 0 10 10"
          refX="1"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M10,0 L0,5 L10,10 z" fill="var(--color-water)" />
        </marker>
        <radialGradient id={`tri-fill-${fk}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="rgba(74,130,184,0.10)" />
          <stop offset="100%" stopColor="rgba(74,130,184,0.02)" />
        </radialGradient>
      </defs>

      <polygon
        points={`${apex.x},${apex.y} ${bl.x},${bl.y} ${br.x},${br.y}`}
        fill={`url(#tri-fill-${fk})`}
        stroke="rgba(127,168,204,0.45)"
        strokeWidth="1.2"
        strokeDasharray="2 6"
      />

      {f.edges.map(({ from, to, dir }) => {
        const a = pos[from]
        const b = pos[to]
        const { ax, ay, bx, by } = shorten(a, b, radiusOf(from), radiusOf(to) + 6)
        const bi = dir === 'bi'
        return (
          <g key={`${from}-${to}-${dir}`}>
            <path
              d={`M ${ax} ${ay} L ${bx} ${by}`}
              fill="none"
              stroke="var(--color-line-strong)"
              strokeWidth="1.6"
              markerStart={bi ? `url(#arrow-start-${fk})` : undefined}
              markerEnd={`url(#arrow-end-${fk})`}
            />
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

      {members.map((id) => {
        const p = pos[id]
        const role = FLEET_BY_ID[id].role
        return (
          <FormationNode
            key={id}
            x={p.x}
            y={p.y}
            r={radiusOf(id)}
            id={id}
            fillId={`tri-fill-${fk}`}
            isLeader={role === 'leader'}
            virt={role === 'virtual'}
            label={roleLabel(role)}
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
  fillId,
  isLeader,
  virt,
  label,
}: {
  x: number
  y: number
  r: number
  id: USVId
  fillId: string
  isLeader: boolean
  virt: boolean
  label: string
}) {
  const unit = useFleetStore((s) => s.frame[id])
  const tone = unit.isFault ? '#ff7a6b' : unit.health >= 90 ? '#2dc993' : '#f5b335'
  const circ = 2 * Math.PI * (r + 5)
  const ratio = Math.max(0, Math.min(1, unit.health / 100))
  return (
    <g>
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
      <circle cx={x} cy={y} r={r + 5} fill="none" stroke="var(--color-line-soft)" strokeWidth="2" />
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
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={`url(#${fillId})`}
        stroke={virt || isLeader ? 'var(--color-water)' : 'var(--color-primary)'}
        strokeWidth="1.8"
      />
      <circle cx={x} cy={y} r={r - 3} fill="white" opacity="0.5" />
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
      <foreignObject x={x - r - 8} y={y - r - 16} width={r * 2 + 16} height="14">
        <div className="flex justify-center">
          <span
            className="font-mono text-[9px] font-700 tracking-[0.08em]"
            style={{
              color: virt
                ? 'var(--color-water)'
                : isLeader
                  ? 'var(--color-primary)'
                  : 'var(--color-ink-faint)',
            }}
          >
            {label}
          </span>
        </div>
      </foreignObject>
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
