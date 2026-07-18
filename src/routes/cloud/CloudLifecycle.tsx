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

/** 牛皮纸 / 卷宗色调（与浅蓝主题协调的暖色点缀） */
const KRAFT = {
  cardBg: 'linear-gradient(180deg,#faf5e8 0%,#f3ebd6 100%)',
  cardBorder: '#ddcda6',
  tabBg: '#f3ebd6',
  stamp: 'rgba(156,107,48,0.78)',
  stampBorder: 'rgba(156,107,48,0.5)',
  ledgerHead: '#d8c8a4',
  ledgerRow: 'rgba(228,217,189,0.75)',
} as const

export default function CloudLifecycle() {
  const frame = useFleetStore((s) => s.frame)

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto px-6 py-4">
      <header>
        <div className="label-eyebrow">Lifecycle Data · 档案室</div>
        <h2 className="mt-1 font-display text-[20px] font-600 text-ink">全生命周期数据管理</h2>
        <p className="mt-1 max-w-3xl text-[13px] text-ink-soft">
          保存健康、故障与寿命、任务日志与设备档案，并与艇标识、任务会话、时间范围关联。服务回溯，不参与在线决策。
        </p>
      </header>

      {/* 档案盒一排 */}
      <div className="stagger grid gap-4 pt-2 lg:grid-cols-3">
        <ArchiveCard
          code="CETUS-ARC-2026-001"
          title="健康状态管理"
          count={`${FLEET.length} 艇档案`}
        />
        <ArchiveCard
          code="CETUS-ARC-2026-002"
          title="故障与寿命管理"
          count="事件库 · 演示"
        />
        <ArchiveCard
          code="CETUS-ARC-2026-003"
          title="日志与档案管理"
          count={`${LOG_EVENTS.length} 近期条目`}
        />
      </div>

      {/* 卷宗 A：艇档案索引（台账） */}
      <section className="panel relative mt-2 rounded-lg p-4" style={{ overflow: 'visible' }}>
        <FolderTab label="卷宗 A-01 · 艇档案索引" />
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-display text-[15px] font-600">艇档案索引</h3>
          <span className="font-mono text-[11px] tracking-wider text-ink-faint">LEDGER · 台账</span>
        </div>
        <div className="max-h-[320px] overflow-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="text-ink-faint" style={{ borderBottom: `2px solid ${KRAFT.ledgerHead}` }}>
                <th className="pb-2 pl-2 font-500">艇标识</th>
                <th className="border-l border-line-soft/50 pb-2 pl-3 font-500">当前健康</th>
                <th className="border-l border-line-soft/50 pb-2 pl-3 font-500">故障标记</th>
                <th className="border-l border-line-soft/50 pb-2 pl-3 font-500">寿命档（演示）</th>
                <th className="border-l border-line-soft/50 pb-2 pl-3 font-500">最近任务会话</th>
              </tr>
            </thead>
            <tbody>
              {FLEET.map((u, i) => {
                const unit = frame[u.id]
                return (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-[#f7f1e0]/70"
                    style={{ borderBottom: `1px solid ${KRAFT.ledgerRow}` }}
                  >
                    <td className="py-2.5 pl-2 font-display font-600">{u.id}</td>
                    <td className="border-l border-line-soft/40 py-2.5 pl-3 font-mono tabular-nums">
                      {unit.health.toFixed(1)}%
                    </td>
                    <td className="border-l border-line-soft/40 py-2.5 pl-3">
                      <Badge tone={unit.isFault ? 'alert' : 'ok'}>
                        {unit.isFault ? 'FAULT' : '正常'}
                      </Badge>
                    </td>
                    <td className="border-l border-line-soft/40 py-2.5 pl-3 font-mono tabular-nums text-ink-soft">
                      L{3 - (i % 3)}
                    </td>
                    <td className="border-l border-line-soft/40 py-2.5 pl-3 font-mono text-ink-faint">
                      TASK-2026-0714
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 卷宗 B：事件时间轴 */}
      <section className="panel relative mt-2 rounded-lg p-4" style={{ overflow: 'visible' }}>
        <FolderTab label="卷宗 B-02 · 事件簿" />
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-display text-[15px] font-600">事件时间轴</h3>
          <span className="font-mono text-[11px] tracking-wider text-ink-faint">LOG BOOK</span>
        </div>
        {/* 左侧留出 8px 内边距，滚动时时间轴圆点不被裁切 */}
        <div className="max-h-[320px] overflow-y-auto pl-2">
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
        </div>
      </section>
    </div>
  )
}

/** 档案盒 / 卷宗卡片：文件夹 tab + 编号 + 归档章 */
function ArchiveCard({ code, title, count }: { code: string; title: string; count: string }) {
  return (
    <div
      className="card-hover relative rounded-lg px-4 pt-4 pb-3.5 shadow-1"
      style={{ background: KRAFT.cardBg, border: `1px solid ${KRAFT.cardBorder}` }}
    >
      {/* 文件夹索引 tab */}
      <span
        className="absolute -top-2.5 left-4 rounded-t-md px-2.5 py-0.5 font-mono text-[9.5px] font-600 tracking-[0.14em] text-ink-soft"
        style={{
          background: KRAFT.tabBg,
          border: `1px solid ${KRAFT.cardBorder}`,
          borderBottom: 'none',
        }}
      >
        {code}
      </span>
      <ArchiveStamp />
      <div className="label-eyebrow mt-1">Archive Box</div>
      <h3 className="mt-1 font-display text-[15px] font-600 text-ink">{title}</h3>
      <div
        className="mt-2.5 opacity-80"
        style={{ borderTop: `1px dashed ${KRAFT.cardBorder}` }}
      />
      <p className="mt-2 font-mono text-[12.5px] tabular-nums text-ink-faint">{count}</p>
    </div>
  )
}

/** 「已归档 / ARCHIVE」印章式徽标 */
function ArchiveStamp() {
  return (
    <span
      className="pointer-events-none absolute right-3 top-3 select-none rounded-[3px] px-1.5 py-0.5 font-mono text-[10px] font-700 uppercase tracking-[0.18em]"
      style={{
        transform: 'rotate(-8deg)',
        color: KRAFT.stamp,
        border: `2px solid ${KRAFT.stampBorder}`,
        boxShadow: 'inset 0 0 0 1px rgba(156,107,48,0.22)',
        opacity: 0.85,
      }}
    >
      已归档 · Archive
    </span>
  )
}

/** 卷宗索引标签（文件夹 tab 视觉） */
function FolderTab({ label }: { label: string }) {
  return (
    <span
      className="absolute -top-3.5 left-5 rounded-t-md px-3.5 py-1 font-mono text-[11px] font-600 leading-[1.5] tracking-[0.12em] text-ink-soft"
      style={{
        background: KRAFT.tabBg,
        border: `1px solid ${KRAFT.cardBorder}`,
        borderBottom: 'none',
      }}
    >
      {label}
    </span>
  )
}
