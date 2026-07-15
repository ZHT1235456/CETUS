export type USVId = 'USV-1' | 'USV-2' | 'USV-3' | 'USV-4' | 'USV-5' | 'USV-6'

export type ModelKind = 'textured' | 'untextured'

export interface USVConfig {
  id: USVId
  model: ModelKind
  /** 逆时针序的编队槽位角度（度，0° = +x） */
  angleDeg: number
  /** 真实艇 / 虚拟领导者 */
  role: 'real' | 'virtual-leader'
  /** 所属边编队 */
  formation: 'A' | 'B'
}

/** 单艇实时姿态 — 来自另一台电脑经 WebSocket 传输（Tauri 转发） */
export interface USVState {
  id: USVId
  x: number
  z: number
  /** 朝向（弧度，0=朝 +x；计数基准为船首方向） */
  heading: number
  /** 航速（单位/秒） */
  speed: number
}

/** 故障与健康管理信息 — 来自另一台电脑传输（待扩展） */
export interface FaultInfo {
  isFault: boolean
  /** 健康度百分比 0–100 */
  health: number
  /** 故障代码（无故障则空） */
  code?: string
}

export interface FleetUnit extends USVState, FaultInfo {
  id: USVId
}

/** 一帧完整的舰队数据，对应 WS 一次消息 */
export type FleetFrame = Record<USVId, FleetUnit>

/** WS 消息外壳 — 为后续 Tauri + WebSocket 接入预留 */
export interface FleetMessage {
  type: 'fleet'
  timestamp: number
  frame: FleetFrame
}