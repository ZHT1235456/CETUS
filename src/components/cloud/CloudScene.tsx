import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { useEffect, useRef, useState } from 'react'
import { Crosshair, Move, Tags } from 'lucide-react'
import { FLEET } from '@/config/fleet'
import { toSceneForward, toScenePosition } from '@/lib/coords'
import { frameAt } from '@/lib/fleetReplay'
import { useFleetStore } from '@/store/usvStore'
import { cn } from '@/lib/utils'
import type { USVId } from '@/types/usv'
import { loadBoatModels, cloneBoat, headingToYRot, type BoatModel } from './modelLoader'
import { BOAT_VISUAL_SCALE, WAKE_VISUAL_SCALE } from './sceneScale'
import { applyRenderer, buildFog, buildLights, buildSky, buildWater, sunPosition } from './ocean'
import { Wake, type BoatKinematicState } from './wake'
import {
  TRACK_IDS,
  createBoatLabel,
  fleetCameraPose,
  trackCameraPose,
  type ViewMode,
} from './sceneHud'

type Boat = {
  id: USVId
  group: THREE.Group
  wake: Wake
  model: BoatModel
  halfBeam: number
  label: ReturnType<typeof createBoatLabel>
  sceneFx: number
  sceneFz: number
}

const VIEW_LERP_SPEED = 5.5
const TRACK_LERP_SPEED = 6.5

type CameraState =
  | { kind: 'free'; mode: ViewMode }
  | { kind: 'track'; id: USVId }

