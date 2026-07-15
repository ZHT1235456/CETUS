import { CloudScene } from '@/components/cloud/CloudScene'
import { FaultGrid } from '@/components/cloud/FaultGrid'
import { Badge, Dot } from '@/components/ui'

export default function Cloud() {
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* 左：3D 编队场景 */}
      <div className="relative h-full min-w-0 flex-1 bg-bg-2/30">
        <CloudScene />

        {/* 左上 · 编队概览浮层 */}
        <div className="pointer-events-none absolute left-6 top-5 z-10">
          <div className="panel-flat flex items-center gap-3 rounded-sm px-3.5 py-2">
            <div className="flex items-center gap-2">
              <Dot tone="ok" pulse />
              <span className="font-display text-[13px] font-600 text-ink">六艇正六边形编队</span>
            </div>
            <span className="h-4 w-px bg-line" />
            <Badge tone="water">逆时针 · 慢转</Badge>
            <Badge tone="ghost">4× 实艇 · 2× 虚拟领导者</Badge>
          </div>
        </div>

        {/* 右上 · 操作提示 */}
        <div className="pointer-events-none absolute right-6 top-5 z-10">
          <div className="chip rounded-xs bg-surface/70 px-2.5 py-1 text-ink-soft ring-1 ring-line-soft backdrop-blur">
            鼠标拖拽旋转 · 滚轮缩放
          </div>
        </div>

        {/* 底部 · WS 状态条（待扩展） */}
        <div className="pointer-events-none absolute bottom-5 left-6 z-10">
          <div className="panel-flat flex items-center gap-3 rounded-sm px-3.5 py-2">
            <span className="label-eyebrow">WS · Tauri</span>
            <span className="h-4 w-px bg-line" />
            <span className="flex items-center gap-1.5 font-mono text-[11.5px] text-warn">
              <Dot tone="warn" />
              STANDBY — 实时位姿/故障由另一台电脑传输接入（待扩展）
            </span>
          </div>
        </div>
      </div>

      {/* 右：故障与健康管理 侧边栏 */}
      <div className="h-full w-[300px] shrink-0 overflow-y-auto border-l border-line-soft bg-bg-2/40 px-3 py-4">
        <FaultGrid />
      </div>
    </div>
  )
}