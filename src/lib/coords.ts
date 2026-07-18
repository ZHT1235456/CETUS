/**
 * 对方坐标系 ↔ 本场景 Three.js（Y-up）轴映射。
 *
 * 对方水平轴约定：**X = 北，Y = 东，Z = 天**
 *
 * | 场景轴 | 对方轴 | 语义 |
 * |--------|--------|------|
 * | X      | Y      | 东   |
 * | Y      | Z      | 天   |
 * | Z      | X      | 北   |
 *
 * 业务 / WS 状态始终使用对方字段名，仅在渲染边界调用 toScene*。
 */

/** 对方位置（X 北 / Y 东 / Z 天） */
export type TheirPos = { x: number; y: number; z: number }

/** 对方水平面作业区（对接原始值） */
export const THEIR_BOUNDS = {
  xMin: 330,
  xMax: 430,
  yMin: -500,
  yMax: -440,
} as const

/** 对方作业区中心（北 / 东 / 天） */
export const THEIR_CENTER: TheirPos = {
  x: (THEIR_BOUNDS.xMin + THEIR_BOUNDS.xMax) / 2, // 380 北
  y: (THEIR_BOUNDS.yMin + THEIR_BOUNDS.yMax) / 2, // -470 东
  z: 0,
}

/** 映射后的场景作业中心（水面） */
export const SCENE_CENTER = {
  x: THEIR_CENTER.y, // -470（东）
  y: 0,
  z: THEIR_CENTER.x, // 380（北）
} as const

/**
 * 世界（对方业务坐标）→ 场景单位的缩放系数。
 *
 * 业务坐标幅值在数百量级（作业区 330..430 / -500..-440），
 * 而艇体、尾迹与镜头距离均按个位数场景单位设计；
 * 渲染边界在 toScenePosition 之后对水平分量统一乘以该系数，
 * 把整个作业区压缩进镜头可视范围。竖直分量（天）不缩放。
 */
export const WORLD_TO_SCENE = 0.25

/**
 * 对方坐标 → 本场景位置。
 * scene.x = their.y（东），scene.y = their.z（天），scene.z = their.x（北）
 * @param draft 吃水/竖直偏移，加在场景 Y（天）上
 */
export function toScenePosition(
  their: TheirPos,
  draft = 0,
): { x: number; y: number; z: number } {
  return {
    x: their.y,
    y: their.z + draft,
    z: their.x,
  }
}

/**
 * 对方水平朝向（fx 北 / fy 东）→ 场景水平朝向（场景 X/Z）。
 * scene.forward.x ← their.fy（东）
 * scene.forward.z ← their.fx（北）
 */
export function toSceneForward(
  fx: number,
  fy: number,
): { fx: number; fz: number } {
  return { fx: fy, fz: fx }
}

/** 场景 → 对方（调试 / 回写） */
export function fromScenePosition(scene: {
  x: number
  y: number
  z: number
}): TheirPos {
  return {
    x: scene.z,
    y: scene.x,
    z: scene.y,
  }
}
