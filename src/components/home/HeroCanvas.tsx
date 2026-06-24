import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

type Side = 'blue' | 'red'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  side: Side
  r: number
}

const BLUE = 'oklch(0.72 0.16 240)'
const RED = 'oklch(0.68 0.20 25)'

function spawn(w: number, h: number, side: Side): Particle {
  const x = side === 'blue' ? Math.random() * w * 0.48 : w * 0.52 + Math.random() * w * 0.48
  return {
    x,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    side,
    r: 1 + Math.random() * 2.2,
  }
}

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const mouse = useRef({ x: -9999, y: -9999, active: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reduced) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let particles: Particle[] = []
    let raf = 0
    let running = true

    const countFor = () => (w < 768 ? 36 : w < 1200 ? 64 : 96)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = countFor()
      particles = []
      for (let i = 0; i < n; i++) particles.push(spawn(w, h, i % 2 === 0 ? 'blue' : 'red'))
    }

    const host = canvas.parentElement
    if (!host) return

    const onMove = (e: MouseEvent) => {
      const rect = host.getBoundingClientRect()
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true }
    }
    const onLeave = () => {
      mouse.current.active = false
    }

    const draw = () => {
      if (!running) return
      ctx.clearRect(0, 0, w, h)

      const mx = mouse.current.x
      const my = mouse.current.y
      const mouseOn = mouse.current.active

      // center rift glow
      const cx = w / 2
      const grad = ctx.createLinearGradient(cx - 80, 0, cx + 80, 0)
      grad.addColorStop(0, 'oklch(0.72 0.16 240 / 0.12)')
      grad.addColorStop(0.5, 'oklch(0.96 0.01 250 / 0.06)')
      grad.addColorStop(1, 'oklch(0.68 0.20 25 / 0.12)')
      ctx.fillStyle = grad
      ctx.fillRect(cx - 100, 0, 200, h)

      for (const p of particles) {
        if (mouseOn) {
          const dx = p.x - mx
          const dy = p.y - my
          const dist = Math.hypot(dx, dy) || 1
          if (dist < 140) {
            const force = (140 - dist) / 140
            p.vx += (dx / dist) * force * 0.08
            p.vy += (dy / dist) * force * 0.08
          }
        }
        p.vx *= 0.98
        p.vy *= 0.98
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        const pull = p.side === 'blue' ? -0.002 : 0.002
        p.vx += pull
      }

      // connection lines
      const linkDist = w < 768 ? 70 : 95
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]!
          const b = particles[j]!
          if (a.side !== b.side) continue
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d = Math.hypot(dx, dy)
          if (d > linkDist) continue
          const alpha = (1 - d / linkDist) * 0.22
          ctx.strokeStyle = a.side === 'blue' ? `oklch(0.72 0.16 240 / ${alpha})` : `oklch(0.68 0.20 25 / ${alpha})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.side === 'blue' ? BLUE : RED
        ctx.globalAlpha = 0.55 + p.r * 0.12
        ctx.fill()
        ctx.globalAlpha = 1
      }

      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    host.addEventListener('mousemove', onMove)
    host.addEventListener('mouseleave', onLeave)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      host.removeEventListener('mousemove', onMove)
      host.removeEventListener('mouseleave', onLeave)
    }
  }, [reduced])

  if (reduced) return null

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden />
}
