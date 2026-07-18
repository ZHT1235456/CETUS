import { Navigate, useParams } from 'react-router-dom'
import { FLEET_BY_ID, roleLabel } from '@/config/fleet'
import { useFleetStore, useUnit } from '@/store/usvStore'
import { deriveVesselTelemetry } from '@/lib/telemetry'
import { FpvCanvas } from '@/components/terminal/FpvCanvas'
import { Badge, Dot } from '@/components/ui'
import {
  AttitudeBall,
  GaugeCard,
  GaugeMetric,
  RadialRing,
  SignalBars,
  Sparkline,
  SpeedGauge,
  TempScale,
} from '@/components/telemetry/VesselGauges'
import type { USVId } from '@/types/usv'

const USV_IDS: USVId[] = ['USV-1', 'USV-2', 'USV-3', 'USV-4', 'USV-5', 'USV-6']

/** 通信 sparkline 采样数与间隔（秒） */
const SPARK_N = 24
const SPARK_DT = 0.9

function isUsvId(v: string | undefined): v is USVId {
  return !!v && (USV_IDS as string[]).includes(v)
}

export default function TerminalVessel() {
  const { usvId } = useParams()
  if (!isUsvId(usvId)) {
    return <Navigate to="/terminal/overview" replace />
  }
  return <VesselPanel id={usvId} />
}

