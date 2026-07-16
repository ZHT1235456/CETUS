import { FLEET, roleLabel } from '@/config/fleet'
import { useFleetStore } from '@/store/usvStore'
import { Badge, Dot, Progress } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { FaultUnit } from './types'

interface CardProps {
  id: (typeof FLEET)[number]['id']
  unit: FaultUnit
  role: (typeof FLEET)[number]['role']
  formation: 'A' | 'B'
}

function FaultCard({ id, unit, role, formation }: CardProps) {
  const isVirtual = role === 'virtual'
  const tone: 'ok' | 'warn' | 'alert' = unit.isFault
    ? 'alert'
    : unit.health >= 90
      ? 'ok'
      : unit.health >= 75
        ? 'warn'
        : 'alert'
  const hdgDeg = ((unit.heading * 180) / Math.PI + 360) % 360
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-md border px-3.5 py-3 backdrop-blur-md transition-all duration-200',
        unit.isFault
          ? 'border-accent/40 bg-accent/8'
          : 'border-line-soft bg-surface/70 hover:border-line-strong hover:shadow-1',
      )}
    >
      {/* 顶条 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'grid h-7 w-7 place-items-center rounded-sm font-mono text-[11px] font-700 ring-1',
              isVirtual
                ? 'bg-water/12 text-water ring-water/25'
                : 'bg-primary/10 text-primary ring-primary/20',
            )}
          >
            {id.replace('USV-', '')}
          </span>
          <div className="leading-tight">
            <div className="font-display text-[13.5px] font-600 text-ink">{id}</div>
            <div className="chip text-ink-faint">F{formation}</div>
          </div>
        </div>
        <Badge tone={isVirtual ? 'water' : role === 'leader' ? 'primary' : 'ghost'}>
          {roleLabel(role)}
        </Badge>
      </div>

      {/* 健康度 */}
      <div className="mt-2.5">
        <div className="flex items-center justify-between">
          <span className="chip text-ink-faint">Health</span>
          <span className="flex items-center gap-1.5">
            <Dot tone={unit.isFault ? 'alert' : 'ok'} pulse={unit.isFault} />
            <span
              className={cn(
                'font-mono text-[12px] font-600',
                tone === 'alert' ? 'text-accent' : tone === 'warn' ? 'text-warn' : 'text-ok',
              )}
            >
              {unit.health.toFixed(1)}%
            </span>
          </span>
        </div>
        <Progress value={unit.health} tone={tone} className="mt-1.5" />
      </div>

      {/* 姿态读数（对方：X 北 / Y 东） */}
      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
        <Readout label="X·北" value={unit.x.toFixed(1)} />
        <Readout label="Y·东" value={unit.y.toFixed(1)} />
        <Readout label="HDG" value={`${hdgDeg.toFixed(0).padStart(3, '0')}°`} />
        <Readout label="SPD" value={`${unit.speed.toFixed(2)}`} />
      </div>
      <div className="mt-1.5">
        <Readout
          label="FAULT"
          value={unit.isFault ? (unit.code ?? 'ERR') : 'None'}
          tone={unit.isFault ? 'alert' : 'ok'}
        />
      </div>
    </div>
  )
}

function Readout({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'ok' | 'alert'
}) {
  return (
    <div className="rounded-xs border border-line-soft bg-surface/60 px-2 py-1">
      <div className="chip text-ink-faint">{label}</div>
      <div
        className={cn(
          'font-mono text-[11.5px] font-500 leading-tight',
          tone === 'alert' ? 'text-accent' : tone === 'ok' ? 'text-ok' : 'text-ink',
        )}
      >
        {value}
      </div>
    </div>
  )
}

export function FaultGrid() {
  const frame = useFleetStore((s) => s.frame)
  const source = useFleetStore((s) => s.source)

  const avg =
    FLEET.reduce((a, u) => a + frame[u.id].health, 0) / FLEET.length
  const faults = FLEET.filter((u) => frame[u.id].isFault).length

  return (
    <div className="pointer-events-auto w-full">
      <div className="panel-flat rounded-md p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="label-eyebrow">Fleet Health</span>
              <Badge tone={source === 'live' ? 'ok' : 'ghost'}>
                {source === 'live' ? 'LIVE · WS' : 'MOCK · 待扩展'}
              </Badge>
            </div>
            <h3 className="mt-0.5 font-display text-[17px] font-600 text-ink">
              编队故障与健康管理
            </h3>
          </div>
          <div className="text-right">
            <div className="font-mono text-[22px] font-700 leading-none text-ok">
              {avg.toFixed(1)}
              <span className="text-[12px] text-ink-faint">%</span>
            </div>
            <div className="chip text-ink-faint">均值</div>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Dot tone={faults > 0 ? 'alert' : 'ok'} pulse={faults > 0} />
            <span className="chip text-ink-soft">
              {faults > 0
                ? `${faults} 艇告警`
                : `全部正常`}
            </span>
          </div>

        </div>

        <div className="hairline my-3.5" />

        <div className="space-y-2 pr-1">
          {FLEET.map((u) => (
            <FaultCard
              key={u.id}
              id={u.id}
              unit={frame[u.id]}
              role={u.role}
              formation={u.formation}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
