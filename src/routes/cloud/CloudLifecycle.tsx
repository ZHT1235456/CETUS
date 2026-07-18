import { FLEET } from '@/config/fleet'
import { useFleetStore } from '@/store/usvStore'
import { Badge } from '@/components/ui'

const LOG_EVENTS = [
  { t: 'T-72h', kind: '任务', text: '任务会话 TASK-2026-0714 归档完成' },
  { t: 'T-48h', kind: '故障', text: 'USV-5 通信短暂中断记录入库' },
  { t: 'T-24h', kind: '寿命', text: '推进相关寿命计数更新（演示）' },
  { t: 'T-6h', kind: '健康', text: '全舰队健康档案日检通过' },
  { t: 'T-1h', kind: '日志', text: '边侧上报批次 EDGE-1 / EDGE-2 合并入湖' },
] as const

export default function CloudLifecycle() {
  const frame = useFleetStore((s) => s.frame)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto px-6 py-4">
      <header>
        <div className="label-eyebrow">Lifecycle Data</div>
        <h2 className="mt-1 font-display text-[20px] font-600 text-ink">全生命周期数据管理</h2>
        <p className="mt-1 max-w-3xl text-[13px] text-ink-soft">
          保存健康、故障与寿命、任务日志与设备档案，并与艇标识、任务会话、时间范围关联。服务回溯，不参与在线决策。
        </p>
      </header>

      <div className="stagger grid gap-4 lg:grid-cols-3">
        <ArchiveCard title="健康状态管理" count={`${FLEET.length} 艇档案`} />
        <ArchiveCard title="故障与寿命管理" count="事件库 · 演示" />
        <ArchiveCard title="日志与档案管理" count={`${LOG_EVENTS.length} 近期条目`} />
      </div>

      <section className="panel rounded-lg p-4">
        <h3 className="mb-3 font-display text-[15px] font-600">艇档案索引</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line-soft text-ink-faint">
                <th className="pb-2 font-500">艇标识</th>
                <th className="pb-2 font-500">当前健康</th>
                <th className="pb-2 font-500">故障标记</th>
                <th className="pb-2 font-500">寿命档（演示）</th>
                <th className="pb-2 font-500">最近任务会话</th>
              </tr>
            </thead>
            <tbody>
              {FLEET.map((u, i) => {
                const unit = frame[u.id]
                return (
                  <tr key={u.id} className="border-b border-line-soft/60 transition-colors hover:bg-frost/50">
                    <td className="py-2.5 font-display font-600">{u.id}</td>
                    <td className="py-2.5 font-mono tabular-nums">{unit.health.toFixed(1)}%</td>
                    <td className="py-2.5">
                      <Badge tone={unit.isFault ? 'alert' : 'ok'}>
                        {unit.isFault ? 'FAULT' : '正常'}
                      </Badge>
                    </td>
                    <td className="py-2.5 font-mono tabular-nums text-ink-soft">L{3 - (i % 3)}</td>
                    <td className="py-2.5 font-mono text-ink-faint">TASK-2026-0714</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel rounded-lg p-4">
        <h3 className="mb-3 font-display text-[15px] font-600">事件时间轴</h3>
        <ol className="relative ml-1 space-y-3.5 border-l border-line-strong/40 pl-5">
          {LOG_EVENTS.map((e) => (
            <li key={e.t + e.text} className="relative flex gap-4">
              <span className="absolute -left-[25.5px] top-1.5 h-2 w-2 rounded-full bg-water ring-2 ring-water/25" />
              <span className="w-14 shrink-0 font-mono text-[12px] tabular-nums text-ink-faint">{e.t}</span>
              <Badge tone="ghost">{e.kind}</Badge>
              <span className="text-[13px] text-ink-soft">{e.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function ArchiveCard({ title, count }: { title: string; count: string }) {
  return (
    <div className="panel card-hover rounded-lg p-4">
      <div className="label-eyebrow">Archive</div>
      <h3 className="mt-1 font-display text-[15px] font-600 text-ink">{title}</h3>
      <div className="hairline mt-2.5 opacity-70" />
      <p className="mt-2 font-mono text-[12.5px] tabular-nums text-ink-faint">{count}</p>
    </div>
  )
}
