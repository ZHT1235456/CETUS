import { Link } from 'react-router-dom'
import { CloudArchitectureDiagram } from '@/components/diagrams/CloudArchitectureDiagram'
import { DiagramPanel } from '@/components/diagrams/DiagramPanel'
import { Badge, Button } from '@/components/ui'

export default function CloudOverview() {
  return (
    <div className="flex h-full min-h-0 flex-col px-6 pt-4 pb-5">
      <header className="mb-3 flex items-end justify-between gap-4">
        <div>
          <div className="label-eyebrow">Fig.2 · Cloud Architecture</div>
          <h2 className="mt-1 font-display text-[20px] font-600 text-ink">云侧功能架构与数据流</h2>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ink-soft">
            在线路径服务集群决策；离线路径服务历史回溯与全生命周期管理。点击模块进入对应演示子页。
          </p>
        </div>
        <Link to="/cloud/scene" className="shrink-0">
          <Button variant="primary">打开场景展示</Button>
        </Link>
      </header>
      <DiagramPanel
        eyebrow="CLOUD TIER"
        title="数据收集 → 状态检测 → 集群决策 / 全生命周期"
        actions={
          <>
            <Badge tone="water">数据收集并入本图输入侧</Badge>
            <Badge tone="ghost">历史回溯 ↛ 在线决策</Badge>
          </>
        }
      >
        <CloudArchitectureDiagram className="mx-auto h-auto w-full max-w-5xl" />
      </DiagramPanel>
    </div>
  )
}
