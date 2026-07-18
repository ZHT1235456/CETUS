import type { ReactNode } from 'react'
import { DraftingCompass } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 图表面板 — 蓝图质感装裱：顶部工具条式标题栏 + 细网格底纹 + 四角刻度线
 */
export function DiagramPanel({
  eyebrow,
  title,
  actions,
  children,
  className,
  contentClassName,
}: {
  eyebrow: string
  title: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <div
      className={cn(
        'panel relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg ring-1 ring-line-soft/80',
        className,
      )}
    >
      {/* 工具条式标题栏 */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-line-soft/70 bg-surface/60 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-xs bg-primary/8 text-primary ring-1 ring-primary/15">
            <DraftingCompass className="h-3.5 w-3.5" strokeWidth={1.8} />
          </span>
          <span className="label-eyebrow shrink-0">{eyebrow}</span>
          <span className="h-3.5 w-px shrink-0 bg-line-soft" />
          <span className="truncate font-display text-[13px] font-600 text-ink">{title}</span>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {/* 绘图板画布 */}
      <div className="relative min-h-0 flex-1">
        <div className={cn('blueprint-bg absolute inset-0 overflow-auto p-4', contentClassName)}>
          {children}
        </div>
        {/* 四角刻度线 */}
        <span className="pointer-events-none absolute left-2 top-2 z-10 h-3.5 w-3.5 border-l-2 border-t-2 border-primary/30" />
        <span className="pointer-events-none absolute right-2 top-2 z-10 h-3.5 w-3.5 border-r-2 border-t-2 border-primary/30" />
        <span className="pointer-events-none absolute bottom-2 left-2 z-10 h-3.5 w-3.5 border-b-2 border-l-2 border-primary/30" />
        <span className="pointer-events-none absolute bottom-2 right-2 z-10 h-3.5 w-3.5 border-b-2 border-r-2 border-primary/30" />
      </div>
    </div>
  )
}
