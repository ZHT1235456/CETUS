import { Outlet } from 'react-router-dom'
import { SubNav } from '@/components/nav/SubNav'

const ITEMS = [
  { to: '/edge/overview', label: '架构总览', end: true },
  { to: '/edge/1', label: '边 1' },
  { to: '/edge/2', label: '边 2' },
] as const

export default function EdgeLayout() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <SubNav items={ITEMS} />
      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
