import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { TreeNode, type TreeData } from './treeNodes'

const W = { cloud: 288, edge: 220, terminal: 190, usv: 180 }

const node = (id: string, data: TreeData, cx: number, cy: number): Node<TreeData, 'tree'> => {
  const w = W[data.kind]
  return {
    id,
    type: 'tree',
    position: { x: cx - w / 2, y: cy },
    data,
    draggable: false,
    selectable: false,
  }
}

const flowMarker = {
  type: MarkerType.ArrowClosed,
  width: 14,
  height: 14,
  color: '#2c5f8d',
}

const build = () => {
  const n: Node<TreeData, 'tree'>[] = []
  const e: Edge[] = []

  // Root — 云
  n.push(node('cloud', { kind: 'cloud', label: '云', en: 'Cloud', navTo: '/cloud' }, 0, 10))

  const tY = 410
  const leafY = 560
  // 三个端间距加大避免重合；边落在中间端（虚拟领导者）正上方
  const formA: { uid: 'USV-1' | 'USV-5' | 'USV-2'; xs: number }[] = [
    { uid: 'USV-1', xs: -560 },
    { uid: 'USV-5', xs: -360 },
    { uid: 'USV-2', xs: -160 },
  ]
  const formB: { uid: 'USV-3' | 'USV-6' | 'USV-4'; xs: number }[] = [
    { uid: 'USV-3', xs: +160 },
    { uid: 'USV-6', xs: +360 },
    { uid: 'USV-4', xs: +560 },
  ]
  const edgeY = 200
  const edgeAx = formA[1].xs
  const edgeBx = formB[1].xs
  n.push(
    node('edge-a', { kind: 'edge', label: '边', en: 'Edge', navTo: '/edge', formationKey: 'A' }, edgeAx, edgeY),
    node('edge-b', { kind: 'edge', label: '边', en: 'Edge', navTo: '/edge', formationKey: 'B' }, edgeBx, edgeY),
  )
  // 云 ↔ 边（双向）
  e.push(
    bidir('cloud', 'edge-a'),
    bidir('cloud', 'edge-b'),
  )
  const mkFormation = (edgeId: string, list: { uid: any; xs: number }[]) => {
    list.forEach(({ uid, xs }) => {
      const tid = `term-${uid}`
      n.push(
        node(tid, { kind: 'terminal', label: '端', en: 'Terminal', navTo: '/terminal', usvId: uid }, xs, tY),
      )
      n.push(
        node(`usv-${uid}`, { kind: 'usv', label: uid, usvId: uid }, xs, leafY),
      )
      e.push(bidir(edgeId, tid))
      e.push(hostEdge(tid, `usv-${uid}`))
    })
  }
  mkFormation('edge-a', formA)
  mkFormation('edge-b', formB)

  return { nodes: n, edges: e }
}

function bidir(source: string, target: string): Edge {
  return {
    id: `${source}__${target}`,
    source,
    target,
    type: 'smoothstep',
    animated: true,
    markerStart: { ...flowMarker, type: MarkerType.ArrowClosed, color: 'var(--color-water)' },
    markerEnd: { ...flowMarker, type: MarkerType.ArrowClosed, color: 'var(--color-water)' },
    style: { stroke: 'var(--color-water-soft)', strokeWidth: 1.5 },
  }
}

/** 端 → USV 模型叶（包含关系，单向虚线） */
function hostEdge(source: string, target: string): Edge {
  return {
    id: `${source}__${target}`,
    source,
    target,
    type: 'smoothstep',
    animated: false,
    style: { stroke: 'var(--color-line-strong)', strokeWidth: 1, strokeDasharray: '4 5' },
  }
}

const nodeTypes = { tree: TreeNode }

export function SwarmTree() {
  const { nodes, edges } = useMemo(build, [])
  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={true}
        zoomOnDoubleClick={false}
        panOnDrag={true}
        fitView
        fitViewOptions={{ padding: 0.18, includeHiddenNodes: true, minZoom: 0.55, maxZoom: 1.2 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.35}
        maxZoom={1.6}
      >
        <Background
          gap={28}
          size={1.2}
          color="rgba(127,168,204,0.22)"
          style={{ maskImage: 'radial-gradient(circle at 50% 40%, #000 0%, transparent 85%)' }}
        />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* legend */}
      <div className="pointer-events-none absolute left-5 top-4 panel-flat rounded-sm px-3.5 py-2.5">
        <div className="label-eyebrow mb-1.5 text-[12.5px]">图例 · Legend</div>
        <ul className="space-y-1.5 font-mono text-[14px] text-ink-soft">
          <li className="flex items-center gap-2"><Dot tone="water" /> 双向数据流</li>
          <li className="flex items-center gap-2"><Dot tone="ghost" /> 模型归属（单向）</li>
          <li className="flex items-center gap-2"><Dot tone="ok" pulse /> 实时在线</li>
        </ul>
      </div>
    </div>
  )
}

function Dot({ tone, pulse }: { tone: 'water' | 'ghost' | 'ok'; pulse?: boolean }) {
  const color =
    tone === 'water' ? 'bg-water' : tone === 'ok' ? 'bg-ok' : 'bg-ink-ghost'
  return (
    <span className="relative inline-flex h-2 w-2">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      {pulse && (
        <span
          className={`absolute inset-0 rounded-full ${color} opacity-60`}
          style={{ animation: 'pulse-soft 2s ease-in-out infinite' }}
        />
      )}
    </span>
  )
}