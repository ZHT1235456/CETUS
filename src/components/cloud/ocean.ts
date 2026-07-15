import * as THREE from 'three'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'

/** 太阳位置（统一传给 Sky / DirectionalLight / Water.sunDirection） */
export const SUN_SPHERICAL = { elevationDeg: 18, azimuthDeg: 210 }
export const SUN_COLOR = 0xfff1dc

export function sunPosition(): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - SUN_SPHERICAL.elevationDeg)
  const theta = THREE.MathUtils.degToRad(SUN_SPHERICAL.azimuthDeg)
  return new THREE.Vector3().setFromSphericalCoords(1, phi, theta)
}

/** 程序化生成水面法线贴图（脱离外部网络依赖） */
function makeWaterNormals(): THREE.CanvasTexture {
  const s = 256
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(s, s)
  const h = (x: number, y: number) =>
    Math.sin(x * 0.10) * 0.5 +
    Math.sin(x * 0.23 + 1.7) * 0.28 +
    Math.sin(y * 0.13 + 0.9) * 0.45 +
    Math.sin((x + y) * 0.07 + 2.3) * 0.3 +
    Math.sin((x - y) * 0.17 + 0.4) * 0.2
  const eps = 1.2
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const dx = (h(x + eps, y) - h(x - eps, y)) / (2 * eps)
      const dy = (h(x, y + eps) - h(x, y - eps)) / (2 * eps)
      const nx = -dx
      const nz = -dy
      const ny = 1
      const len = Math.hypot(nx, ny, nz)
      const i = (y * s + x) * 4
      img.data[i + 0] = ((nx / len) * 0.5 + 0.5) * 255
      img.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255
      img.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(4, 4)
  tex.needsUpdate = true
  return tex
}

export function buildWater(scene: THREE.Scene, sunDir: THREE.Vector3): Water {
  const geo = new THREE.PlaneGeometry(240, 240, 1, 1)
  const normals = makeWaterNormals()
  const water = new Water(geo, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: normals,
    sunDirection: sunDir.clone().normalize(),
    sunColor: SUN_COLOR,
    waterColor: 0x3d6d9b,
    distortionScale: 3.7,
    side: THREE.DoubleSide,
    fog: true,
  })
  water.rotation.x = -Math.PI / 2
  water.name = 'water'
  scene.add(water)
  return water
}

export function buildSky(scene: THREE.Scene, sunDir: THREE.Vector3): Sky {
  const sky = new Sky()
  sky.scale.setScalar(12000)
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
  const ambient = new THREE.AmbientLight(0x445566, 0.45)
  const hemi = new THREE.HemisphereLight(0xbfe0ff, 0x224433, 0.7)
  const sun = new THREE.DirectionalLight(SUN_COLOR, 1.5)
  sun.position.copy(sunDir).multiplyScalar(200)
  sun.castShadow = false
  scene.add(ambient, hemi, sun)
  return { ambient, hemi, sun }
}

export function buildFog(scene: THREE.Scene) {
  scene.fog = new THREE.FogExp2(0x9fc0e0, 0.0042)
}

export function applyRenderer(renderer: THREE.WebGLRenderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.72
  renderer.outputColorSpace = THREE.SRGBColorSpace
}