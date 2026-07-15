import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { roleLabel, type FLEET } from '@/config/fleet'
import type { USVConfig } from '@/types/usv'

type FleetUnitCfg = (typeof FLEET)[number]

/** 创建跟随艇位的 CSS2D 标签 */
export function createBoatLabel(cfg: FleetUnitCfg | USVConfig): CSS2DObject {
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
  obj.position.set(0, 2.4, 0)
  obj.visible = true
  return obj
}

export type ViewPresetId = 'oblique' | 'top' | 'north' | 'east'

export const VIEW_PRESETS: {
  id: ViewPresetId
  label: string
  en: string
}[] = [
  { id: 'oblique', label: '斜视', en: 'Oblique' },
  { id: 'top', label: '俯视', en: 'Top' },
  { id: 'north', label: '北望', en: 'North' },
  { id: 'east', label: '东望', en: 'East' },
]

/** 相对作业中心的相机位姿（场景坐标） */
export function viewCameraPose(
  id: ViewPresetId,
  center: { x: number; y: number; z: number },
): { position: THREE.Vector3; target: THREE.Vector3 } {
  const t = new THREE.Vector3(center.x, center.y, center.z)
  switch (id) {
    case 'top':
      return {
        position: new THREE.Vector3(center.x, center.y + 110, center.z + 0.05),
        target: t,
      }
    case 'north':
      // 从北侧看向中心（场景 +Z 为北）
      return {
        position: new THREE.Vector3(center.x, center.y + 36, center.z + 78),
        target: t,
      }
    case 'east':
      // 从东侧看向中心（场景 +X 为东）
      return {
        position: new THREE.Vector3(center.x + 78, center.y + 36, center.z),
        target: t,
      }
    case 'oblique':
    default:
      return {
        position: new THREE.Vector3(center.x, center.y + 42, center.z + 58),
        target: t,
      }
  }
}
