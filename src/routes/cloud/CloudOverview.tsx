import { Link } from 'react-router-dom'
import { CloudArchitectureDiagram } from '@/components/diagrams/CloudArchitectureDiagram'
import { DiagramPanel } from '@/components/diagrams/DiagramPanel'
import { Badge, Button } from '@/components/ui'

export default function CloudOverview() {
  return (
    <div className="flex h-full min-h-0 flex-col px-6 pt-4 pb-5">
      <DiagramPanel
        eyebrow="CLOUD TIER"
        title="数据收集 → 状态检测 → 集群决策 / 全生命周期"
        actions={
          <>
            <Badge tone="water">数据收集并入本图输入侧</Badge>
            <Badge tone="ghost">历史回溯 ↛ 在线决策</Badge>
            <Link to="/cloud/scene" className="shrink-0">
              <Button variant="primary" size="sm">打开场景展示</Button>
            </Link>
          </>
        }
      >
        <CloudArchitectureDiagram className="mx-auto h-auto w-full max-w-5xl" />
      </DiagramPanel>
    </div>
  )
}