function VesselPanel({ id }: { id: USVId }) {
  const unit = useUnit(id)
  const updatedAt = useFleetStore((s) => s.updatedAt)
  const cfg = FLEET_BY_ID[id]
  const tel = deriveVesselTelemetry(unit, updatedAt)
  const hdgDeg = ((unit.heading * 180) / Math.PI + 360) % 360

  // 最近 N 个派生采样（确定性函数，随 updatedAt 滚动）
  const latencySeries = Array.from({ length: SPARK_N }, (_, i) =>
    deriveVesselTelemetry(unit, updatedAt - (SPARK_N - 1 - i) * SPARK_DT).latencyMs,
  )
  const lossSeries = Array.from({ length: SPARK_N }, (_, i) =>
    deriveVesselTelemetry(unit, updatedAt - (SPARK_N - 1 - i) * SPARK_DT).packetLossPct,
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-3.5 overflow-auto px-6 pt-4 pb-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="label-eyebrow">Single USV</span>
            <Badge tone="water">{roleLabel(cfg.role)}</Badge>
            <Dot tone={unit.isFault ? 'alert' : 'ok'} pulse={unit.isFault} />
          </div>
          <h2 className="mt-1 font-display text-[22px] font-700 text-ink">{id}</h2>
        </div>
        <div className="text-right">
          <div className="font-mono text-[20px] font-700 leading-none tabular-nums text-ok">
            {tel.taskProgressPct.toFixed(0)}
            <span className="text-[12px] text-ink-faint">%</span>
          </div>
          <div className="chip mt-0.5 text-ink-faint">任务进度</div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        {/* FPV 第一人称视角（演示轨迹驱动） */}
        <section className="panel scan-sheen relative flex min-h-[300px] flex-col overflow-hidden rounded-lg">
          <FpvCanvas id={id} />

          <div className="relative z-10 flex items-start justify-between p-3">
            <Badge tone="primary">FPV · 第一人称视角</Badge>
            <span className="rounded-sm bg-ink/45 px-2 py-1 font-mono text-[11px] text-surface">
              CAM-FWD · {id}
            </span>
          </div>

          <div className="relative z-10 mt-auto grid grid-cols-3 gap-2 p-3">
            <HudChip label="SPD" value={`${unit.speed.toFixed(2)}`} />
            <HudChip label="HDG" value={`${hdgDeg.toFixed(1)}°`} />
            <HudChip label="LAT" value={`${tel.latencyMs.toFixed(0)} ms`} />
          </div>
        </section>

        {/* 遥测 bento 仪表盘（五域分组；auto-rows-fr 行高均分填满，消除右下留白） */}
        <section className="stagger grid auto-rows-fr grid-cols-2 gap-2.5 xl:grid-cols-3">
          <GaugeCard title="姿态" domain="运动控制">
            <div className="flex items-center gap-3">
              <AttitudeBall pitchDeg={tel.pitchDeg} rollDeg={tel.rollDeg} className="h-16 w-16" />
              <div className="min-w-0 flex-1">
                <GaugeMetric label="纵摇" value={`${tel.pitchDeg.toFixed(1)}°`} />
                <GaugeMetric label="横摇" value={`${tel.rollDeg.toFixed(1)}°`} />
              </div>
            </div>
          </GaugeCard>

          <GaugeCard title="航速" domain="运行状态">
            <div className="flex items-center gap-3">
              <SpeedGauge speed={unit.speed} className="h-16 w-16" />
              <div className="min-w-0 flex-1">
                <GaugeMetric label="航速" value={`${unit.speed.toFixed(2)} m/s`} highlight />
                <GaugeMetric label="航向" value={`${hdgDeg.toFixed(1)}°`} />
              </div>
            </div>
          </GaugeCard>

          <GaugeCard title="位置" domain="感知">
            <GaugeMetric label="位置 · 北" value={unit.x.toFixed(2)} />
            <GaugeMetric label="位置 · 东" value={unit.y.toFixed(2)} />
            <GaugeMetric label="姿态 · 航向" value={`${hdgDeg.toFixed(1)}°`} />
          </GaugeCard>

          <GaugeCard title="电源电量" domain="机舱">
            <div className="flex items-center gap-3">
              <RadialRing
                pct={tel.batteryPct}
                stroke={tel.batteryPct < 30 ? 'var(--color-warn)' : 'var(--color-ok)'}
                text={`${tel.batteryPct.toFixed(0)}%`}
                className="h-16 w-16"
              />
              <div className="min-w-0 flex-1">
                <GaugeMetric label="剩余电量" value={`${tel.batteryPct.toFixed(1)}%`} highlight />
                <GaugeMetric label="状态" value={tel.batteryPct < 30 ? '偏低' : '正常'} />
              </div>
            </div>
          </GaugeCard>

          <GaugeCard title="船舱温度" domain="机舱">
            <TempScale valueC={tel.cabinTempC} />
            <GaugeMetric label="舱温" value={`${tel.cabinTempC.toFixed(1)} °C`} highlight />
          </GaugeCard>

          <GaugeCard title="信号强度" domain="通信">
            <div className="flex items-center gap-3">
              <SignalBars dbm={tel.signalDbm} className="h-16 w-16" />
              <div className="min-w-0 flex-1">
                <GaugeMetric label="信号" value={`${tel.signalDbm.toFixed(1)} dBm`} highlight />
                <GaugeMetric label="链路" value={tel.signalDbm > -70 ? '良好' : '偏弱'} />
              </div>
            </div>
          </GaugeCard>

          <GaugeCard title="健康状态" domain="预测与健康">
            <div className="flex items-center gap-3">
              <RadialRing
                pct={tel.healthEval}
                stroke={
                  unit.isFault
                    ? 'var(--color-accent)'
                    : tel.healthEval >= 90
                      ? 'var(--color-ok)'
                      : 'var(--color-warn)'
                }
                text={`${tel.healthEval.toFixed(0)}`}
                className="h-16 w-16"
              />
              <div className="min-w-0 flex-1">
                <GaugeMetric label="异常检测" value={tel.anomaly} />
                <GaugeMetric label="故障状态" value={tel.faultState} />
              </div>
            </div>
          </GaugeCard>

          <GaugeCard title="控制 / 任务" domain="运行状态">
            <div className="flex items-center gap-3">
              <RadialRing
                pct={tel.taskProgressPct}
                stroke="var(--color-water)"
                text={`${tel.taskProgressPct.toFixed(0)}%`}
                className="h-16 w-16"
              />
              <div className="min-w-0 flex-1">
                <GaugeMetric label="控制输入" value={tel.controlInput.toFixed(3)} />
                <GaugeMetric label="任务进度" value={`${tel.taskProgressPct.toFixed(1)}%`} highlight />
              </div>
            </div>
          </GaugeCard>

          <GaugeCard title="时延 · 丢包" domain="通信" className="col-span-2 xl:col-span-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11.5px] text-ink-faint">时延</span>
                  <span className="font-mono text-[13px] font-700 tabular-nums text-primary">
                    {tel.latencyMs.toFixed(1)} ms
                  </span>
                </div>
                <Sparkline data={latencySeries} className="mt-1 h-7 w-full text-water" />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11.5px] text-ink-faint">丢包率</span>
                  <span className="font-mono text-[13px] font-700 tabular-nums text-ink">
                    {tel.packetLossPct.toFixed(2)} %
                  </span>
                </div>
                <Sparkline data={lossSeries} className="mt-1 h-7 w-full text-ink-faint" />
              </div>
            </div>
          </GaugeCard>
        </section>
      </div>
    </div>
  )
}

function HudChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-ink/50 px-2 py-1.5 text-center backdrop-blur-sm">
      <div className="font-mono text-[9px] tracking-wider text-surface/70">{label}</div>
      <div className="font-mono text-[13px] font-600 tabular-nums text-surface">{value}</div>
    </div>
  )
}
