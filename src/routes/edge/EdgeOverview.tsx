import { Link } from 'react-router-dom'
import { EdgeArchitectureDiagram } from '@/components/diagrams/EdgeArchitectureDiagram'
import { DiagramPanel } from '@/components/diagrams/DiagramPanel'
import { Badge, Button } from '@/components/ui'

export default function EdgeOverview() {
  return (
    <div className="flex h-full min-h-0 flex-col px-6 pt-4 pb-5">
      <DiagramPanel
        eyebrow="EDGE TIER"
        title="任务解析 · 状态汇聚 · 局部规划 · 边缘自治"
        actions={
          <>
            <Badge tone="water">近实时 · 分管 3 艇</Badge>
            <Link to="/edge/1" className="shrink-0">
              <Button variant="primary" size="sm">进入边 1</Button>
            </Link>
            <Link to="/edge/2" className="shrink-0">
              <Button variant="outline" size="sm">进入边 2</Button>
            </Link>
          </>
        }
      >
        <EdgeArchitectureDiagram className="mx-auto h-auto w-full max-w-5xl" />
      </DiagramPanel>
    </div>
  )
}
