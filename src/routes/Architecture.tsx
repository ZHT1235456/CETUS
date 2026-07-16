import { SwarmTree } from '@/components/architecture/SwarmTree'
import { DomainPanel } from '@/components/architecture/DomainPanel'

export default function Architecture() {
  return (
    <div className="flex h-full w-full">
      <section className="relative flex h-full w-3/4 min-w-0 flex-col">
        <header className="flex items-center justify-between px-7 pt-6 pb-3">
          <div>
            <div className="label-eyebrow">Topology · Tree</div>
            <h3 className="mt-1 font-display text-[22px] font-600 text-ink">
              云·边·端 三级拓扑
            </h3>
          </div>
        </header>
        <div className="hairline mx-7" />
        <div className="relative min-h-0 flex-1 px-4 pb-4 pt-3">
          <div className="panel relative h-full w-full overflow-hidden rounded-lg ring-1 ring-line-soft/80">
            <SwarmTree />
          </div>
        </div>
      </section>

      <div className="w-px shrink-0 self-stretch bg-gradient-to-b from-transparent via-line-strong to-transparent opacity-80" />

      <section className="flex h-full w-1/4 min-w-0 flex-col">
        <DomainPanel />
      </section>
    </div>
  )
}
