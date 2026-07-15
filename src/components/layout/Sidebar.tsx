import { NavLink, useLocation } from 'react-router-dom'
import { Network, Cloud, Waypoints, TerminalSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocalClock } from './Layout'

const NAV = [
  { to: '/architecture', label: '系统架构', en: 'Architecture', Icon: Network, idx: '01' },
  { to: '/cloud', label: '云', en: 'Cloud', Icon: Cloud, idx: '02' },
  { to: '/edge', label: '边', en: 'Edge', Icon: Waypoints, idx: '03' },
  { to: '/terminal', label: '端', en: 'Terminal', Icon: TerminalSquare, idx: '04' },
] as const

export function Sidebar() {
  const { pathname } = useLocation()
  const clock = useLocalClock()

  return (
    <aside className="relative z-10 flex h-full w-[252px] shrink-0 flex-col border-r border-line-soft bg-surface-2/75 backdrop-blur-2xl">
      {/* Brand */}
      <div className="px-6 pt-7 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative grid h-11 w-11 place-items-center rounded-[12px] bg-gradient-to-b from-primary to-primary-2 text-surface shadow-2">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
              <path
                d="M2.5 14c3.2-2.4 5-2.4 8.2 0s5 2.4 8.2 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="opacity-90"
              />
              <path
                d="M2.5 18.5c3.2-2.4 5-2.4 8.2 0s5 2.4 8.2 0"
                stroke="var(--color-ok)"
                strokeWidth="2"
                strokeLinecap="round"
                className="opacity-85"
              />
              <path
                d="M12 3.2l2.6 3.9h-1.5v4.6h-2.2V7.1H9.4z"
                fill="currentColor"
                className="opacity-95"
              />
            </svg>
            <span
              className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-ok ring-2 ring-surface"
              style={{ animation: 'pulse-soft 2.2s ease-in-out infinite' }}
            />
          </div>
          <div className="leading-tight">
            <div className="font-display text-[21px] font-700 tracking-tight text-ink">
              CETUS
            </div>
            <div className="chip text-ink-faint">Cloud-Edge-Terminal USV System</div>
          </div>
        </div>
        <p className="mt-4 font-display text-[13px] font-500 leading-relaxed text-ink-soft">
          无人艇集群
          <br />
          <span className="text-ink-faint">云·边·端</span> 协同控制上位机
        </p>
      </div>

      <div className="hairline mx-5" />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1.5 px-3 py-4">
        <div className="px-3 pb-2 label-eyebrow">Navigation</div>
        {NAV.map(({ to, label, en, Icon, idx }) => {
          const active = pathname === to
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'group relative flex items-center gap-3.5 rounded-md px-3 py-3 transition-all duration-300',
                active
                  ? 'bg-primary/9 text-primary shadow-[inset_0_0_0_1px_rgba(26,64,110,0.08)]'
                  : 'text-ink-soft hover:bg-frost hover:text-ink',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full bg-primary shadow-[0_0_12px_rgba(26,64,110,0.35)]" />
              )}
              <span
                className={cn(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border transition-all duration-300',
                  active
                    ? 'border-primary/25 bg-gradient-to-b from-primary to-primary-2 text-surface shadow-1'
                    : 'border-line-soft bg-surface/70 text-ink-soft group-hover:border-line-strong group-hover:text-primary',
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-display text-[15.5px] font-600 leading-tight">
                  {label}
                </span>
                <span className="chip text-ink-faint">{en}</span>
              </span>
              <span
                className={cn(
                  'font-mono text-[11px] transition-colors',
                  active ? 'text-primary/55' : 'text-ink-ghost',
                )}
              >
                {idx}
              </span>
            </NavLink>
          )
        })}
      </nav>

      {/* Footer telemetry */}
      <div className="mt-auto px-5 pb-5">
        <div className="hairline mb-4" />
        <div className="space-y-2.5 rounded-md border border-line-soft/80 bg-surface/45 px-3 py-3">
          <Telemetry label="LOCAL TIME" value={clock} />
          <Telemetry label="FLEET LINK" value="ONLINE" dot />
          <Telemetry label="WS TUNNEL" value="STANDBY" tone="warn" />
        </div>
        <div className="mt-3.5 flex items-center justify-between chip text-ink-ghost">
          <span>CETUS · v0.1.0</span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full bg-ok"
              style={{ animation: 'pulse-soft 2.2s ease-in-out infinite' }}
            />
            LIVE
          </span>
        </div>
      </div>
    </aside>
  )
}

function Telemetry({
  label,
  value,
  tone,
  dot,
}: {
  label: string
  value: string
  tone?: 'warn'
  dot?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="chip text-ink-faint">{label}</span>
      <span className="flex items-center gap-1.5">
        {dot && (
          <span
            className="h-1.5 w-1.5 rounded-full bg-ok"
            style={{ animation: 'pulse-soft 2s ease-in-out infinite' }}
          />
        )}
        <span
          className={
            'font-mono text-[12.5px] font-600 tabular-nums ' +
            (tone === 'warn' ? 'text-warn' : 'text-ink')
          }
        >
          {value}
        </span>
      </span>
    </div>
  )
}
