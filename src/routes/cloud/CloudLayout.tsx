import { Outlet } from 'react-router-dom'
import { SubNav } from '@/components/nav/SubNav'

const ITEMS = [
  { to: '/cloud/overview', label: '架构总览', end: true },
  { to: '/cloud/decision', label: '集群决策' },
  { to: '/cloud/monitor', label: '检测与历史' },
  { to: '/cloud/lifecycle', label: '全生命周期' },
  { to: '/cloud/scene', label: '场景展示' },
] as const

export default function CloudLayout() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <SubNav items={ITEMS} />
      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
