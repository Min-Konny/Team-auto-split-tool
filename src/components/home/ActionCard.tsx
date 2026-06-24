import Link from 'next/link'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useCallback, type MouseEvent } from 'react'

type Action = {
  href: string
  num: string
  title: string
  desc: string
  cta: string
  cls: string
}

type Props = {
  action: Action
  reduced: boolean | null
}

export default function ActionCard({ action, reduced }: Props) {
  const onMove = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }, [])

  return (
    <Link href={action.href} legacyBehavior>
      <motion.a
        className={`action-card ${action.cls}`}
        onMouseMove={onMove}
        whileHover={reduced ? undefined : { y: -6, transition: { duration: 0.22 } }}
        whileTap={reduced ? undefined : { scale: 0.985 }}
      >
        <span className="card-shine" aria-hidden />
        <span className="glyph" />
        <div className="num">{action.num}</div>
        <h3>{action.title}</h3>
        <p>{action.desc}</p>
        <div className="cta-row">
          <span className="mono">{action.cta}</span>
          <span className="arr">→</span>
        </div>
      </motion.a>
    </Link>
  )
}

export function HeroParallax({
  children,
  reduced,
}: {
  children: React.ReactNode
  reduced: boolean | null
}) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 80, damping: 20 })
  const sy = useSpring(my, { stiffness: 80, damping: 20 })
  const rotateX = useTransform(sy, [-0.5, 0.5], [4, -4])
  const rotateY = useTransform(sx, [-0.5, 0.5], [-5, 5])

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  const onLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.div
      className="v1-split-inner"
      style={reduced ? undefined : { rotateX, rotateY, transformPerspective: 1200 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </motion.div>
  )
}
