import { useEffect, useState } from 'react'
import { FLEET, roleLabel } from '@/config/fleet'
import { ENABLE_LIVE_WS } from '@/hooks/useFleetRuntime'
import { useFleetStore } from '@/store/usvStore'
import { deriveVesselTelemetry } from '@/lib/telemetry'
import { Badge, Button, Dot, Progress } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { FaultUnit } from './types'
import type { ReactNode } from 'react'

interface CardProps {
  id: (typeof FLEET)[number]['id']
  unit: FaultUnit
  role: (typeof FLEET)[number]['role']
  formation: 'A' | 'B'
  t: number
}

/** 单艇集群态势卡：感知 / 运动控制 / 通信 / 机舱 / 健康 五域全量端侧数据 */
function SituationCard({ id, unit, role, formation, t }: CardProps) {
  const isVirtual = role === 'virtual'
  const tone: 'ok' | 'warn' | 'alert' = unit.isFault
    ? 'alert'
    : unit.health >= 90
      ? 'ok'
      : unit.health >= 75
        ? 'warn'
        : 'alert'
  const hdgDeg = ((unit.heading * 180) / Math.PI + 360) % 360
  const tele = deriveVesselTelemetry(unit, t)
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

      {/* 五域端侧数据 */}
      <Group label="感知">
        <Readout label="X·北" value={unit.x.toFixed(1)} />
        <Readout label="Y·东" value={unit.y.toFixed(1)} />
        <Readout label="航向" value={`${hdgDeg.toFixed(0).padStart(3, '0')}°`} />
        <Readout
          label="姿态 P/R"
          value={`${tele.pitchDeg >= 0 ? '+' : ''}${tele.pitchDeg.toFixed(1)}° / ${tele.rollDeg >= 0 ? '+' : ''}${tele.rollDeg.toFixed(1)}°`}
        />
      </Group>
      <Group label="运动控制">
        <Readout label="控制输入" value={tele.controlInput.toFixed(2)} />
        <Readout label="速度" value={`${unit.speed.toFixed(2)} m/s`} />
      </Group>
      <Group label="通信">
        <Readout label="时延" value={`${tele.latencyMs.toFixed(1)} ms`} />
        <Readout label="丢包率" value={`${tele.packetLossPct.toFixed(2)}%`} />
        <Readout label="信号强度" value={`${tele.signalDbm.toFixed(0)} dBm`} />
      </Group>
      <Group label="机舱">
        <Readout label="电源电量" value={`${tele.batteryPct.toFixed(0)}%`} />
        <Readout label="船舱温度" value={`${tele.cabinTempC.toFixed(1)}℃`} />
      </Group>
      <Group label="健康">
        <Readout label="异常" value={tele.anomaly} tone={unit.isFault ? 'alert' : 'ok'} />
        <Readout
          label="故障状态"
          value={tele.faultState}
          tone={unit.isFault ? 'alert' : 'ok'}
        />
        <Readout label="健康评估" value={`${tele.healthEval.toFixed(1)}%`} />
      </Group>
    </div>
  )
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-2.5">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="h-px w-2.5 bg-line-strong/60" />
        <span className="chip text-ink-faint">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">{children}</div>
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
  const updatedAt = useFleetStore((s) => s.updatedAt)
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
    tone: 'ok' | 'warn' | 'alert' | 'ghost' | 'water'
    label: string
  } = !ENABLE_LIVE_WS
    ? { tone: 'water', label: 'DEMO · 演示轨迹' }
    : receiver.state === 'timedOut'
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
              <span className="label-eyebrow">Cluster Situation</span>
              <Badge tone={connectionBadge.tone}>{connectionBadge.label}</Badge>
            </div>
            <h3 className="mt-0.5 font-display text-[17px] font-600 text-ink">
              集群态势
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

          {ENABLE_LIVE_WS ? (
            <>
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
            </>
          ) : (
            <div className="mt-1 rounded-sm border border-water/25 bg-water/8 px-2.5 py-2 text-[11px] leading-relaxed text-water">
              内置自定义编队轨迹驱动 · WebSocket 接入暂时停用
            </div>
          )}
        </div>

        <div className="hairline my-3.5" />

        <div className="stagger space-y-2 pr-1">
          {FLEET.map((u) => (
            <SituationCard
              key={u.id}
              id={u.id}
              unit={frame[u.id]}
              role={u.role}
              formation={u.formation}
              t={updatedAt}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
