import { useNavigate } from 'react-router-dom'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { Cloud, Waypoints, Server, Anchor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FLEET_BY_ID } from '@/config/fleet'
import { useFleetStore } from '@/store/usvStore'
import { Dot } from '@/components/ui'
import type { USVId } from '@/types/usv'

export type TreeNodeKind = 'cloud' | 'edge' | 'terminal' | 'usv'

export interface TreeData {
  kind: TreeNodeKind
  label: string
  en?: string
  navTo?: string
  usvId?: USVId
  formationKey?: 'A' | 'B'
  [k: string]: unknown
}

type RFN = Node<TreeData, 'tree'>

export function TreeNode({ data }: NodeProps<RFN>) {
  const navigate = useNavigate()
  const unit = useFleetUnit(data.usvId)
  const clickable = !!data.navTo
  const onClick = clickable ? () => navigate(data.navTo!) : undefined

  const common =
    'relative w-full rounded-sm transition-all duration-300 cursor-default select-none'

  switch (data.kind) {
    case 'cloud':
      return (
        <div
          onDoubleClick={onClick}
          onClick={onClick}
          className={cn(common, 'group hover:scale-[1.015]')}
          style={{ width: 252 }}
        >
          <Handle type="source" position={Position.Bottom} className="!bottom-[-2px]" />
          <div className="relative overflow-hidden rounded-sm border border-primary/25 bg-gradient-to-b from-primary to-primary-2 px-5 py-4 text-surface shadow-2">
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'radial-gradient(120% 100% at 50% 0, rgba(255,255,255,.45), transparent 60%)',
              }}
            />
            <div className="relative flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-sm bg-surface/15 ring-1 ring-surface/30">
                <Cloud className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[17px] font-700 leading-none">{data.label}</span>
                  <span className="chip text-surface/70">{data.en}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 font-mono text-[10.5px] text-surface/80">
                  <Dot tone="ok" pulse />
                  编队在线 · 6/6
                </div>
              </div>
            </div>
          </div>
          <NavHint show={clickable} />
        </div>
      )

    case 'edge':
      return (
        <div
          onDoubleClick={onClick}
          onClick={onClick}
          className={cn(common, 'group')}
          style={{ width: 196 }}
        >
          <Handle type="target" position={Position.Top} className="!top-[-2px]" />
          <Handle type="source" position={Position.Bottom} className="!bottom-[-2px]" />
          <div className="relative overflow-hidden rounded-sm border border-water/30 bg-gradient-to-b from-surface to-frost px-4 py-3 text-ink shadow-1 transition-all group-hover:border-water/60 group-hover:shadow-2">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-sm border border-water/25 bg-water/10 text-water">
                <Waypoints className="h-[16px] w-[16px]" strokeWidth={1.7} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[15px] font-600">{data.label}</span>
                  <span className="chip text-ink-faint">{navEn(data.navTo)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-water">
                  <span className="font-700">F{data.formationKey}</span>
                  · leader-follower × 3
                </div>
              </div>
            </div>
          </div>
          <NavHint show={clickable} />
        </div>
      )

    case 'terminal':
      return (
        <div
          onDoubleClick={onClick}
          onClick={onClick}
          className={cn(common, 'group')}
          style={{ width: 168 }}
        >
          <Handle type="target" position={Position.Top} className="!top-[-2px]" />
          <Handle type="source" position={Position.Bottom} className="!bottom-[-2px]" />
          <div className="relative overflow-hidden rounded-sm border border-line-strong/60 bg-surface px-3.5 py-2.5 text-ink shadow-1 transition-all group-hover:border-primary/50 group-hover:shadow-2">
            <div className="flex items-center gap-2.5">
              <div className="grid h-7 w-7 place-items-center rounded-sm bg-primary/8 text-primary ring-1 ring-primary/15">
                <Server className="h-[14px] w-[14px]" strokeWidth={1.8} />
              </div>
              <div className="flex-1">
                <div className="font-display text-[13.5px] font-600 leading-tight">{data.label}</div>
                <div className="chip text-ink-faint">端 · 单艇节点</div>
              </div>
            </div>
          </div>
          <NavHint show={clickable} />
        </div>
      )

    case 'usv': {
      const cfg = data.usvId ? FLEET_BY_ID[data.usvId] : null
      const isUn = cfg?.model === 'untextured'
      return (
        <div className={cn(common, 'cursor-default')} style={{ width: 150 }}>
          <Handle type="target" position={Position.Top} className="!top-[-2px]" />
          <div
            className={cn(
              'relative overflow-hidden rounded-sm border px-3 py-2.5 transition-all',
              isUn
                ? 'border-water/30 bg-water/6'
                : 'border-line-soft bg-surface',
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-sm ring-1',
                  isUn
                    ? 'bg-water/10 text-water ring-water/25'
                    : 'bg-primary/8 text-primary ring-primary/15',
                )}
              >
                <Anchor className="h-[15px] w-[15px]" strokeWidth={1.8} />
              </div>
              <div className="flex-1 leading-tight">
                <div className="font-mono text-[12.5px] font-700 tracking-tight text-ink">
                  {data.usvId}
                </div>
                <div
                  className={cn(
                    'chip',
                    isUn ? 'text-water' : 'text-ink-faint',
                  )}
                >
                  {isUn ? '虚拟领导者' : '真实艇'}
                </div>
              </div>
            </div>
            {/* mini health strip */}
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-ghost/25">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${unit.health}%`,
                    background: unit.isFault
                      ? 'linear-gradient(90deg,#ff9a8a,#ff7a6b)'
                      : 'linear-gradient(90deg,#6fe7c7,#2dc993)',
                  }}
                />
              </div>
              <span
                className={cn(
                  'font-mono text-[9.5px] font-500',
                  unit.isFault ? 'text-accent' : 'text-ink-soft',
                )}
              >
                {unit.health.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )
    }
  }
}

function navEn(navTo?: string) {
  if (navTo === '/architecture') return 'Architecture'
  if (navTo === '/cloud') return 'Cloud'
  if (navTo === '/edge') return 'Edge'
  if (navTo === '/terminal') return 'Terminal'
  return ''
}

function useFleetUnit(id?: USVId) {
  return useFleetStore((s) => (id ? s.frame[id] : { health: 100, isFault: false }))
}

function NavHint({ show }: { show?: boolean }) {
  if (!show) return null
  return (
    <div className="pointer-events-none absolute -right-1.5 top-1/2 hidden -translate-y-1/2 translate-x-full items-center gap-1 pl-1 group-hover:flex">
      <span className="chip rounded-xs bg-primary/10 px-1.5 py-0.5 text-primary">跳转 →</span>
    </div>
  )
}

