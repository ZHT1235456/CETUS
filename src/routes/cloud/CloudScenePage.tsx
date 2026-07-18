import { CloudScene } from '@/components/cloud/CloudScene'
import { FaultGrid } from '@/components/cloud/FaultGrid'
import { Badge, Dot } from '@/components/ui'
import { ENABLE_LIVE_WS } from '@/hooks/useFleetRuntime'
import { useFleetStore } from '@/store/usvStore'

/** 原云侧主页 3D 场景 — 藏于「场景展示」子页 */
export default function CloudScenePage() {
  const source = useFleetStore((state) => state.source)
  const receiver = useFleetStore((state) => state.receiver)

  const receiverView = !ENABLE_LIVE_WS
    ? { tone: 'water' as const, text: 'DEMO — 自定义编队轨迹驱动' }
    : receiver.state === 'live'
      ? { tone: 'ok' as const, text: `LIVE — ${receiver.bindAddress}` }
      : receiver.state === 'timedOut'
        ? { tone: 'warn' as const, text: 'TIMEOUT — 已冻结最后一帧，等待发送恢复' }
        : receiver.state === 'error'
          ? { tone: 'alert' as const, text: 'ERROR — WebSocket 连接失败' }
          : receiver.state === 'listening'
            ? { tone: 'warn' as const, text: 'CONNECTING — 首帧前继续播放内置轨迹' }
            : { tone: 'ghost' as const, text: 'IDLE — 内置轨迹回放' }

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
            <span className="h-4 w-px bg-line" />
            {source === 'live' ? (
              <Badge tone="ok">WebSocket 完整帧</Badge>
            ) : (
              <Badge tone="water">演示轨迹 · DEMO</Badge>
            )}
            <Badge tone="ghost">场景展示 · 按需打开</Badge>
          </div>
        </div>

        <div className="pointer-events-none absolute right-6 top-5 z-10 fade-in" style={{ animationDelay: '0.12s' }}>
          <div className="chip rounded-md bg-surface/80 px-3 py-1.5 text-ink-soft ring-1 ring-line-soft backdrop-blur-md shadow-1">
            拖拽旋转 · 滚轮缩放 · 开启平移后左键直接拖拽
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-5 left-6 z-10 fade-in" style={{ animationDelay: '0.18s' }}>
          <div className="panel-flat flex items-center gap-3 rounded-lg px-4 py-2.5 shadow-1">
            <span className="label-eyebrow">
              {ENABLE_LIVE_WS ? `WS · ${receiver.bindAddress}` : 'TRAJ · DEMO'}
            </span>
            <span className="h-4 w-px bg-line" />
            <span
              className={`flex items-center gap-1.5 font-mono text-[12px] ${
                receiverView.tone === 'ok'
                  ? 'text-ok'
                  : receiverView.tone === 'alert'
                    ? 'text-accent'
                    : receiverView.tone === 'warn'
                      ? 'text-warn'
                      : receiverView.tone === 'water'
                        ? 'text-water'
                        : 'text-ink-faint'
              }`}
            >
              <Dot tone={receiverView.tone === 'water' ? 'water' : receiverView.tone} pulse={receiverView.tone === 'ok'} />
              {receiverView.text}
            </span>
          </div>
        </div>
      </div>

      <div className="h-full w-[320px] shrink-0 overflow-y-auto border-l border-line-soft bg-gradient-to-b from-bg-2/50 to-bg/40 px-3.5 py-4 backdrop-blur-sm">
        <FaultGrid />
      </div>
    </div>
  )
}
