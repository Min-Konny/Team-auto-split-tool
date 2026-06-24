import { Float, Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const BLUE = '#5eb3ff'
const RED = '#ff6b6b'

function CameraRig() {
  useFrame((state) => {
    const tx = state.mouse.x * 0.85
    const ty = state.mouse.y * 0.38
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, tx, 0.045)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, ty, 0.045)
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 9, 0.08)
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

function SplitParticles({ side, count }: { side: 'blue' | 'red'; count: number }) {
  const ref = useRef<THREE.Points>(null)
  const color = side === 'blue' ? BLUE : RED

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const x = side === 'blue' ? -7.5 + Math.random() * 6.5 : 1 + Math.random() * 6.5
      pos[i * 3] = x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 5.5
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3.5
    }
    return pos
  }, [side, count])

  useFrame((state) => {
    if (!ref.current) return
    const dir = side === 'blue' ? 1 : -1
    ref.current.rotation.y = state.clock.elapsedTime * 0.025 * dir
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.08
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function CoreRing() {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.x = state.clock.elapsedTime * 0.35
    ref.current.rotation.z = state.clock.elapsedTime * 0.22
  })
  return (
    <group ref={ref}>
      <mesh>
        <torusGeometry args={[1.15, 0.028, 12, 80]} />
        <meshBasicMaterial color="#d8e2f0" transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.018, 10, 64]} />
        <meshBasicMaterial color={BLUE} transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

function SideCore({ side }: { side: 'blue' | 'red' }) {
  const x = side === 'blue' ? -3.3 : 3.3
  const color = side === 'blue' ? BLUE : RED
  const emissive = side === 'blue' ? '#1a4a88' : '#882222'
  return (
    <Float speed={1.6} rotationIntensity={0.55} floatIntensity={0.65}>
      <mesh position={[x, side === 'blue' ? 0.15 : -0.2, -0.8]}>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshStandardMaterial color={color} wireframe emissive={emissive} emissiveIntensity={0.55} />
      </mesh>
    </Float>
  )
}

type Props = { particleCount: number; sparkleCount: number }

export default function Hero3DScene({ particleCount, sparkleCount }: Props) {
  return (
    <>
      <fog attach="fog" args={['#141820', 5.5, 15]} />
      <CameraRig />
      <ambientLight intensity={0.2} />
      <pointLight position={[-4.5, 1.5, 4]} color={BLUE} intensity={2.2} distance={18} />
      <pointLight position={[4.5, -0.5, 4]} color={RED} intensity={2.2} distance={18} />
      <SplitParticles side="blue" count={particleCount} />
      <SplitParticles side="red" count={particleCount} />
      <SideCore side="blue" />
      <SideCore side="red" />
      <CoreRing />
      <Sparkles
        count={sparkleCount}
        scale={[13, 7, 2.5]}
        size={2.8}
        speed={0.32}
        color={BLUE}
        position={[-3.8, 0, 0.5]}
        opacity={0.45}
      />
      <Sparkles
        count={sparkleCount}
        scale={[13, 7, 2.5]}
        size={2.8}
        speed={0.32}
        color={RED}
        position={[3.8, 0, 0.5]}
        opacity={0.45}
      />
    </>
  )
}