export function CloudScene() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [showLabels, setShowLabels] = useState(true)
  const [panEnabled, setPanEnabled] = useState(false)
  const [cameraState, setCameraState] = useState<CameraState>({ kind: 'free', mode: 'overview' })

  const apiRef = useRef<{
    setLabelsVisible: (v: boolean) => void
    setPanEnabled: (v: boolean) => void
    setCameraState: (s: CameraState) => void
  } | null>(null)

  useEffect(() => {
    apiRef.current?.setLabelsVisible(showLabels)
  }, [showLabels])

  useEffect(() => {
    apiRef.current?.setPanEnabled(panEnabled)
  }, [panEnabled])

  useEffect(() => {
    apiRef.current?.setCameraState(cameraState)
  }, [cameraState])

  useEffect(() => {
    const host = hostRef.current!
    let disposed = false
    let raf = 0

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    applyRenderer(renderer)
    renderer.setSize(host.clientWidth, host.clientHeight)
    host.appendChild(renderer.domElement)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'

    const labelRenderer = new CSS2DRenderer()
    labelRenderer.setSize(host.clientWidth, host.clientHeight)
    labelRenderer.domElement.style.position = 'absolute'
    labelRenderer.domElement.style.inset = '0'
    labelRenderer.domElement.style.pointerEvents = 'none'
    host.appendChild(labelRenderer.domElement)

    const scene = new THREE.Scene()
    // 自由视角（斜视/俯视）锚点：初始时刻的集群中心，不跟随移动中的集群
    const cam = (() => {
      const f = frameAt(0)
      const c = new THREE.Vector3()
      for (const u of FLEET) {
        const p = toScenePosition({ x: f[u.id].x, y: f[u.id].y, z: 0 }, 0)
        c.x += p.x
        c.z += p.z
      }
      return c.multiplyScalar(1 / FLEET.length)
    })()
    const startPose = fleetCameraPose('overview', cam)

    const camera = new THREE.PerspectiveCamera(44, host.clientWidth / host.clientHeight, 0.1, 4000)
    camera.position.copy(startPose.position)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 8 * BOAT_VISUAL_SCALE
    controls.maxDistance = 220
    controls.maxPolarAngle = THREE.MathUtils.degToRad(89.5)
    controls.enablePan = false
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE
    controls.target.copy(startPose.target)

    const sunDir = sunPosition()
    buildFog(scene)
    buildSky(scene, sunDir)
    buildLights(scene, sunDir)

    const boats: Boat[] = []
    const clock = new THREE.Clock()
    let t = 0
    let water: Awaited<ReturnType<typeof buildWater>> | null = null

    let camState: CameraState = { kind: 'free', mode: 'overview' }
    const camGoal = {
      pos: startPose.position.clone(),
      target: startPose.target.clone(),
      active: false,
    }
    const centerDelta = new THREE.Vector3()
    const freeViewOffset = new THREE.Vector3()
    const desiredTarget = new THREE.Vector3()
    let isInteracting = false
    let isPanEnabled = false

    const cancelFreeViewTransition = () => {
      isInteracting = true
      if (camState.kind === 'free') camGoal.active = false
    }
    const capturePanOffset = () => {
      if (isInteracting && isPanEnabled && camState.kind === 'free') {
        freeViewOffset.copy(controls.target).sub(cam)
      }
    }
    const finishInteraction = () => {
      isInteracting = false
    }
    controls.addEventListener('start', cancelFreeViewTransition)
    controls.addEventListener('change', capturePanOffset)
    controls.addEventListener('end', finishInteraction)

    const applyFreeView = (mode: ViewMode) => {
      controls.enabled = true
      freeViewOffset.set(0, 0, 0)
      controls.maxPolarAngle =
        mode === 'top' ? THREE.MathUtils.degToRad(89.8) : THREE.MathUtils.degToRad(86)
      const pose = fleetCameraPose(mode, cam)
      camGoal.pos.copy(pose.position)
      camGoal.target.copy(pose.target)
      camGoal.active = true
    }

    apiRef.current = {
      setLabelsVisible: (v) => {
        for (const b of boats) b.label.visible = v
      },
      setPanEnabled: (v) => {
        isPanEnabled = v
        controls.enablePan = v
        controls.mouseButtons.LEFT = v ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE
        if (!v) freeViewOffset.set(0, 0, 0)
      },
      setCameraState: (s) => {
        camState = s
        if (s.kind === 'free') {
          applyFreeView(s.mode)
        } else {
          controls.enabled = false
          camGoal.active = false
        }
      },
    }

    const loop = () => {
      if (disposed) return
      raf = requestAnimationFrame(loop)
      const dt = Math.min(clock.getDelta(), 0.05)
      t += dt
      const frame = useFleetStore.getState().frame
      if (water) water.material.uniforms['time'].value += dt * 0.5

      for (const b of boats) {
        const unit = frame[b.id]
        if (!unit) continue
        const pos = toScenePosition(
          { x: unit.x, y: unit.y, z: unit.z },
          b.model.yOffset,
        )
        const fwd = toSceneForward(Math.cos(unit.heading), Math.sin(unit.heading))
        b.group.position.set(pos.x, pos.y, pos.z)
        b.group.rotation.y = headingToYRot(fwd.fx, fwd.fz)
        b.sceneFx = fwd.fx
        b.sceneFz = fwd.fz
        const state: BoatKinematicState = {
          x: pos.x,
          // 船模带有自身的垂直校准偏移，尾迹必须独立锚定在水面。
          y: 0,
          z: pos.z,
          fx: fwd.fx,
          fz: fwd.fz,
          length: b.model.length,
          beam: b.model.beam,
        }
        b.wake.update(state, dt, t)
      }

      if (camState.kind === 'track') {
        const trackId = camState.id
        const boat = boats.find((b) => b.id === trackId)
        if (boat) {
          const p = boat.group.position
          const pose = trackCameraPose(p, boat.sceneFx, boat.sceneFz)
          const a = 1 - Math.exp(-TRACK_LERP_SPEED * dt)
          camera.position.lerp(pose.position, a)
          controls.target.lerp(pose.target, a)
        }
      } else {
        if (camGoal.active) {
          const pose = fleetCameraPose(camState.mode, cam)
          camGoal.pos.copy(pose.position)
          camGoal.target.copy(pose.target)
          const a = 1 - Math.exp(-VIEW_LERP_SPEED * dt)
          camera.position.lerp(camGoal.pos, a)
          controls.target.lerp(camGoal.target, a)
          if (
            camera.position.distanceTo(camGoal.pos) < 0.08 &&
            controls.target.distanceTo(camGoal.target) < 0.08
          ) {
            camera.position.copy(camGoal.pos)
            controls.target.copy(camGoal.target)
            camGoal.active = false
          }
        } else {
          desiredTarget.copy(cam).add(freeViewOffset)
          centerDelta.copy(desiredTarget).sub(controls.target)
          camera.position.add(centerDelta)
          controls.target.copy(desiredTarget)
        }
      }

      controls.update()
      renderer.render(scene, camera)
      labelRenderer.render(scene, camera)
    }

    Promise.all([buildWater(scene, sunDir), loadBoatModels()])
      .then(([w, models]) => {
        if (disposed) {
          w.geometry.dispose()
          ;(w.material as THREE.Material).dispose()
          return
        }
        water = w
        water.position.set(cam.x, 0, cam.z)
        for (const u of FLEET) {
          const m = models[u.model]
          const g = cloneBoat(m)
          g.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) {
              const mesh = o as THREE.Mesh
              if (Array.isArray(mesh.material)) {
                mesh.material = (mesh.material as THREE.Material[]).map((mm) => mm.clone())
              }
            }
          })
          if (u.role === 'virtual') {
            g.traverse((o) => {
              if ((o as THREE.Mesh).isMesh) {
                const mesh = o as THREE.Mesh
                const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial
                if (mat && (mat as any).emissive) {
                  ;(mat as any).emissive = new THREE.Color(0x6fd2ff)
                  ;(mat as any).emissiveIntensity = 0.5
                }
                mat.transparent = true
                mat.opacity = 0.85
              }
            })
          }
          const label = createBoatLabel(u)
          g.add(label)
          const wakeScaleRatio = WAKE_VISUAL_SCALE / BOAT_VISUAL_SCALE
          const halfBeam = Math.max(0.01, m.beam * 0.0225) * wakeScaleRatio
          const wake = new Wake(scene, {
            halfBeam,
            visualScale: WAKE_VISUAL_SCALE,
            lifeWindow: 3.25,
          })
          scene.add(g)
          boats.push({
            id: u.id,
            group: g,
            wake,
            model: m,
            halfBeam,
            label,
            sceneFx: 0,
            sceneFz: 1,
          })
        }
        setPhase('ready')
        clock.start()
        loop()
      })
      .catch((err) => {
        console.error('模型或水面资源加载失败', err)
        setPhase('error')
      })

    const onResize = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      renderer.setSize(w, h)
      labelRenderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(host)

    return () => {
      disposed = true
      apiRef.current = null
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.removeEventListener('start', cancelFreeViewTransition)
      controls.removeEventListener('change', capturePanOffset)
      controls.removeEventListener('end', finishInteraction)
      controls.dispose()
      for (const b of boats) {
        b.wake.dispose(scene)
        b.label.element.remove()
      }
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (mesh.isMesh) {
          mesh.geometry?.dispose?.()
          const mat = mesh.material
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
          else mat?.dispose?.()
        }
      })
      if (water) {
        water.geometry.dispose()
        ;(water.material as THREE.Material).dispose()
      }
      renderer.dispose()
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement)
      if (labelRenderer.domElement.parentElement === host) host.removeChild(labelRenderer.domElement)
    }
  }, [])

  const isTracking = cameraState.kind === 'track'
  const trackId = isTracking ? cameraState.id : null
  const freeMode = cameraState.kind === 'free' ? cameraState.mode : null

  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} className="scene-host" />

      {phase === 'ready' && (
        <div className="pointer-events-auto absolute bottom-5 right-5 z-20 flex max-w-[min(100%,420px)] flex-col items-end gap-2 fade-in">
          <button
            type="button"
            onClick={() => setPanEnabled((enabled) => !enabled)}
            className={cn(
              'panel-flat flex items-center gap-2 rounded-md px-3 py-2 shadow-1 transition-colors',
              panEnabled ? 'text-primary' : 'text-ink-faint',
            )}
            title="开启后用鼠标左键直接拖拽平移视角"
          >
            <Move className="h-3.5 w-3.5" strokeWidth={1.8} />
            <span className="font-display text-[12.5px] font-600">
              {panEnabled ? '平移 · 开' : '平移 · 关'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowLabels((s) => !s)}
            className={cn(
              'panel-flat flex items-center gap-2 rounded-md px-3 py-2 shadow-1 transition-colors',
              showLabels ? 'text-primary' : 'text-ink-faint',
            )}
          >
            <Tags className="h-3.5 w-3.5" strokeWidth={1.8} />
            <span className="font-display text-[12.5px] font-600">
              {showLabels ? '标签 · 开' : '标签 · 关'}
            </span>
          </button>
          <div className="panel-flat rounded-md p-2 shadow-1">
            <div className="mb-1.5 flex items-center gap-1.5 px-1.5">
              <Crosshair className="h-3.5 w-3.5 text-ink-faint" strokeWidth={1.8} />
              <span className="chip text-ink-faint">视角</span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setCameraState({ kind: 'free', mode: 'overview' })}
                className={cn(
                  'rounded-sm px-2.5 py-1.5 font-display text-[12.5px] font-600 transition-colors',
                  !isTracking && freeMode === 'overview'
                    ? 'bg-primary text-surface shadow-1'
                    : 'text-ink-soft hover:bg-frost hover:text-ink',
                )}
              >
                斜视
              </button>
              <button
                type="button"
                onClick={() => setCameraState({ kind: 'free', mode: 'top' })}
                className={cn(
                  'rounded-sm px-2.5 py-1.5 font-display text-[12.5px] font-600 transition-colors',
                  !isTracking && freeMode === 'top'
                    ? 'bg-primary text-surface shadow-1'
                    : 'text-ink-soft hover:bg-frost hover:text-ink',
                )}
              >
                俯视
              </button>
              <span className="mx-0.5 h-5 w-px bg-line-soft" />
              <span className="chip px-1 text-ink-ghost">跟踪</span>
              {TRACK_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCameraState({ kind: 'track', id })}
                  className={cn(
                    'grid h-8 min-w-8 place-items-center rounded-sm font-mono text-[11.5px] font-700 transition-colors',
                    trackId === id
                      ? 'bg-water text-surface shadow-1'
                      : 'bg-surface/80 text-ink-soft ring-1 ring-line-soft hover:bg-frost hover:text-ink',
                  )}
                  title={`跟踪 ${id}`}
                >
                  {id.replace('USV-', '')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase !== 'ready' && (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-bg/40 to-bg-2/60 backdrop-blur-sm">
          <div className="panel-flat rounded-md px-5 py-3.5 text-center">
            <div className="label-eyebrow mb-1">
              {phase === 'loading' ? 'Loading Formation' : 'Error'}
            </div>
            <div className="font-display text-[15px] font-600 text-ink">
              {phase === 'loading'
                ? '正在装载六艇编队与水域…'
                : '模型或水面资源加载失败，请检查 assets/USV_*.glb'}
            </div>
            {phase === 'loading' && (
              <div className="mt-2 flex justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-water"
                    style={{ animation: 'pulse-soft 1s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: 'inset 0 -120px 120px -80px rgba(180,205,230,0.35), inset 0 0 90px rgba(15,40,70,0.12)',
        }}
      />
    </div>
  )
}
