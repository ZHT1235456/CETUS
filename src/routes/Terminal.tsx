import { Radar, Navigation, Radio, Cpu, Plug, Cable } from 'lucide-react'
import { Badge, Dot } from '@/components/ui'

const DOMAINS = ['感知域', '运动控制域', '通信域', '机舱域', '预测与健康管理域'] as const
const ICONS = [Radar, Navigation, Radio, Cpu, Plug]

export default function Terminal() {
  return (
    <div className="grid h-full place-items-center px-8 py-10">
      <div className="w-full max-w-3xl rise">
        <div className="panel rounded-lg p-6 shadow-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="label-eyebrow">Terminal Tier · 待扩展</span>
                <Dot tone="warn" pulse />
              </div>
              <h2 className="mt-1 font-display text-[24px] font-700 text-ink">端 · 单艇本机控制面</h2>
              <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink-soft">
                本域将呈现单艇本机控制面与多域总线遥测。实时数据将由另一台计算机经
                <span className="font-mono text-water"> WebSocket </span>
                传入并经 Tauri 转发至本端面。
              </p>
            </div>
            <Badge tone="warn">未启用</Badge>
          </div>

          <div className="hairline my-5" />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {DOMAINS.map((d, i) => {
              const Icon = ICONS[i]
              return (
                <div
                  key={d}
                  className="relative overflow-hidden rounded-sm border border-line-soft bg-surface/70 p-3 transition-shadow hover:shadow-1"
                >
                  <div className="absolute right-2 top-2 font-mono text-[9px] text-ink-ghost">
                    P0{i + 1}
                  </div>
                  <div className="grid h-8 w-8 place-items-center rounded-sm bg-frost text-ink-faint">
                    <Icon className="h-[16px] w-[16px]" strokeWidth={1.7} />
                  </div>
                  <div className="mt-2 font-display text-[12.5px] font-600 leading-tight text-ink-soft">
                    {d}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-ghost" />
                    <span className="chip text-ink-ghost">未接入</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {[0, 1, 2].map((k) => (
                      <div key={k} className="h-1 w-full rounded-full bg-ink-ghost/20" />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoCard
            title="实时数据通道"
            body="WebSocket + Tauri · 同一局域网内由协同计算机推送位姿 / 故障 / PHM 帧至本控制站。"
            chip="待扩展"
          />
          <InfoCard
            title="本机控制职责"
            body="感知融合 → 运动闭环 → 链路控制 → 舱况采集 → 健康预测的端侧闭环执行与展示。"
            chip="规划中"
          />
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-ink-faint">
          <Cable className="h-3.5 w-3.5" />
          <span className="chip">CETUS · Terminal Tier 占位 · 后续迭代</span>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ title, body, chip }: { title: string; body: string; chip: string }) {
  return (
    <div className="panel-flat rounded-md p-4 shadow-1">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-[14.5px] font-600 text-ink">{title}</h4>
        <Badge tone="ghost">{chip}</Badge>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">{body}</p>
    </div>
  )
}