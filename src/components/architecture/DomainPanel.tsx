import { Radar, Navigation, Radio, Cog, Activity, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge, Dot } from '@/components/ui'
import type { LucideIcon } from 'lucide-react'

type Tone = 'ok' | 'warn'
interface Domain {
  id: string
  zh: string
  en: string
  desc: string
  Icon: LucideIcon
  metrics: [string, string][]
  tone: Tone
}

const DOMAINS: Domain[] = [
  {
    id: 'perception',
    zh: '感知域',
    en: 'Perception',
    desc: '激光雷达 · 毫米波 · 光电 · AIS 融合感知',
    Icon: Radar,
    metrics: [
      ['传感器', '7'],
      ['点云率', '38k/s'],
      ['融合状态', 'OK'],
    ],
    tone: 'ok',
  },
  {
    id: 'motion',
    zh: '运动控制域',
    en: 'Motion Control',
    desc: '航向/航速闭环 · 编队保持 · 运动分配',
    Icon: Navigation,
    metrics: [
      ['闭环周期', '10ms'],
      ['航向偏差', '0.4°'],
      ['编队稳定', '稳'],
    ],
    tone: 'ok',
  },
  {
    id: 'comm',
    zh: '通信域',
    en: 'Communication',
    desc: '船间 mesh · 上行链路 · 链路冗余切换',
    Icon: Radio,
    metrics: [
      ['船间链路', '5/6'],
      ['上行延迟', '18ms'],
      ['冗余隧道', '待扩展'],
    ],
    tone: 'warn',
  },
  {
    id: 'machinery',
    zh: '机舱域',
    en: 'Machinery',
    desc: '推进 · 电力 · 舵机 · 液压舱况采集',
    Icon: Cog,
    metrics: [
      ['推进出力', '62%'],
      ['母线电压', '48.2V'],
      ['冷却温度', '43.6℃'],
    ],
    tone: 'ok',
  },
  {
    id: 'phm',
    zh: '预测与健康管理域',
    en: 'PHM',
    desc: '退化趋势预测 · 故障代码归集 · 健康度估计',
    Icon: Activity,
    metrics: [
      ['健康均值', '97.4%'],
      ['预警事件', '0'],
      ['故障码', '无'],
    ],
    tone: 'ok',
  },
]

export function DomainPanel() {
  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="flex items-center justify-between px-6 pt-6 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" strokeWidth={1.8} />
            <span className="label-eyebrow">Domain Controller</span>
          </div>
          <h3 className="mt-1 font-display text-[22px] font-600 text-ink">域控制器架构</h3>
        </div>
        <Badge tone="water">5 域 · 协同</Badge>
      </div>

      <div className="hairline mx-6" />

      <div className="relative side-scroll flex-1 space-y-3.5 overflow-y-auto px-6 py-5">
        <div
          className="pointer-events-none absolute left-[34px] top-7 bottom-7 w-px"
          style={{
            background:
              'linear-gradient(180deg, transparent, var(--color-line-strong), transparent)',
          }}
        />
        {DOMAINS.map((d, i) => (
          <DomainCard key={d.id} {...d} index={i} />
        ))}
      </div>
    </div>
  )
}

function DomainCard({
  zh,
  en,
  desc,
  Icon,
  metrics,
  tone,
  index,
}: {
  zh: string
  en: string
  desc: string
  Icon: LucideIcon
  metrics: [string, string][]
  tone: Tone
  index: number
}) {
  return (
    <div
      className="panel relative rounded-lg p-4 rise transition-shadow duration-300 hover:shadow-3"
      style={{ animationDelay: `${0.06 * index}s` }}
    >
      <div className="flex items-start gap-4">
        <div className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-md border border-primary/20 bg-gradient-to-b from-surface to-frost text-primary shadow-1">
          <Icon className="h-[20px] w-[20px]" strokeWidth={1.7} />
          <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 font-mono text-[9.5px] font-700 text-surface shadow-1">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[18px] font-600 text-ink">{zh}</span>
                <span className="chip text-ink-faint">{en}</span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{desc}</p>
            </div>
            <span className="flex items-center gap-1.5">
              <Dot tone={tone} pulse />
              <span className={cn('chip', tone === 'ok' ? 'text-ok' : 'text-warn')}>
                {tone === 'ok' ? '正常' : '降级'}
              </span>
            </span>
          </div>

          <div className="mt-3.5 grid grid-cols-3 gap-2.5">
            {metrics.map(([k, v]) => (
              <div
                key={k}
                className="rounded-sm border border-line-soft bg-surface/80 px-2.5 py-2.5"
              >
                <div className="chip text-ink-faint">{k}</div>
                <div className="mt-0.5 font-mono text-[13.5px] font-600 text-ink">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}