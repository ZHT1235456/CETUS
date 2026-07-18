import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Dot } from '@/components/ui'
import { useFleetRuntime } from '@/hooks/useFleetRuntime'

const TITLES: { prefix: string; zh: string; en: string; sub: string }[] = [
  {
    prefix: '/architecture',
    zh: '系统架构',
    en: 'System Architecture',
    sub: '云侧 · 边侧 · 端侧分层职责',
  },
  {
    prefix: '/cloud',
    zh: '云',
    en: 'Cloud Tier',
    sub: '集群决策 · 数据收集 · 状态检测与历史回溯 · 全生命周期数据管理',
  },
  {
    prefix: '/edge',
    zh: '边',
    en: 'Edge Tier',
    sub: '任务管理 · 多艇状态汇聚 · 局部规划与在线重构 · 边缘自治与应急处理',
  },
  {
    prefix: '/terminal',
    zh: '端',
    en: 'Terminal Tier',
    sub: '端侧五域 · 感知 / 运动控制 / 机舱 / 通信 · 预测与健康状态管理',
  },
]

function resolveTitle(pathname: string) {
  return (
    TITLES.find((t) => pathname === t.prefix || pathname.startsWith(`${t.prefix}/`)) ??
    TITLES[0]
  )
}

export function Layout() {
  useFleetRuntime()
  const { pathname } = useLocation()
  const match = resolveTitle(pathname)

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
            <div className="panel-flat flex items-center gap-5 rounded-md px-4 py-2.5 shadow-1">
              <Meter label="在线编队" value="6 / 6" dot="ok" pulse />
              <span className="h-8 w-px bg-gradient-to-b from-transparent via-line-strong/60 to-transparent" />
              <Meter label="健康均值" value="97.4%" tone="ok" dot="ok" />
              <span className="h-8 w-px bg-gradient-to-b from-transparent via-line-strong/60 to-transparent" />
              <Meter label="告警" value="0" dot="ok" />
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

function Meter({
  label,
  value,
  tone,
  dot,
  pulse,
}: {
  label: string
  value: string
  tone?: 'ok'
  dot?: 'ok' | 'warn' | 'alert'
  pulse?: boolean
}) {
  return (
    <div className="min-w-[68px] text-right">
      <div className="chip flex items-center justify-end gap-1.5 text-ink-faint">
        {dot && <Dot tone={dot} pulse={pulse} />}
        {label}
      </div>
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
