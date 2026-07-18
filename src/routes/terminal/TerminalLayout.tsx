import { Link, Outlet, useParams } from 'react-router-dom'
import { SubNav, type SubNavItem } from '@/components/nav/SubNav'
import { FLEET } from '@/config/fleet'
import type { USVId } from '@/types/usv'

const BASE: SubNavItem[] = [
  { to: '/terminal/overview', label: '架构总览', end: true },
  ...FLEET.map((u) => ({
    to: `/terminal/${u.id}`,
    label: u.id.replace('USV-', '艇'),
  })),
]

export default function TerminalLayout() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <SubNav items={BASE} />
      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}

export function TerminalVesselSwitcher() {
  const { usvId } = useParams()
  return (
    <div className="flex flex-wrap gap-1.5">
      {FLEET.map((u) => (
        <Link
          key={u.id}
          to={`/terminal/${u.id}`}
          className={
            usvId === u.id
              ? 'rounded-sm bg-primary/10 px-2.5 py-1 font-mono text-[12px] font-600 text-primary'
              : 'rounded-sm px-2.5 py-1 font-mono text-[12px] text-ink-soft hover:bg-frost'
          }
        >
          {u.id as USVId}
        </Link>
      ))}
    </div>
  )
}
