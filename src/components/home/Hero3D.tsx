import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import Hero3DScene from '@/components/home/Hero3DScene'

type Quality = { particles: number; sparkles: number; dpr: [number, number] }

function qualityForWidth(w: number, low: boolean): Quality {
  if (low || w < 640) return { particles: 400, sparkles: 20, dpr: [1, 1.25] }
  if (w < 1024) return { particles: 900, sparkles: 40, dpr: [1, 1.5] }
  return { particles: 1400, sparkles: 70, dpr: [1, 2] }
}

type Props = { lowQuality?: boolean }

export default function Hero3D({ lowQuality = false }: Props) {
  const [quality, setQuality] = useState<Quality>(qualityForWidth(1200, lowQuality))

  useEffect(() => {
    const update = () => setQuality(qualityForWidth(window.innerWidth, lowQuality))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [lowQuality])

  return (
    <div className="hero-three" aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 9], fov: 48, near: 0.1, far: 30 }}
        dpr={quality.dpr}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Hero3DScene particleCount={quality.particles} sparkleCount={quality.sparkles} />
        </Suspense>
      </Canvas>
    </div>
  )
}
