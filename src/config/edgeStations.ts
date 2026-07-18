import { EDGE_FORMATIONS } from './fleet'
import type { USVId } from '@/types/usv'

/** 界面与路由使用边 1 / 边 2；内部映射到既有编队配置 A/B */
export type EdgeStationId = '1' | '2'

export const EDGE_STATIONS = {
  '1': {
    id: '1' as const,
    label: '边 1',
    formationKey: 'A' as const,
    formation: EDGE_FORMATIONS.A,
  },
  '2': {
    id: '2' as const,
    label: '边 2',
    formationKey: 'B' as const,
    formation: EDGE_FORMATIONS.B,
  },
} as const

export function isEdgeStationId(v: string | undefined): v is EdgeStationId {
  return v === '1' || v === '2'
}

export function edgeStationMembers(id: EdgeStationId): readonly USVId[] {
  return EDGE_STATIONS[id].formation.members
}
