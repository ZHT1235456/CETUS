import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MODEL_URL } from '@/config/fleet'
import type { ModelKind } from '@/types/usv'

const TARGET_LENGTH = 3.2

export interface BoatModel {
  kind: ModelKind
  prototype: THREE.Group
  length: number
  beam: number
  /** 漂浮于水面所需的竖直偏移：使 hull 底面贴近 y=0 */
  yOffset: number
  /** prototype 已标准化：几何中心位于原点，沿 +z 为船首方向 */
  scale: number
}

function bakePrototype(gltf: any): BoatModel {
  const grp = gltf.scene as THREE.Group
  // 计算世界包围盒
  const box = new THREE.Box3().setFromObject(grp)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  // 居中到原点
  grp.position.sub(center)
  // 缩放到目标船长（取 z 为主轴）
  const srcLen = Math.max(size.z, size.x, 0.001)
  const scale = TARGET_LENGTH / srcLen
  grp.scale.setScalar(scale)
  grp.updateMatrixWorld(true)
  const bbox = new THREE.Box3().setFromObject(grp)
  const nSize = bbox.getSize(new THREE.Vector3())
  // 允许接收光照/阴影
  grp.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      const m = o as THREE.Mesh
      m.castShadow = true
      m.receiveShadow = false
      m.frustumCulled = true
    }
  })
  return {
    kind: grp.userData.kind ?? 'textured',
    prototype: grp,
    length: nSize.z,
    beam: nSize.x,
    // 略下沉：底面越过 y=0，形成更自然的吃水
    yOffset: nSize.y / 2 - 0.55,
    scale,
  }
}

export async function loadBoatModels(): Promise<Record<ModelKind, BoatModel>> {
  const loader = new GLTFLoader()
  const [tex, untex] = await Promise.all([
    loader.loadAsync(MODEL_URL.textured),
    loader.loadAsync(MODEL_URL.untextured),
  ])
  const tb = bakePrototype(tex)
  tb.kind = 'textured'
  const ub = bakePrototype(untex)
  ub.kind = 'untextured'
  return { textured: tb, untextured: ub }
}

export function cloneBoat(m: BoatModel): THREE.Group {
  const g = m.prototype.clone(true) as THREE.Group
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      const mesh = o as THREE.Mesh
      mesh.material = (mesh.material as THREE.Material).clone?.() ?? mesh.material
    }
  })
  return g
}

/** 船首方向（场景水平分量）→ 船体绕 y 轴旋转角。
 *  模型默认船首朝 -x（需逆时针校正 90°），旋转角 θ 使船首→(fx,0,fz)。
 *  传入的应为 toSceneForward 之后的场景分量。 */
export function headingToYRot(fx: number, fz: number): number {
  return Math.atan2(fx, fz) + Math.PI / 2
}