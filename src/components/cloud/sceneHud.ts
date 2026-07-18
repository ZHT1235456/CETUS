import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { roleLabel } from '@/config/fleet'
import type { USVConfig, USVId } from '@/types/usv'
import { BOAT_VISUAL_SCALE } from './sceneScale'

/** 创建跟随艇位的 CSS2D 标签 */
export function createBoatLabel(cfg: USVConfig): CSS2DObject {
  const el = document.createElement('div')
  el.className = 'boat-label'
  const virt = cfg.role === 'virtual'
  const leader = cfg.role === 'leader'
  el.dataset.role = cfg.role
  el.innerHTML = `
    <span class="boat-label__id">${cfg.id.replace('USV-', '')}</span>
    <span class="boat-label__meta">${roleLabel(cfg.role)}</span>
  `
  if (virt) el.classList.add('boat-label--virtual')
  else if (leader) el.classList.add('boat-label--leader')

  const obj = new CSS2DObject(el)
  obj.position.set(0, 2.4 * BOAT_VISUAL_SCALE, 0)
  obj.visible = false
  return obj
}

/** 全局视角（非跟踪） */
export type ViewMode = 'overview' | 'top'

/** 编队总览 / 俯视 相对作业中心的相机位姿（配合 WORLD_TO_SCENE 缩放的全编队取景） */
export function fleetCameraPose(
  mode: ViewMode,
  center: { x: number; y: number; z: number },
): { position: THREE.Vector3; target: THREE.Vector3 } {
  const t = new THREE.Vector3(center.x, center.y, center.z)
  if (mode === 'top') {
    return {
      position: new THREE.Vector3(
        center.x,
        center.y + 110 * BOAT_VISUAL_SCALE,
        center.z + 0.05 * BOAT_VISUAL_SCALE,
      ),
      target: t,
    }
  }
  return {
    position: new THREE.Vector3(
      center.x,
      center.y + 42 * BOAT_VISUAL_SCALE,
      center.z + 58 * BOAT_VISUAL_SCALE,
    ),
    target: t,
  }
}

/** 跟踪某艇：相机位于船尾后上方，朝向艇体 */
export function trackCameraPose(
  boatPos: THREE.Vector3,
  sceneFx: number,
  sceneFz: number,
): { position: THREE.Vector3; target: THREE.Vector3 } {
  const fwd = new THREE.Vector3(sceneFx, 0, sceneFz)
  if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, 1)
  else fwd.normalize()

  const up = new THREE.Vector3(0, 1, 0)
  const back = fwd.clone().multiplyScalar(-1)
  const position = boatPos
    .clone()
    .add(back.multiplyScalar(16 * BOAT_VISUAL_SCALE))
    .add(up.clone().multiplyScalar(9 * BOAT_VISUAL_SCALE))
  const target = boatPos
    .clone()
    .add(new THREE.Vector3(0, 2.2 * BOAT_VISUAL_SCALE, 0))

  return { position, target }
}

export const TRACK_IDS: USVId[] = [
  'USV-1',
  'USV-2',
  'USV-3',
  'USV-4',
  'USV-5',
  'USV-6',
]
