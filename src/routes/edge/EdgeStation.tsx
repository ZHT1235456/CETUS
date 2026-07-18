import { Navigate, useParams } from 'react-router-dom'
import { EDGE_STATIONS, isEdgeStationId } from '@/config/edgeStations'
import { FLEET_BY_ID, roleLabel } from '@/config/fleet'
import { useFleetStore } from '@/store/usvStore'
import { deriveVesselTelemetry } from '@/lib/telemetry'
import { Badge, Dot, Progress } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { FleetUnit, USVId } from '@/types/usv'

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
            分管 {f.members.join('、')} · 运行 / 通信 / 健康状态近实时汇聚 · 无长周期历史图
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
            <h3 className="font-display text-[15px] font-600">局部编队态势 · 水面俯视</h3>
            <Badge tone="water">近实时</Badge>
          </div>
          <div className="blueprint-bg flex flex-1 items-center justify-center rounded-md ring-1 ring-line-soft/70">
            <FormationWaterView
              members={f.members as USVId[]}
              leader={f.leader}
              edges={f.edges}
              sid={stationId}
            />
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
  const updatedAt = useFleetStore((s) => s.updatedAt)
  const cfg = FLEET_BY_ID[id]
  const tone = unit.isFault ? 'alert' : unit.health >= 90 ? 'ok' : 'warn'
  const hdgDeg = ((unit.heading * 180) / Math.PI + 360) % 360
  const tele = deriveVesselTelemetry(unit, updatedAt)

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

      <div className="mt-2.5 space-y-2">
        <div>
          <div className="label-eyebrow mb-1">运行状态</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11.5px] text-ink-soft">
            <span>北 X {unit.x.toFixed(2)}</span>
            <span>东 Y {unit.y.toFixed(2)}</span>
            <span>航向 {hdgDeg.toFixed(1)}°</span>
            <span>航速 {unit.speed.toFixed(2)} kn</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="font-mono text-[10.5px] text-ink-faint">任务进度</span>
            <Progress value={tele.taskProgressPct} tone="water" className="flex-1" />
            <span className="font-mono text-[10.5px] text-ink-soft">
              {tele.taskProgressPct.toFixed(0)}%
            </span>
          </div>
        </div>

        <div>
          <div className="label-eyebrow mb-1">通信状态</div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1 font-mono text-[11.5px] text-ink-soft">
            <span>时延 {tele.latencyMs.toFixed(1)} ms</span>
            <span>丢包 {tele.packetLossPct.toFixed(2)}%</span>
            <span>信号 {tele.signalDbm.toFixed(0)} dBm</span>
          </div>
        </div>

        <div>
          <div className="label-eyebrow mb-1">健康状态</div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1 font-mono text-[11.5px] text-ink-soft">
            <span>异常 {tele.anomaly}</span>
            <span className={cn(unit.isFault && 'text-accent')}>故障 {tele.faultState}</span>
            <span>评估 {tele.healthEval.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 水面俯视态势：以三艇实时位置自动缩放映射到视口
 * （screen x = 东，screen y = 北向上；艇形按 heading 旋转）。
 */
function FormationWaterView({
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
  const frame = useFleetStore((s) => s.frame)
  const W = 420
  const H = 340
  const MARGIN = 52

  const world = members.map((id) => ({ id, n: frame[id].x, e: frame[id].y }))
  const nMin = Math.min(...world.map((p) => p.n))
  const nMax = Math.max(...world.map((p) => p.n))
  const eMin = Math.min(...world.map((p) => p.e))
  const eMax = Math.max(...world.map((p) => p.e))
  const spanN = Math.max(nMax - nMin, 14)
  const spanE = Math.max(eMax - eMin, 14)
  const scale = Math.min((W - 2 * MARGIN) / spanE, (H - 2 * MARGIN) / spanN)
  const nMid = (nMin + nMax) / 2
  const eMid = (eMin + eMax) / 2

  const sx = (e: number) => W / 2 + (e - eMid) * scale
  const sy = (n: number) => H / 2 - (n - nMid) * scale
  const pos = Object.fromEntries(world.map((p) => [p.id, { x: sx(p.e), y: sy(p.n) }])) as Record<
    USVId,
    { x: number; y: number }
  >

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-full max-h-[380px] w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker id={`we-${sid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-water)" />
        </marker>
        <marker id={`ws-${sid}`} viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M10,0 L0,5 L10,10 z" fill="var(--color-water)" />
        </marker>
        <linearGradient id={`wg-${sid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(61,109,155,0.14)" />
          <stop offset="55%" stopColor="rgba(74,130,184,0.07)" />
          <stop offset="100%" stopColor="rgba(26,64,110,0.13)" />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={W} height={H} fill={`url(#wg-${sid})`} rx={6} />
      {[0.22, 0.4, 0.58, 0.76].map((k, i) => (
        <path
          key={i}
          d={`M -10 ${H * k} Q ${W * 0.25} ${H * k - 9} ${W * 0.5} ${H * k} T ${W + 10} ${H * k}`}
          fill="none"
          stroke="rgba(127,168,204,0.28)"
          strokeWidth="1"
        />
      ))}

      {/* 指北针 */}
      <g transform={`translate(${W - 30} 30)`}>
        <circle r={11} fill="rgba(255,255,255,0.5)" stroke="rgba(127,168,204,0.5)" strokeWidth="1" />
        <path d="M 0 6 L 0 -7" stroke="var(--color-primary)" strokeWidth="1.6" markerEnd={`url(#we-${sid})`} />
        <text y={24} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--color-primary)">
          N
        </text>
      </g>

      {/* Mesh 链路 */}
      {edges.map(({ from, to, dir }) => {
        const a = pos[from]
        const b = pos[to]
        const { ax, ay, bx, by } = shorten(a, b, 20, 26)
        const bi = dir === 'bi'
        return (
          <path
            key={`${from}-${to}`}
            d={`M ${ax} ${ay} L ${bx} ${by}`}
            fill="none"
            stroke="var(--color-water)"
            strokeWidth="1.6"
            strokeDasharray={bi ? undefined : '5 4'}
            markerStart={bi ? `url(#ws-${sid})` : undefined}
            markerEnd={`url(#we-${sid})`}
            className="flow-edge"
          />
        )
      })}

      {/* 艇形 */}
      {members.map((id) => (
        <BoatNode key={id} id={id} leader={leader} x={pos[id].x} y={pos[id].y} unit={frame[id]} />
      ))}
    </svg>
  )
}

/** 艇形多边形朝 +x 绘制；heading 0 = 朝北（屏幕向上），故旋转 heading - 90° */
const BOAT_POINTS = '17,0 6,-5.5 -9,-5.5 -13,0 -9,5.5 6,5.5'

function BoatNode({
  id,
  leader,
  x,
  y,
  unit,
}: {
  id: USVId
  leader: USVId
  x: number
  y: number
  unit: FleetUnit
}) {
  const role = FLEET_BY_ID[id].role
  const isLeader = id === leader
  const rot = (unit.heading * 180) / Math.PI - 90
  const stroke = unit.isFault ? '#ff7a6b' : isLeader ? '#1a406e' : '#3d6d9b'
  const fill = unit.isFault
    ? 'rgba(255,122,107,0.28)'
    : role === 'virtual'
      ? 'rgba(127,168,204,0.16)'
      : isLeader
        ? 'rgba(42,90,136,0.55)'
        : 'rgba(74,130,184,0.42)'
  return (
    <g>
      <g transform={`translate(${x} ${y}) rotate(${rot.toFixed(1)})`}>
        <polygon
          points={BOAT_POINTS}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.6"
          strokeDasharray={role === 'virtual' ? '3 2.5' : undefined}
          strokeLinejoin="round"
        />
        <line x1={6} y1={0} x2={15} y2={0} stroke={stroke} strokeWidth="1" opacity="0.7" />
      </g>
      <text
        x={x}
        y={y - 16}
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fontFamily="var(--font-mono, monospace)"
        fill="var(--color-ink)"
      >
        {id.replace('USV-', '')}
      </text>
      <text
        x={x}
        y={y + 22}
        textAnchor="middle"
        fontSize="9.5"
        fill={unit.isFault ? '#ff7a6b' : 'var(--color-ink-faint)'}
      >
        {roleLabel(role)}
        {unit.isFault ? ' · FAULT' : ''}
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
