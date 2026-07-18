import { Outlet } from 'react-router-dom'
import { SubNav, type SubNavItem } from '@/components/nav/SubNav'
import { FLEET } from '@/config/fleet'

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
