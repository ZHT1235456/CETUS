import { OverallArchitectureDiagram } from '@/components/diagrams/OverallArchitectureDiagram'
import { DiagramPanel } from '@/components/diagrams/DiagramPanel'
import { Badge } from '@/components/ui'

export default function Architecture() {
  return (
    <div className="flex h-full min-h-0 flex-col px-6 pt-5 pb-5">
      <DiagramPanel
        eyebrow="CETUS · SYS-ARCH"
        title="系统总体架构图 · 云侧 / 边侧 / 端侧"
        contentClassName="p-5"
      >
        <OverallArchitectureDiagram className="mx-auto h-auto w-full max-w-[940px]" />
        <div className="mx-auto mt-5 grid max-w-[1100px] gap-3 border-t border-line-soft pt-4 sm:grid-cols-3">
          <Boundary
            tier="云侧"
            tone="water"
            scope="全局 · 跨任务 · 长周期"
            duty="集群决策、数据收集、状态检测与历史回溯、全生命周期数据管理，经数据中心统一沉淀"
            limit="不进入端侧高频运动控制；历史回溯不形成在线决策输入"
          />
          <Boundary
            tier="边侧"
            tone="warn"
            scope="任务水域 · 多艇 · 局部时域"
            duty="任务管理、多艇状态汇聚、局部规划与在线重构、边缘自治与应急处理，依托实时数据库缓存"
            limit="不替代云侧全局规划；不修改云侧任务目标边界"
          />
          <Boundary
            tier="端侧"
            tone="ok"
            scope="单艇 · 本地 · 实时"
            duty="感知、运动控制、机舱、通信四域协同执行，预测与健康状态管理域统筹上报"
            limit="健康评估不直接干预运动控制；失联策略不超出预配置权限"
          />
        </div>
      </DiagramPanel>
    </div>
  )
}

function Boundary({
  tier,
  tone,
  scope,
  duty,
  limit,
}: {
  tier: string
  tone: 'water' | 'warn' | 'ok'
  scope: string
  duty: string
  limit: string
}) {
  return (
    <div className="card-hover rounded-md border border-line-soft bg-surface/70 px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="font-display text-[14px] font-700 text-ink">{tier}</div>
        <Badge tone={tone}>{scope}</Badge>
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">{duty}</p>
      <div className="hairline my-2 opacity-70" />
      <p className="text-[11.5px] leading-relaxed text-ink-faint">边界：{limit}</p>
    </div>
  )
}
