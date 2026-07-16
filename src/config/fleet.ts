import type { USVConfig, USVId } from '@/types/usv'

/**
 * 6 艘艇呈正六边形编队，逆时针顺序：
 *   USV-1(虚艇) → USV-5(实/跟随) → USV-2(实/领航)
 *   → USV-3(实/领航) → USV-6(虚艇) → USV-4(实/跟随)
 *
 * 编队 A = {USV-1, USV-2, USV-5}，领航艇 USV-2
 * 编队 B = {USV-3, USV-4, USV-6}，领航艇 USV-3
 * 拓扑对齐 assets/diagram.jpg
 */
export const FLEET: readonly USVConfig[] = [
  { id: 'USV-1', model: 'untextured', angleDeg:   0, role: 'virtual',  formation: 'A' },
  { id: 'USV-5', model: 'textured',   angleDeg:  60, role: 'follower', formation: 'A' },
  { id: 'USV-2', model: 'textured',   angleDeg: 120, role: 'leader',   formation: 'A' },
  { id: 'USV-3', model: 'textured',   angleDeg: 180, role: 'leader',   formation: 'B' },
  { id: 'USV-6', model: 'untextured', angleDeg: 240, role: 'virtual',  formation: 'B' },
  { id: 'USV-4', model: 'textured',   angleDeg: 300, role: 'follower', formation: 'B' },
] as const

export const FLEET_BY_ID = FLEET.reduce(
  (acc, u) => ((acc[u.id] = u), acc),
  {} as Record<USVId, USVConfig>,
)

/** GLB 资源路径（构建后位于 public/assets/） */
export const MODEL_URL = {
  textured: '/assets/USV_textured.glb',
  untextured: '/assets/USV_untextured.glb',
} as const

export type EdgeLinkDir = 'uni' | 'bi'

export type EdgeLink = {
  from: USVId
  to: USVId
  /** uni = 单向；bi = 双向（对齐 diagram.jpg） */
  dir: EdgeLinkDir
}

/**
 * 边编队拓扑（对齐 assets/diagram.jpg）
 * A：领航 USV-2；B：领航 USV-3；USV-1 / USV-6 为虚艇
 */
export const EDGE_FORMATIONS = {
  A: {
    leader: 'USV-2' as USVId,
    members: ['USV-2', 'USV-1', 'USV-5'] as USVId[],
    edges: [
      { from: 'USV-2', to: 'USV-5', dir: 'uni' },
      { from: 'USV-2', to: 'USV-1', dir: 'bi' },
      { from: 'USV-5', to: 'USV-1', dir: 'bi' },
    ] as EdgeLink[],
  },
  B: {
    leader: 'USV-3' as USVId,
    members: ['USV-3', 'USV-4', 'USV-6'] as USVId[],
    edges: [
      { from: 'USV-3', to: 'USV-4', dir: 'uni' },
      { from: 'USV-3', to: 'USV-6', dir: 'bi' },
      { from: 'USV-4', to: 'USV-6', dir: 'bi' },
    ] as EdgeLink[],
  },
} as const

/** 角色中文标签 */
export function roleLabel(role: USVConfig['role']): string {
  if (role === 'leader') return '领航艇'
  if (role === 'virtual') return '虚艇'
  return '跟随艇'
}
