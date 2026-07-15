import { SwarmTree } from '@/components/architecture/SwarmTree'
import { DomainPanel } from '@/components/architecture/DomainPanel'
import { useMockFleet } from '@/hooks/useMockFleet'

export default function Architecture() {
  useMockFleet(true)
  return (
    <div className="flex h-full w-full">
      {/* 左：云·边·端 树 */}
      <section className="relative flex h-full w-1/2 min-w-[520px] flex-col">
        <header className="flex items-center justify-between px-7 pt-6 pb-3">
          <div>
            <div className="label-eyebrow">Topology · Tree</div>
            <h3 className="mt-0.5 font-display text-[19px] font-600 text-ink">
              云·边·端 三级拓扑
            </h3>
            <p className="mt-0.5 text-[12.5px] text-ink-soft">
              点击「云 / 边 / 端」节点可跳转至对应界面 · 双向箭头表示数据上下行流
            </p>
          </div>
        </header>
        <div className="hairline mx-7" />
        <div className="relative min-h-0 flex-1 px-4 pb-4">
          <div className="panel relative h-full w-full overflow-hidden rounded-md ring-1 ring-line-soft">
            <SwarmTree />
          </div>
        </div>
      </section>

      {/* 分隔 */}
      <div className="w-px shrink-0 self-stretch bg-gradient-to-b from-transparent via-line-strong to-transparent opacity-70" />

      {/* 右：域控制器架构 */}
      <section className="flex h-full w-1/2 min-w-[460px] flex-col">
        <DomainPanel />
      </section>
    </div>
  )
}