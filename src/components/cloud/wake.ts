import * as THREE from 'three'

/**
 * 单艇尾迹：V 形 ribbon + 环形泡沫粒子。
 * 严格按《尾迹制作笔记》实现，与水面协同（depthWrite=false / renderOrder / y 抬升）。
 */

export interface BoatKinematicState {
  /** 场景坐标（已 toScene） */
  x: number
  y: number
  z: number
  /** 船首方向单位向量（场景 xz） */
  fx: number
  fz: number
  length: number
  beam: number
}

const RIBBON_COLOR = 0xeaf6ff

function makeFoamTexture(): THREE.CanvasTexture {
  const s = 64
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0.0, 'rgba(255,255,255,0.95)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  g.addColorStop(1.0, 'rgba(255,255,255,0.0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  const img = ctx.getImageData(0, 0, s, s)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 70
    img.data[i + 3] = Math.max(0, Math.min(255, img.data[i + 3] + n))
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

export class Wake {
  private MAX_PTS: number
  private MAX_PART: number
  private lifeWindow: number
  private halfBeam: number
  private sampleEvery = 0.0
  private acc = 0

  private ptsL: { pos: THREE.Vector3; t: number }[] = []
  private ptsR: { pos: THREE.Vector3; t: number }[] = []

  private ribbonGeo: THREE.BufferGeometry
  private ribbonMesh: THREE.Mesh
  private ribbonPos: Float32Array
  private ribbonAlpha: Float32Array
  private ribbonUv: Float32Array

  // particles
  private partPos: Float32Array
  private partAlpha: Float32Array
  private partSize: Float32Array
  private partVel: Float32Array
  private partLife: Float32Array
  private partMaxLife: Float32Array
  private partCursor = 0
  private partPoints: THREE.Points
  private partGeo: THREE.BufferGeometry
  private foamTex: THREE.CanvasTexture

  private lastSternL = new THREE.Vector3()
  private lastSternR = new THREE.Vector3()

  constructor(
    scene: THREE.Scene,
    opts: { halfBeam: number; maxPts?: number; maxPart?: number; lifeWindow?: number },
  ) {
    this.halfBeam = opts.halfBeam
    this.MAX_PTS = opts.maxPts ?? 220
    this.MAX_PART = opts.maxPart ?? 600
    this.lifeWindow = opts.lifeWindow ?? 6.5

    // ── Ribbon ─────────────────────────────────────
    const maxVerts = (this.MAX_PTS - 1) * 4
    this.ribbonPos = new Float32Array(maxVerts * 3)
    this.ribbonAlpha = new Float32Array(maxVerts)
    this.ribbonUv = new Float32Array(maxVerts * 2)
    this.ribbonGeo = new THREE.BufferGeometry()
    this.ribbonGeo.setAttribute('position', new THREE.BufferAttribute(this.ribbonPos, 3))
    this.ribbonGeo.setAttribute('aAlpha', new THREE.BufferAttribute(this.ribbonAlpha, 1))
    this.ribbonGeo.setAttribute('aUv', new THREE.BufferAttribute(this.ribbonUv, 2))
    this.ribbonGeo.setDrawRange(0, 0)
    const ribbonMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color(RIBBON_COLOR) } },
      vertexShader: /* glsl */ `
        attribute float aAlpha;
        attribute vec2 aUv;
        varying float vAlpha;
        varying vec2 vUv;
        void main() {
          vAlpha = aAlpha;
          vUv = aUv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;
        varying vec2 vUv;
        void main() {
          float edge = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
          float a = vAlpha * (0.55 + 0.45 * edge);
          if (a < 0.01) discard;
          gl_FragColor = vec4(uColor, a);
        }`,
    })
    this.ribbonMesh = new THREE.Mesh(this.ribbonGeo, ribbonMat)
    ;(this.ribbonMesh as any).drawMode = (THREE as any).TriangleStripDrawMode ?? 2
    this.ribbonMesh.renderOrder = 2
    this.ribbonMesh.frustumCulled = false
    scene.add(this.ribbonMesh)

    // ── Particles ──────────────────────────────────
    this.partPos = new Float32Array(this.MAX_PART * 3)
    this.partAlpha = new Float32Array(this.MAX_PART)
    this.partSize = new Float32Array(this.MAX_PART)
    this.partVel = new Float32Array(this.MAX_PART * 3)
    this.partLife = new Float32Array(this.MAX_PART)
    this.partMaxLife = new Float32Array(this.MAX_PART)
    this.foamTex = makeFoamTexture()
    this.partGeo = new THREE.BufferGeometry()
    this.partGeo.setAttribute('position', new THREE.BufferAttribute(this.partPos, 3))
    this.partGeo.setAttribute('aAlpha', new THREE.BufferAttribute(this.partAlpha, 1))
    this.partGeo.setAttribute('aSize', new THREE.BufferAttribute(this.partSize, 1))
    this.partGeo.setDrawRange(0, 0)
    const partMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTex: { value: this.foamTex },
        uPixel: { value: Math.min(devicePixelRatio, 2) },
      },
      vertexShader: /* glsl */ `
        attribute float aAlpha;
        attribute float aSize;
        varying float vAlpha;
        uniform float uPixel;
        void main() {
          vAlpha = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (300.0 / max(-mv.z, 0.5)) * uPixel;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTex;
        varying float vAlpha;
        void main() {
          vec4 t = texture2D(uTex, gl_PointCoord);
          float a = t.a * vAlpha;
          if (a < 0.01) discard;
          gl_FragColor = vec4(t.rgb, a);
        }`,
    })
    this.partPoints = new THREE.Points(this.partGeo, partMat)
    this.partPoints.renderOrder = 3
    this.partPoints.frustumCulled = false
    scene.add(this.partPoints)
  }

  /** 每帧调用 */
  update(state: BoatKinematicState, dt: number, now: number) {
    // ── 1. 计算船尾左右锚点 ──
    const L2 = state.length * 0.5
    const cx = state.x - state.fx * L2
    const cz = state.z - state.fz * L2
    const rx = -state.fz * this.halfBeam // 右舷 = forward × up(0,1,0) = (fz,0,-fx) → 右舷向量 (fz? )
    const rz = state.fx * this.halfBeam
    // 右舷方向 = (fz*?,...) 实际：right = cross(up, forward)?  forward=(fx,0,fz), up=(0,1,0)
    // right = forward × up? = (0*... ) 用 cross(forward, up) = (fy*up.z - fz*up.y, fz*up.x - fx*up.z, fx*up.y - fy*up.x)
    //   = (0*0 - fz*1, fz*0 - fx*0, fx*1 - 0*0) = (-fz, 0, fx)
    const rgtX = -state.fz
    const rgtZ = state.fx
    const sternL = new THREE.Vector3(cx - rgtX * this.halfBeam, state.y + 0.03, cz - rgtZ * this.halfBeam)
    const sternR = new THREE.Vector3(cx + rgtX * this.halfBeam, state.y + 0.03, cz + rgtZ * this.halfBeam)
    void rx
    void rz

    // ── 2. 采样（每帧 1 个锚点；速度过慢可加密） ──
    this.acc += dt
    if (this.ptsL.length === 0 || this.acc >= this.sampleEvery) {
      this.acc = 0
      this.ptsL.push({ pos: sternL.clone(), t: now })
      this.ptsR.push({ pos: sternR.clone(), t: now })
      if (this.ptsL.length > this.MAX_PTS) {
        this.ptsL.shift()
        this.ptsR.shift()
      }
    }
    this.lastSternL.copy(sternL)
    this.lastSternR.copy(sternR)

    // ── 3. 重建 ribbon ──
    const ptsL = this.ptsL
    const ptsR = this.ptsR
    const segs = ptsL.length - 1
    let v = 0
    for (let i = 0; i < segs; i++) {
      const a0 = 1 - (now - ptsL[i].t) / this.lifeWindow
      const a1 = 1 - (now - ptsL[i + 1].t) / this.lifeWindow
      const al0 = Math.max(0, a0)
      const al1 = Math.max(0, a1)
      const u0 = i / Math.max(1, segs)
      const u1 = (i + 1) / Math.max(1, segs)
      // L0, R0, R1, L1 (TriangleStrip)
      this.setV(v++, ptsL[i].pos, al0, u0, 0)
      this.setV(v++, ptsR[i].pos, al0, u0, 1)
      this.setV(v++, ptsR[i + 1].pos, al1, u1, 1)
      this.setV(v++, ptsL[i + 1].pos, al1, u1, 0)
    }
    this.ribbonGeo.setDrawRange(0, v)
    ;(this.ribbonGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
    ;(this.ribbonGeo.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true
    ;(this.ribbonGeo.getAttribute('aUv') as THREE.BufferAttribute).needsUpdate = true

    // ── 4. 发射 + 更新粒子 ──
    this.emitParticles(sternL, sternR, state, 3)
    this.updateParticles(dt)
  }

  private setV(idx: number, pos: THREE.Vector3, alpha: number, u: number, v: number) {
    this.ribbonPos[idx * 3 + 0] = pos.x
    this.ribbonPos[idx * 3 + 1] = pos.y
    this.ribbonPos[idx * 3 + 2] = pos.z
    this.ribbonAlpha[idx] = alpha
    this.ribbonUv[idx * 2 + 0] = u
    this.ribbonUv[idx * 2 + 1] = v
  }

  private emitParticles(
    sternL: THREE.Vector3,
    sternR: THREE.Vector3,
    state: BoatKinematicState,
    n: number,
  ) {
    for (let k = 0; k < n; k++) {
      this.emitOne(sternL, state, k)
      this.emitOne(sternR, state, k)
    }
  }

  private emitOne(stern: THREE.Vector3, state: BoatKinematicState, _k: number) {
    let idx = this.partCursor
    this.partCursor = (this.partCursor + 1) % this.MAX_PART
    const i3 = idx * 3
    this.partPos[i3 + 0] = stern.x + (Math.random() - 0.5) * 0.09
    this.partPos[i3 + 1] = stern.y + 0.02
    this.partPos[i3 + 2] = stern.z + (Math.random() - 0.5) * 0.09
    const back = -0.5 - Math.random() * 0.4
    this.partVel[i3 + 0] = state.fx * back + (Math.random() - 0.5) * 0.2
    this.partVel[i3 + 1] = 0.025 + Math.random() * 0.04
    this.partVel[i3 + 2] = state.fz * back + (Math.random() - 0.5) * 0.2
    const life = 0.6 + Math.random() * 0.5
    this.partLife[idx] = life
    this.partMaxLife[idx] = life
    this.partSize[idx] = (0.6 + Math.random() * 0.8) * 3.0
    this.partAlpha[idx] = 1
  }

  private updateParticles(dt: number) {
    for (let i = 0; i < this.MAX_PART; i++) {
      const i3 = i * 3
      if (this.partLife[i] <= 0) {
        this.partAlpha[i] = 0
        continue
      }
      this.partLife[i] -= dt
      if (this.partLife[i] <= 0) {
        this.partLife[i] = 0
        this.partAlpha[i] = 0
        continue
      }
      this.partVel[i3 + 1] -= 0.6 * dt
      this.partPos[i3 + 0] += this.partVel[i3 + 0] * dt
      this.partPos[i3 + 1] += this.partVel[i3 + 1] * dt
      this.partPos[i3 + 2] += this.partVel[i3 + 2] * dt
      if (this.partPos[i3 + 1] < 0.02) {
        this.partPos[i3 + 1] = 0.02
        this.partVel[i3 + 1] *= -0.25
      }
      const lf = this.partLife[i] / this.partMaxLife[i]
      this.partAlpha[i] = Math.pow(lf, 0.6)
      this.partSize[i] += dt * 0.25
    }
    // 环形缓冲：存活粒子不在连续前缀，须画满槽位，靠 alpha=0 丢弃
    this.partGeo.setDrawRange(0, this.MAX_PART)
    ;(this.partGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
    ;(this.partGeo.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true
    ;(this.partGeo.getAttribute('aSize') as THREE.BufferAttribute).needsUpdate = true
  }

  dispose(scene: THREE.Scene) {
    scene.remove(this.ribbonMesh, this.partPoints)
    this.ribbonGeo.dispose()
    ;(this.ribbonMesh.material as THREE.Material).dispose()
    this.partGeo.dispose()
    ;(this.partPoints.material as THREE.Material).dispose()
    this.foamTex.dispose()
  }
}