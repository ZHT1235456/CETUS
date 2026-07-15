import * as THREE from 'three'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'

/** 太阳位置（统一传给 Sky / DirectionalLight / Water.sunDirection） */
export const SUN_SPHERICAL = { elevationDeg: 18, azimuthDeg: 210 }
export const SUN_COLOR = 0xffeedd
export const HORIZON_COLOR = 0x89b3d9

export function sunPosition(): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - SUN_SPHERICAL.elevationDeg)
  const theta = THREE.MathUtils.degToRad(SUN_SPHERICAL.azimuthDeg)
  return new THREE.Vector3().setFromSphericalCoords(1, phi, theta)
}

/** 程序化生成水面法线贴图（对齐 references/scene，作本地/外网加载失败时的回退） */
function createProceduralWaterNormals(): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  const data = img.data

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size
      const ny = y / size
      const hx =
        Math.cos(nx * Math.PI * 8) * 0.35 * Math.PI * 8 +
        Math.cos((nx + ny) * Math.PI * 10) * 0.2 * Math.PI * 10
      const hy =
        Math.cos(ny * Math.PI * 6 + 0.4) * 0.25 * Math.PI * 6 +
        Math.cos((nx + ny) * Math.PI * 10) * 0.2 * Math.PI * 10
      const n = new THREE.Vector3(-hx, -hy, 1).normalize()
      const i = (y * size + x) * 4
      data[i] = (n.x * 0.5 + 0.5) * 255
      data[i + 1] = (n.y * 0.5 + 0.5) * 255
      data[i + 2] = (n.z * 0.5 + 0.5) * 255
      data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 4)
  return texture
}

function loadWaterNormals(): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader()
    loader.load(
      '/textures/waternormals.jpg',
      (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(4, 4)
        resolve(texture)
      },
      undefined,
      () => resolve(createProceduralWaterNormals()),
    )
  })
}

/** 对齐 references/scene：开阔水面 Water */
export async function buildWater(scene: THREE.Scene, sunDir: THREE.Vector3): Promise<Water> {
  const waterNormals = await loadWaterNormals()
  const geometry = new THREE.PlaneGeometry(1200, 1200)
  const water = new Water(geometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals,
    sunDirection: sunDir.clone().normalize(),
    sunColor: 0xffffff,
    waterColor: 0x3d6d9b,
    distortionScale: 3.7,
    side: THREE.DoubleSide,
    fog: true,
  })
  water.rotation.x = -Math.PI / 2
  water.material.uniforms.size.value = 4.0
  water.name = 'water'
  scene.add(water)
  return water
}

export function buildSky(scene: THREE.Scene, sunDir: THREE.Vector3): Sky {
  const sky = new Sky()
  sky.scale.setScalar(10000)
  scene.add(sky)
  const u = sky.material.uniforms
  u.turbidity.value = 10
  u.rayleigh.value = 2
  u.mieCoefficient.value = 0.005
  u.mieDirectionalG.value = 0.8
  u.sunPosition.value.copy(sunDir)
  return sky
}

export function buildLights(scene: THREE.Scene, sunDir: THREE.Vector3) {
  const ambient = new THREE.AmbientLight(0x445566, 0.4)
  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x224433, 0.6)
  const sun = new THREE.DirectionalLight(SUN_COLOR, 1.5)
  sun.position.copy(sunDir).multiplyScalar(100)
  sun.castShadow = false
  scene.add(ambient, hemi, sun)
  return { ambient, hemi, sun }
}

export function buildFog(scene: THREE.Scene) {
  scene.fog = new THREE.FogExp2(HORIZON_COLOR, 0.0008)
  scene.background = new THREE.Color(HORIZON_COLOR)
}

export function applyRenderer(renderer: THREE.WebGLRenderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.72
  renderer.outputColorSpace = THREE.SRGBColorSpace
}
