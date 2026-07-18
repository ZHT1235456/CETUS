import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { flat?: boolean }
>(({ className, flat, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      flat ? 'panel-flat' : 'panel',
      'rounded-md text-ink',
      className,
    )}
    {...props}
  />
))
Card.displayName = 'Card'

export const CardHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-start justify-between gap-3 px-4 pt-4 pb-2.5', className)} {...p} />
)
export const CardBody = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-4 pb-4', className)} {...p} />
)

const badge = cva(
  'inline-flex items-center gap-1.5 rounded-xs px-2 py-0.5 font-mono text-[10.5px] font-500 uppercase tracking-[0.14em] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
  {
    variants: {
      tone: {
        neutral: 'bg-frost text-ink-soft ring-1 ring-line-soft',
        primary: 'bg-primary/8 text-primary ring-1 ring-primary/15',
        water: 'bg-water/12 text-water ring-1 ring-water/20',
        ok: 'bg-ok/15 text-ok ring-1 ring-ok/25',
        warn: 'bg-warn/18 text-warn ring-1 ring-warn/30',
        alert: 'bg-accent/15 text-accent ring-1 ring-accent/30',
        ghost: 'bg-transparent text-ink-faint ring-1 ring-line',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export const Badge = ({
  className,
  tone,
  ...p
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) => (
  <span className={cn(badge({ tone }), className)} {...p} />
)

export function Dot({ tone = 'ok', pulse }: { tone?: 'ok' | 'warn' | 'alert' | 'water' | 'ghost'; pulse?: boolean }) {
  const color =
    tone === 'ok' ? 'bg-ok' : tone === 'warn' ? 'bg-warn' : tone === 'alert' ? 'bg-accent' : tone === 'water' ? 'bg-water' : 'bg-ink-ghost'
  return (
    <span className="relative inline-flex h-2 w-2">
      <span className={cn('h-2 w-2 rounded-full', color)} />
      {pulse && (
        <span
          className={cn('absolute inset-0 rounded-full', color, 'opacity-60')}
          style={{ animation: 'pulse-soft 1.8s ease-in-out infinite' }}
        />
      )}
    </span>
  )
}

const btn = cva(
  'inline-flex items-center justify-center gap-2 rounded-sm font-display text-[13px] font-600 transition-all duration-200 active:translate-y-px disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-b from-primary-2 to-primary text-surface shadow-1 ring-1 ring-primary/30 hover:from-primary-3 hover:to-primary-2 hover:shadow-2',
        water: 'bg-gradient-to-b from-water-soft to-water text-surface shadow-1 ring-1 ring-water/30 hover:brightness-105',
        outline:
          'border border-line-strong bg-surface/60 text-primary hover:bg-frost hover:border-primary',
        ghost: 'text-ink-soft hover:bg-frost hover:text-ink',
      },
      size: { sm: 'h-8 px-3 text-[12px]', md: 'h-9 px-4', lg: 'h-11 px-5 text-[14px]' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export const Button = ({
  className,
  variant,
  size,
  ...p
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof btn>) => (
  <button className={cn(btn({ variant, size }), className)} {...p} />
)

/** 进度条 — 默认按健康度变色调色 */
export function Progress({
  value,
  tone = 'ok',
  className,
}: {
  value: number
  tone?: 'ok' | 'warn' | 'alert' | 'water'
  className?: string
}) {
  const ratio = Math.max(0, Math.min(100, value)) / 100
  const fill =
    tone === 'alert'
      ? 'linear-gradient(90deg,#ff9a8a,#ff7a6b)'
      : tone === 'warn'
        ? 'linear-gradient(90deg,#f5cf6a,#f5b335)'
        : tone === 'water'
          ? 'linear-gradient(90deg,#7fa8cc,#3d6d9b)'
          : 'linear-gradient(90deg,#6fe7c7,#2dc993)'
  return (
    <div className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-ink-ghost/25 ring-1 ring-inset ring-primary/8', className)}>
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${ratio * 100}%`,
          background: fill,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 0 6px -1px rgba(26,64,110,0.25)',
        }}
      />
    </div>
  )
}