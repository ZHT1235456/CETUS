import { TerminalArchitectureDiagram } from '@/components/diagrams/TerminalArchitectureDiagram'
import { DiagramPanel } from '@/components/diagrams/DiagramPanel'

export default function TerminalOverview() {
  return (
    <div className="flex h-full min-h-0 flex-col px-6 pt-4 pb-5">
      <DiagramPanel
        eyebrow="TERMINAL TIER"
        title="全国产域控制器 · 五域协同"
      >
        <TerminalArchitectureDiagram className="mx-auto h-auto w-full max-w-5xl" />
      </DiagramPanel>
    </div>
  )
}
