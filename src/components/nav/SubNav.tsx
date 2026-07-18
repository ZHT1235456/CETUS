import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export type SubNavItem = {
  to: string
  label: string
  end?: boolean
}

export function SubNav({ items }: { items: readonly SubNavItem[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 border-b border-line-soft/80 bg-surface/40 px-5 py-2.5 backdrop-blur-md">
      {items.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'rounded-sm px-3 py-1.5 font-display text-[13px] font-600 transition-all duration-200',
              isActive
                ? 'bg-primary/10 text-primary shadow-1 ring-1 ring-primary/15'
                : 'text-ink-soft hover:-translate-y-px hover:bg-frost hover:text-ink',
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
