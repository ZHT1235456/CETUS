import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'

const TITLES: Record<string, { zh: string; en: string; sub: string }> = {
  '/architecture': {
    zh: '系统架构',
    en: 'System Architecture',
    sub: '云·边·端三级拓扑 与 域控制器功能域',
  },
  '/cloud': {
    zh: '云',
    en: 'Cloud Tier',
    sub: '集群全局态势 · 六艇正六边形编队 · 水域实时编队可视化',
  },
  '/edge': {
    zh: '边',
    en: 'Edge Tier',
    sub: '编队 Leader-Follower 控制拓扑 与 节点健康监测',
  },
  '/terminal': {
    zh: '端',
    en: 'Terminal Tier',
    sub: '单艇域总线控制面 · 待扩展',
  },
}

export function Layout() {
  const { pathname } = useLocation()
  const match = TITLES[pathname] ?? TITLES['/architecture']

  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      <div className="atmosphere" />
      <Sidebar />
      <main className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="relative flex items-end justify-between border-b border-line-soft px-8 pt-5 pb-4">
          <div
            key={pathname}
            className="rise"
            style={{ animationDuration: '0.45s' }}
          >
            <div className="flex items-baseline gap-3.5">
              <span className="label-eyebrow">{match.en}</span>
              <span className="h-px w-14 bg-gradient-to-r from-line-strong to-transparent" />
              <span className="chip text-ink-faint">TIER · 协同控制</span>
            </div>
            <h1 className="mt-2 font-display text-[36px] font-700 leading-none tracking-tight text-ink">
              {match.zh}
              <span className="ml-3 font-mono text-[13px] font-400 tracking-normal text-ink-faint">
                ┄ {match.en}
              </span>
            </h1>
            <p className="mt-2.5 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">
              {match.sub}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="panel-flat flex items-center gap-5 rounded-md px-4 py-2.5">
              <Meter label="在线编队" value="6 / 6" />
              <span className="h-8 w-px bg-line-soft" />
              <Meter label="健康均值" value="97.4%" tone="ok" />
              <span className="h-8 w-px bg-line-soft" />
              <Meter label="告警" value="0" />
            </div>
            <div className="scan-sheen grid h-12 w-12 place-items-center rounded-[12px] border border-primary/20 bg-gradient-to-b from-primary to-primary-2 font-display text-[13px] font-700 text-surface shadow-2">
              东南
            </div>
          </div>
        </header>

        <div key={pathname} className="relative min-h-0 flex-1 overflow-hidden page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function Meter({ label, value, tone }: { label: string; value: string; tone?: 'ok' }) {
  return (
    <div className="min-w-[68px] text-right">
      <div className="chip text-ink-faint">{label}</div>
      <div
        className={
          'mt-0.5 font-mono text-[16px] font-600 tabular-nums ' +
          (tone === 'ok' ? 'text-ok' : 'text-ink')
        }
      >
        {value}
      </div>
    </div>
  )
}

/** 供侧栏复用的实时时钟 */
export function useLocalClock() {
  const [now, setNow] = useState(() => formatClock(new Date()))
  useEffect(() => {
    const tick = () => setNow(formatClock(new Date()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

function formatClock(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
