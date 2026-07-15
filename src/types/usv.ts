export type USVId = 'USV-1' | 'USV-2' | 'USV-3' | 'USV-4' | 'USV-5' | 'USV-6'

export type ModelKind = 'textured' | 'untextured'

export interface USVConfig {
  id: USVId
  model: ModelKind
  /** 逆时针序的编队槽位角度（度，0° = +x 北） */
  angleDeg: number
  /** 领航艇 / 跟随艇 / 虚艇（USV-5、USV-6） */
  role: 'leader' | 'follower' | 'virtual'
  /** 所属边编队 */
  formation: 'A' | 'B'
}

/** 单艇实时姿态 — 对方坐标系（经 WebSocket / Tauri 接入）
 *  x = 北，y = 东，z = 天。渲染时经 toScenePosition 映射到 Three.js。 */
export interface USVState {
  id: USVId
  /** 北 */
  x: number
  /** 东 */
  y: number
  /** 天（水面编队通常为 0） */
  z: number
  /** 朝向（弧度，0 = 朝 +x 北；船首方向） */
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

/** WS 消息外壳 — 帧内位姿为对方坐标（X 北 / Y 东 / Z 天）；渲染侧经 toScenePosition 映射 */
export interface FleetMessage {
  type: 'fleet'
  timestamp: number
  frame: FleetFrame
}