import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'

const TITLES: Record<string, { zh: string; en: string; sub: string }> = {
  '/architecture': { zh: '系统架构', en: 'System Architecture', sub: '云·边·端三级拓扑 与 域控制器功能域' },
  '/cloud': { zh: '云', en: 'Cloud Tier', sub: '集群全局态势 · 六艇正六边形编队 · 水域实时编队可视化' },
  '/edge': { zh: '边', en: 'Edge Tier', sub: '编队 Leader-Follower 控制拓扑 与 节点健康监测' },
  '/terminal': { zh: '端', en: 'Terminal Tier', sub: '单艇域总线控制面 · 待扩展' },
}

export function Layout() {
  const { pathname } = useLocation()
  const match = TITLES[pathname] ?? { zh: '系统架构', en: 'System Architecture', sub: '' }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      <div className="atmosphere" />
      <Sidebar />
      <main className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-end justify-between border-b border-line-soft px-8 pt-5 pb-4">
          <div className="rise">
            <div className="flex items-baseline gap-3.5">
              <span className="label-eyebrow">{match.en}</span>
              <span className="h-px w-12 bg-line-strong" />
              <span className="chip text-ink-faint">TIER · 协同控制</span>
            </div>
            <h1 className="mt-1.5 font-display text-[34px] font-700 leading-none tracking-tight text-ink">
              {match.zh}
              <span className="ml-3 font-mono text-[13px] font-400 tracking-normal text-ink-faint">
                ┄ {match.en}
              </span>
            </h1>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">
              {match.sub}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <Meter label="在线编队" value="6 / 6" />
            <Meter label="健康均值" value="97.4%" tone="ok" />
            <Meter label="告警" value="0" />
            <div className="grid h-11 w-11 place-items-center rounded-[10px] border border-line-soft bg-surface/70 font-display text-[14px] font-600 text-primary shadow-1">
              东南
            </div>
          </div>
        </header>

        {/* Page */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function Meter({ label, value, tone }: { label: string; value: string; tone?: 'ok' }) {
  return (
    <div className="text-right">
      <div className="chip text-ink-faint">{label}</div>
      <div
        className={
          'font-mono text-[15px] font-500 ' + (tone === 'ok' ? 'text-ok' : 'text-ink')
        }
      >
        {value}
      </div>
    </div>
  )
}