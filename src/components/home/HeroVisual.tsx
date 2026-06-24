import dynamic from 'next/dynamic'
import { useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/router'
import { Component, useEffect, useState, type ReactNode } from 'react'
import HeroCanvas from '@/components/home/HeroCanvas'

const Hero3D = dynamic(() => import('@/components/home/Hero3D'), { ssr: false })

class WebGLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

/**
 * デフォルト Three.js
 * - `/?hero=canvas` … 2D Canvas版
 * - `/?hero=3d` … Three.js を強制（省エネモーション設定時も）
 */
export default function HeroVisual() {
  const reduced = useReducedMotion()
  const router = useRouter()
  const [webglFailed, setWebglFailed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!hasWebGL()) setWebglFailed(true)
  }, [])

  const force3d = router.query.hero === '3d'
  const forceCanvas = router.query.hero === 'canvas'

  if (!mounted) {
    return <div className="hero-visual-placeholder" aria-hidden />
  }

  if (forceCanvas || webglFailed) {
    return <HeroCanvas />
  }

  if (!force3d && reduced) {
    return <HeroCanvas />
  }

  return (
    <WebGLBoundary fallback={<HeroCanvas />}>
      <Hero3D lowQuality={!!reduced} />
    </WebGLBoundary>
  )
}
