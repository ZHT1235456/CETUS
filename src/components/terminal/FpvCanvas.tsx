import { useEffect, useRef } from 'react'
import { useFleetStore } from '@/store/usvStore'
import { FLEET } from '@/config/fleet'
import type { USVId } from '@/types/usv'

/** 水平视场（弧度） */
const FOV = (95 * Math.PI) / 180

function wrapAngle(a: number) {
  let r = a
  while (r > Math.PI) r -= Math.PI * 2
  while (r < -Math.PI) r += Math.PI * 2
  return r
}

/**
 * 无人艇第一人称视角（FPV）— Canvas 2D 实时绘制船艏景象：
 * 天空 / 海平线 / 波浪速度感，转向时海平线滚转、随波俯仰，
 * 顶部航向刻度尺，视野内他艇剪影。数据来自演示轨迹驱动的实时帧。
 */
export function FpvCanvas({ id }: { id: USVId }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let disposed = false
    let prev = performance.now()
    let prevHeading: number | null = null
    let roll = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w > 0 && h > 0) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
      }
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const render = (now: number) => {
      if (disposed) return
      raf = requestAnimationFrame(render)
      const dt = Math.min((now - prev) / 1000, 0.05)
      prev = now
      const t = now / 1000

      const frame = useFleetStore.getState().frame
      const me = frame[id]
      if (!me) return

      const W = canvas.width
      const H = canvas.height
      if (W < 8 || H < 8) return

      // ── 姿态：转向滚转 + 波浪俯仰 ─────────────────────────
      if (prevHeading === null) prevHeading = me.heading
      const yawRate = dt > 0 ? wrapAngle(me.heading - prevHeading) / dt : 0
      prevHeading = me.heading
      const rollTarget = Math.max(-0.24, Math.min(0.24, yawRate * 0.4))
      roll += (rollTarget - roll) * Math.min(1, dt * 4)
      const pitch = Math.sin(t * 0.9) * 3.5 + Math.sin(t * 0.53 + 1.2) * 2.5 + me.speed * 2.2
      const horizonY = H * 0.44 + pitch

      // ── 天空 ─────────────────────────────────────────────
      const sky = ctx.createLinearGradient(0, 0, 0, horizonY)
      sky.addColorStop(0, '#9ec9e8')
      sky.addColorStop(0.65, '#c8e2f4')
      sky.addColorStop(1, '#e8f3fb')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, Math.max(horizonY, 0))

      // 太阳炫光
      const sunX = W * 0.76
      const sunY = H * 0.16
      const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.3)
      glow.addColorStop(0, 'rgba(255,255,255,0.55)')
      glow.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, W, horizonY)

      // ── 海面（随滚转/俯仰变换） ───────────────────────────
      ctx.save()
      ctx.translate(W / 2, horizonY)
      ctx.rotate(roll)

      const seaH = H - horizonY + Math.abs(roll) * W * 0.6 + 40
      const sea = ctx.createLinearGradient(0, 0, 0, seaH)
      sea.addColorStop(0, '#3d6b8a')
      sea.addColorStop(0.25, '#2c5674')
      sea.addColorStop(1, '#16334c')
      ctx.fillStyle = sea
      ctx.fillRect(-W, 0, W * 2, seaH)

      // 海平线亮带
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillRect(-W, -1, W * 2, 1.6)

      // 波浪条纹：近大远小，相位随速度推进
      const rows = 9
      for (let i = 0; i < rows; i += 1) {
        const f = (i + 1) / rows
        const y = seaH * f * f * 0.92 + 6
        const amp = 1.5 + f * 5
        const phase = t * (0.6 + me.speed * 0.5) * (0.5 + f) + i * 1.7
        ctx.beginPath()
        const step = 26 + f * 40
        for (let x = -W; x <= W; x += step) {
          const yy = y + Math.sin(x / (34 + f * 60) + phase) * amp
          if (x === -W) ctx.moveTo(x, yy)
          else ctx.lineTo(x, yy)
        }
        ctx.strokeStyle = `rgba(210,232,246,${0.05 + f * 0.16})`
        ctx.lineWidth = 0.8 + f * 1.6
        ctx.stroke()
      }

      // 近舷速度纹（左右两侧快速后退的短划）
      const streaks = 14
      for (let i = 0; i < streaks; i += 1) {
        const side = i % 2 === 0 ? -1 : 1
        const lane = Math.floor(i / 2) / (streaks / 2)
        const prog = (t * (0.25 + me.speed * 0.35) + lane) % 1
        const y = seaH * (0.08 + prog * 0.85)
        const x = side * (W * 0.16 + W * 0.34 * prog)
        const len = 14 + prog * 46 * (0.4 + me.speed * 0.3)
        ctx.strokeStyle = `rgba(226,242,252,${0.1 + prog * 0.25})`
        ctx.lineWidth = 1 + prog * 2.2
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + side * len, y + len * 0.12)
        ctx.stroke()
      }

      // ── 视野内他艇剪影 ────────────────────────────────────
      for (const u of FLEET) {
        if (u.id === id) continue
        const other = frame[u.id]
        if (!other) continue
        const dx = other.x - me.x
        const dy = other.y - me.y
        const dist = Math.hypot(dx, dy)
        if (dist < 2 || dist > 260) continue
        const bearing = wrapAngle(Math.atan2(dy, dx) - me.heading)
        if (Math.abs(bearing) > FOV / 2) continue
        const sx = (bearing / (FOV / 2)) * W * 0.55
        const size = Math.max(3, Math.min(34, 620 / dist))
        const sy = 2 + Math.min(34, dist * 0.06)
        ctx.save()
        ctx.translate(sx, sy)
        ctx.fillStyle = 'rgba(14,35,56,0.85)'
        // 船体剪影（梯形）
        ctx.beginPath()
        ctx.moveTo(-size, 0)
        ctx.lineTo(size, 0)
        ctx.lineTo(size * 0.72, -size * 0.42)
        ctx.lineTo(-size * 0.72, -size * 0.42)
        ctx.closePath()
        ctx.fill()
        // 上层建筑
        ctx.fillRect(-size * 0.3, -size * 0.78, size * 0.6, size * 0.4)
        // 尾迹
        ctx.strokeStyle = 'rgba(226,242,252,0.4)'
        ctx.lineWidth = Math.max(1, size * 0.1)
        ctx.beginPath()
        ctx.moveTo(-size * 0.8, size * 0.12)
        ctx.lineTo(-size * 2.2, size * 0.34)
        ctx.moveTo(size * 0.8, size * 0.12)
        ctx.lineTo(size * 2.2, size * 0.34)
        ctx.stroke()
        ctx.restore()
      }

      ctx.restore()

      // ── 航向刻度尺 ───────────────────────────────────────
      const hdgDeg = ((me.heading * 180) / Math.PI + 360) % 360
      const tapeH = 26
      ctx.fillStyle = 'rgba(12,34,56,0.55)'
      ctx.fillRect(0, 0, W, tapeH)
      const span = 50 // 左右各显示 50°
      for (let d = -span; d <= span; d += 5) {
        const deg = (Math.round(hdgDeg) + d + 360) % 360
        const x = W / 2 + (d / span) * (W * 0.44)
        const major = deg % 30 === 0
        const mid = deg % 10 === 0
        ctx.strokeStyle = major ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)'
        ctx.lineWidth = major ? 1.6 : 1
        ctx.beginPath()
        ctx.moveTo(x, tapeH)
        ctx.lineTo(x, tapeH - (major ? 10 : mid ? 7 : 4))
        ctx.stroke()
        if (major) {
          ctx.fillStyle = 'rgba(255,255,255,0.92)'
          ctx.font = '600 9px "JetBrains Mono", monospace'
          ctx.textAlign = 'center'
          const label = deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : String(deg)
          ctx.fillText(label, x, 9)
        }
      }
      // 中央航向游标
      ctx.fillStyle = '#ffd7d1'
      ctx.beginPath()
      ctx.moveTo(W / 2 - 4, tapeH)
      ctx.lineTo(W / 2 + 4, tapeH)
      ctx.lineTo(W / 2, tapeH - 7)
      ctx.closePath()
      ctx.fill()

      // ── 船艏基准线 ───────────────────────────────────────
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(W / 2 - 26, horizonY)
      ctx.lineTo(W / 2 - 8, horizonY)
      ctx.moveTo(W / 2 + 8, horizonY)
      ctx.lineTo(W / 2 + 26, horizonY)
      ctx.stroke()
    }

    raf = requestAnimationFrame(render)
    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [id])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
}
