import { CloudScene } from '@/components/cloud/CloudScene'
import { FaultGrid } from '@/components/cloud/FaultGrid'
import { Badge, Dot } from '@/components/ui'
import { useFleetStore } from '@/store/usvStore'

/** 原云侧主页 3D 场景 — 藏于「场景展示」子页 */
export default function CloudScenePage() {
  const source = useFleetStore((state) => state.source)

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="relative h-full min-w-0 flex-1">
        <CloudScene />

        <div className="pointer-events-none absolute left-6 top-5 z-10 fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="panel-flat flex flex-wrap items-center gap-3 rounded-lg px-4 py-2.5 shadow-1">
            <div className="flex items-center gap-2">
              <Dot tone="ok" pulse />
              <span className="font-display text-[14px] font-600 text-ink">
                {source === 'live' ? '六艇实时轨迹' : '六艇演示轨迹'}
              </span>
            </div>
            {source === 'live' && (
              <>
                <span className="h-4 w-px bg-line" />
                <Badge tone="ok">WebSocket 完整帧</Badge>
              </>
            )}
          </div>
        </div>

        <div className="pointer-events-none absolute right-6 top-5 z-10 fade-in" style={{ animationDelay: '0.12s' }}>
          <div className="chip rounded-md bg-surface/80 px-3 py-1.5 text-ink-soft ring-1 ring-line-soft backdrop-blur-md shadow-1">
            拖拽旋转 · 滚轮缩放 · 开启平移后左键直接拖拽
          </div>
        </div>
      </div>

      <div className="h-full w-[320px] shrink-0 overflow-y-auto border-l border-line-soft bg-gradient-to-b from-bg-2/50 to-bg/40 px-3.5 py-4 backdrop-blur-sm">
        <FaultGrid />
      </div>
    </div>
  )
}
