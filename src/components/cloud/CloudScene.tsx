import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useEffect, useRef, useState } from 'react'
import { FLEET } from '@/config/fleet'
import { formationAt } from '@/lib/formation'
import { useFleetStore } from '@/store/usvStore'
import { loadBoatModels, cloneBoat, headingToYRot, type BoatModel } from './modelLoader'
import { applyRenderer, buildFog, buildLights, buildSky, buildWater, sunPosition } from './ocean'
import { Wake, type BoatKinematicState } from './wake'

type Boat = {
  id: string
  group: THREE.Group
  wake: Wake
  model: BoatModel
  halfBeam: number
}

export function CloudScene() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')

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

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(44, host.clientWidth / host.clientHeight, 0.1, 2000)
    camera.position.set(0, 28, 34)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 12
    controls.maxDistance = 110
    controls.maxPolarAngle = THREE.MathUtils.degToRad(86)
    controls.enablePan = false
    controls.target.set(0, 0, 0)

    const sunDir = sunPosition()
    buildFog(scene)
    buildSky(scene, sunDir)
    buildLights(scene, sunDir)

    const boats: Boat[] = []
    const clock = new THREE.Clock()
    let t = 0
    let lastStorePush = 0
    let water: Awaited<ReturnType<typeof buildWater>> | null = null

    const tick = useFleetStore.getState().tickMock

    const loop = () => {
      if (disposed) return
      raf = requestAnimationFrame(loop)
      const dt = Math.min(clock.getDelta(), 0.05)
      t += dt
      const km = formationAt(t)
      if (water) water.material.uniforms['time'].value += dt * 0.5
      for (const b of boats) {
        const k = km[b.id as keyof typeof km]
        if (!k) continue
        b.group.position.set(k.x, b.model.yOffset, k.z)
        b.group.rotation.y = headingToYRot(k.fx, k.fz)
        const state: BoatKinematicState = {
          x: k.x,
          y: 0,
          z: k.z,
          fx: k.fx,
          fz: k.fz,
          length: b.model.length,
          beam: b.model.beam,
        }
        b.wake.update(state, dt, t)
      }
      if (t - lastStorePush > 0.25) {
        lastStorePush = t
        tick(t)
      }
      controls.update()
      renderer.render(scene, camera)
    }

    Promise.all([buildWater(scene, sunDir), loadBoatModels()])
      .then(([w, models]) => {
        if (disposed) {
          w.geometry.dispose()
          ;(w.material as THREE.Material).dispose()
          return
        }
        water = w
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
          // 虚拟领导者半透明 + 着色强调
          if (u.role === 'virtual-leader') {
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
          const halfBeam = Math.max(0.01, m.beam * 0.0225)
          const wake = new Wake(scene, { halfBeam, lifeWindow: 3.25 })
          scene.add(g)
          boats.push({ id: u.id, group: g, wake, model: m, halfBeam })
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
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(host)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      for (const b of boats) b.wake.dispose(scene)
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
    }
  }, [])

  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} className="scene-host" />
      {/* loading veil */}
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
      {/* vignette + horizon tints */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: 'inset 0 -120px 120px -80px rgba(180,205,230,0.35), inset 0 0 90px rgba(15,40,70,0.12)',
        }}
      />
    </div>
  )
}