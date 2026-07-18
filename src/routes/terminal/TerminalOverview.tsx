import { TerminalArchitectureDiagram } from '@/components/diagrams/TerminalArchitectureDiagram'
import { DiagramPanel } from '@/components/diagrams/DiagramPanel'
import { Badge } from '@/components/ui'

export default function TerminalOverview() {
  return (
    <div className="flex h-full min-h-0 flex-col px-6 pt-4 pb-5">
      <header className="mb-3">
        <div className="label-eyebrow">Fig.4 · Terminal Domains</div>
        <h2 className="mt-1 font-display text-[20px] font-600 text-ink">端侧五域功能架构与数据交互</h2>
        <p className="mt-1 max-w-3xl text-[13px] text-ink-soft">
          感知、运动控制、机能、通信四域协同执行，决策与运行状态管理域统筹评估——只上报，不直接控运动。点击图下方艇号进入实例。
        </p>
        <div className="mt-2 flex gap-2">
          <Badge tone="water">单艇 · 本地 · 实时</Badge>
          <Badge tone="ghost">无状态-时间曲线</Badge>
        </div>
      </header>
      <DiagramPanel
        eyebrow="TERMINAL TIER"
        title="全国产域控制器 · 五域协同"
        actions={
          <>
            <Badge tone="ok">四域上行</Badge>
            <Badge tone="ghost">决策评估 ↛ 直接控运动</Badge>
          </>
        }
      >
        <TerminalArchitectureDiagram className="mx-auto h-auto w-full max-w-5xl" />
      </DiagramPanel>
    </div>
  )
}
