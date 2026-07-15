import type { USVConfig, USVId } from '@/types/usv'

/**
 * 6 艘艇呈正六边形编队，逆时针顺序排列：
 *   1(USV-1 textured) →5(USV-5 untextured) →2(USV-2 textured)
 *   →3(USV-3 textured) →6(USV-6 untextured) →4(USV-4 textured)
 * 两个 untextured 即虚拟领导者。
 * 编队 A = {USV-1, USV-2, USV-5}，编队 B = {USV-3, USV-4, USV-6}，
 * 与"边"页两个 leader-follower 三角形对应。
 */
export const FLEET: readonly USVConfig[] = [
  { id: 'USV-1', model: 'textured',   angleDeg:   0, role: 'real',            formation: 'A' },
  { id: 'USV-5', model: 'untextured', angleDeg:  60, role: 'virtual-leader',  formation: 'A' },
  { id: 'USV-2', model: 'textured',   angleDeg: 120, role: 'real',            formation: 'A' },
  { id: 'USV-3', model: 'textured',   angleDeg: 180, role: 'real',            formation: 'B' },
  { id: 'USV-6', model: 'untextured', angleDeg: 240, role: 'virtual-leader',  formation: 'B' },
  { id: 'USV-4', model: 'textured',   angleDeg: 300, role: 'real',            formation: 'B' },
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

/** 边编队 leader-follower 拓扑：[指向, 被指向] */
export const EDGE_FORMATIONS = {
  A: {
    leader: 'USV-5' as USVId,
    members: ['USV-5', 'USV-1', 'USV-2'] as USVId[],
    edges: [
      ['USV-5', 'USV-1'],
      ['USV-5', 'USV-2'],
      ['USV-1', 'USV-2'],
    ] as [USVId, USVId][],
  },
  B: {
    leader: 'USV-6' as USVId,
    members: ['USV-6', 'USV-3', 'USV-4'] as USVId[],
    edges: [
      ['USV-6', 'USV-3'],
      ['USV-6', 'USV-4'],
      ['USV-3', 'USV-4'],
    ] as [USVId, USVId][],
  },
} as const

/** 编队半径（世界单位） */
export const FORMATION_RADIUS = 16