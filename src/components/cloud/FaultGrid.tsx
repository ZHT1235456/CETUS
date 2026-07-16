import { useEffect, useState } from 'react'
import { FLEET, roleLabel } from '@/config/fleet'
import { useFleetStore } from '@/store/usvStore'
import { Badge, Button, Dot, Progress } from '@/components/ui'
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
  const receiver = useFleetStore((s) => s.receiver)
  const receiverError = useFleetStore((s) => s.receiverError)
  const fleetHost = useFleetStore((s) => s.fleetHost)
  const fleetPort = useFleetStore((s) => s.fleetPort)
  const setFleetEndpoint = useFleetStore((s) => s.setFleetEndpoint)

  const [hostDraft, setHostDraft] = useState(fleetHost)
  const [portDraft, setPortDraft] = useState(String(fleetPort))
  const [endpointError, setEndpointError] = useState<string | null>(null)

  useEffect(() => {
    setHostDraft(fleetHost)
    setPortDraft(String(fleetPort))
  }, [fleetHost, fleetPort])

  const applyEndpoint = () => {
    try {
      setFleetEndpoint(hostDraft, portDraft)
      setEndpointError(null)
    } catch (error) {
      setEndpointError(error instanceof Error ? error.message : String(error))
    }
  }

  const connectionBadge: {
    tone: 'ok' | 'warn' | 'alert' | 'ghost'
    label: string
  } =
    receiver.state === 'timedOut'
      ? { tone: 'warn', label: 'WS · TIMEOUT' }
      : receiver.state === 'error'
        ? { tone: 'alert', label: 'WS · ERROR' }
        : source === 'live'
          ? { tone: 'ok', label: 'LIVE · WS' }
          : { tone: 'ghost', label: 'MOCK' }

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
              <Badge tone={connectionBadge.tone}>{connectionBadge.label}</Badge>
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

          <form
            className="mt-1 flex flex-col gap-1.5"
            onSubmit={(event) => {
              event.preventDefault()
              applyEndpoint()
            }}
          >
            <div className="chip text-ink-faint">发送端（局域网 IP）</div>
            <div className="flex items-center gap-1.5">
              <input
                value={hostDraft}
                onChange={(event) => setHostDraft(event.target.value)}
                placeholder="192.168.1.10"
                spellCheck={false}
                autoComplete="off"
                className="h-8 min-w-0 flex-1 rounded-sm border border-line-soft bg-surface/80 px-2 font-mono text-[11.5px] text-ink outline-none ring-primary/30 placeholder:text-ink-faint focus:border-primary/40 focus:ring-1"
              />
              <input
                value={portDraft}
                onChange={(event) => setPortDraft(event.target.value)}
                placeholder="5005"
                inputMode="numeric"
                spellCheck={false}
                autoComplete="off"
                className="h-8 w-[4.5rem] shrink-0 rounded-sm border border-line-soft bg-surface/80 px-2 font-mono text-[11.5px] text-ink outline-none ring-primary/30 placeholder:text-ink-faint focus:border-primary/40 focus:ring-1"
              />
              <Button type="submit" size="sm" variant="outline" className="shrink-0 px-2.5">
                连接
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] text-ink-faint">
            <span>{receiver.bindAddress}</span>
            {receiver.state !== 'idle' && (
              <>
                <span>
                  {receiver.state === 'live'
                    ? '已同步'
                    : receiver.state === 'listening'
                      ? '连接中'
                      : receiver.state === 'timedOut'
                        ? '等待恢复'
                        : receiver.state}
                </span>
                <span>丢弃 {receiver.droppedPackets}</span>
              </>
            )}
          </div>
          {endpointError && (
            <div className="font-mono text-[10.5px] text-accent">{endpointError}</div>
          )}
          {receiver.state === 'listening' && source === 'mock' && (
            <div className="text-[11px] text-warn">
              等待 WebSocket 首帧；填写运行 Python 发送端的电脑 IP 后点「连接」
            </div>
          )}
          {receiverError && (
            <div className="truncate font-mono text-[10.5px] text-accent" title={receiverError}>
              {receiverError}
            </div>
          )}
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
