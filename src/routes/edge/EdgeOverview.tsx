import { Link } from 'react-router-dom'
import { EdgeArchitectureDiagram } from '@/components/diagrams/EdgeArchitectureDiagram'
import { DiagramPanel } from '@/components/diagrams/DiagramPanel'
import { Badge, Button } from '@/components/ui'

export default function EdgeOverview() {
  return (
    <div className="flex h-full min-h-0 flex-col px-6 pt-4 pb-5">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="label-eyebrow">Fig.3 · Edge Architecture</div>
          <h2 className="mt-1 font-display text-[20px] font-600 text-ink">边侧功能架构与数据流</h2>
          <p className="mt-1 max-w-3xl text-[13px] text-ink-soft">
            局部协调层：任务管理、多艇状态汇聚、局部规划与在线重构、边缘自治与应急处理。无全局六艇长周期档案。
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/edge/1">
            <Button variant="primary">进入边 1</Button>
          </Link>
          <Link to="/edge/2">
            <Button variant="outline">进入边 2</Button>
          </Link>
        </div>
      </header>
      <DiagramPanel
        eyebrow="EDGE TIER"
        title="任务解析 · 状态汇聚 · 局部规划 · 边缘自治"
        actions={
          <>
            <Badge tone="water">近实时 · 分管 3 艇</Badge>
            <Badge tone="ghost">不改云侧任务目标边界</Badge>
          </>
        }
      >
        <EdgeArchitectureDiagram className="mx-auto h-auto w-full max-w-5xl" />
      </DiagramPanel>
    </div>
  )
}
