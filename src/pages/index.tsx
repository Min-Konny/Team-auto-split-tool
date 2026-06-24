import dynamic from 'next/dynamic'
import { motion, useReducedMotion } from 'framer-motion'
import Header from '@/components/Header'
import ActionCard, { HeroParallax } from '@/components/home/ActionCard'
import CountUp from '@/components/home/CountUp'

const HeroVisual = dynamic(() => import('@/components/home/HeroVisual'), { ssr: false })

const actions = [
  {
    href: '/team-maker',
    num: '01 / PRIMARY',
    title: 'チーム\n作成',
    desc: '10人を選択し、レートと希望ロールから最適なチームを自動生成します。',
    cta: 'START SPLIT',
    cls: 'primary',
  },
  {
    href: '/players',
    num: '02 / ROSTER',
    title: 'プレイヤー\nリスト',
    desc: '登録済みプレイヤーの一覧と戦績、レートを確認できます。',
    cta: 'VIEW',
    cls: 'players',
  },
  {
    href: '/players/new',
    num: '03 / RECRUIT',
    title: 'プレイヤー\n登録',
    desc: '新しいプレイヤーを名前・ロール・ランクで追加します。',
    cta: 'ADD',
    cls: 'new',
  },
  {
    href: '/matches',
    num: '04 / HISTORY',
    title: '試合\n履歴',
    desc: '過去の対戦記録と勝敗、レート変動を振り返ります。',
    cta: 'REVIEW',
    cls: 'match',
  },
]

const ease = [0.22, 1, 0.36, 1] as const

const fadeUp = (delay = 0, reduced: boolean | null) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, delay, ease },
      }

const fadeX = (from: number, delay = 0, reduced: boolean | null) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, x: from },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.85, delay, ease },
      }

export default function Home() {
  const reduced = useReducedMotion()

  return (
    <div className="home">
      <Header />

      <section className="v1-hero">
        <HeroVisual />
        <div className="hero-glow hero-glow-blue" aria-hidden />
        <div className="hero-glow hero-glow-red" aria-hidden />
        <div className="hero-grid" aria-hidden />
        <div className="hero-beam hero-beam-blue" aria-hidden />
        <div className="hero-beam hero-beam-red" aria-hidden />
        <div className="hero-scanlines" aria-hidden />

        <HeroParallax reduced={reduced}>
          <div className="v1-split">
            <motion.div className="v1-side blue" {...fadeX(-56, 0.12, reduced)}>
              <div className="side-inner">
                <div className="side-tag">
                  <span>BLUE SIDE</span>
                  <span className="dot pulse-blue" />
                </div>
                <h2>
                  Bal-
                  <br />
                  anced.
                </h2>
                <div className="hex">// avg rate · 1842</div>
              </div>
            </motion.div>

            <motion.div
              className="v1-vs"
              initial={reduced ? false : { opacity: 0, scale: 0.5 }}
              animate={reduced ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.35, ease }}
            >
              <span className="vs-ring" aria-hidden />
              <span className="vs-badge">VS</span>
            </motion.div>

            <motion.div className="v1-side red" {...fadeX(56, 0.12, reduced)}>
              <div className="side-inner">
                <div className="side-tag">
                  <span className="dot pulse-red" />
                  <span>RED SIDE</span>
                </div>
                <h2>
                  Fair
                  <br />
                  fight.
                </h2>
                <div className="hex">// avg rate · 1838</div>
              </div>
            </motion.div>
          </div>
        </HeroParallax>
      </section>

      <motion.div
        className="v1-meta"
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45, ease }}
      >
        <div className="cell">
          <div className="k">Δ Rate Diff</div>
          <div className="v">
            <CountUp value={4} />
            <span className="unit">pts</span>
          </div>
        </div>
        <div className="cell">
          <div className="k">Players Pool</div>
          <div className="v">
            <CountUp value={42} />
          </div>
        </div>
        <div className="cell">
          <div className="k">Matches Logged</div>
          <div className="v">
            <CountUp value={137} />
          </div>
        </div>
        <div className="cell">
          <div className="k">Last Build</div>
          <div className="v">
            21:42<span className="unit">JST</span>
          </div>
        </div>
      </motion.div>

      <div className="container">
        <motion.div
          className="v1-actions"
          initial={reduced ? false : 'hidden'}
          animate={reduced ? undefined : 'show'}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.09, delayChildren: 0.55 } },
          }}
        >
          {actions.map((a) => (
            <motion.div
              key={a.href}
              variants={{
                hidden: reduced ? {} : { opacity: 0, y: 28 },
                show: reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
              }}
            >
              <ActionCard action={a} reduced={reduced} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: css }} />
    </div>
  )
}

const css = `
.home { overflow-x: clip; }

.container { max-width: 1440px; margin: 0 auto; padding: 0 32px; }
.mono { font-family: var(--font-mono), ui-monospace, monospace; }

.v1-hero {
  position: relative; overflow: hidden;
  border-bottom: 1px solid var(--line);
  min-height: 480px;
}
.hero-canvas {
  position: absolute; inset: 0; width: 100%; height: 100%;
  z-index: 0; pointer-events: none;
}
.hero-three {
  position: absolute; inset: 0; width: 100%; height: 100%;
  z-index: 0; pointer-events: none;
}
.hero-three canvas { display: block; width: 100% !important; height: 100% !important; }
.hero-visual-placeholder { position: absolute; inset: 0; z-index: 0; background: var(--bg-0); }
.hero-glow {
  position: absolute; width: 58%; height: 130%;
  top: -15%; filter: blur(90px); opacity: 0.4;
  pointer-events: none; z-index: 0;
  animation: breathe 5s ease-in-out infinite;
}
.hero-glow-blue {
  left: -12%;
  background: radial-gradient(ellipse, var(--blue) 0%, transparent 68%);
}
.hero-glow-red {
  right: -12%;
  background: radial-gradient(ellipse, var(--red) 0%, transparent 68%);
  animation-delay: -2.5s;
}
.hero-grid {
  position: absolute; inset: 0; opacity: 0.055; z-index: 0;
  background-image:
    linear-gradient(var(--line-2) 1px, transparent 1px),
    linear-gradient(90deg, var(--line-2) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 100%);
}
.hero-beam {
  position: absolute; top: 0; width: 2px; height: 100%;
  opacity: 0.35; z-index: 0; pointer-events: none;
  animation: beam-drift 8s ease-in-out infinite;
}
.hero-beam-blue {
  left: 28%;
  background: linear-gradient(180deg, transparent, var(--blue), transparent);
  box-shadow: 0 0 24px var(--blue);
}
.hero-beam-red {
  right: 28%;
  background: linear-gradient(180deg, transparent, var(--red), transparent);
  box-shadow: 0 0 24px var(--red);
  animation-delay: -4s;
}
.hero-scanlines {
  position: absolute; inset: 0; z-index: 2; pointer-events: none; opacity: 0.04;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    oklch(0.96 0.01 250 / 0.5) 2px,
    oklch(0.96 0.01 250 / 0.5) 3px
  );
}

.v1-split-inner { position: relative; z-index: 3; transform-style: preserve-3d; }
.v1-split {
  display: grid; grid-template-columns: 1fr auto 1fr;
  min-height: 480px; align-items: stretch;
}
.v1-side {
  padding: 52px 56px 44px; position: relative;
  display: flex; flex-direction: column; justify-content: center;
}
.v1-side.blue {
  background: linear-gradient(135deg, color-mix(in oklch, var(--blue-bg) 65%, transparent) 0%, transparent 85%);
  text-align: right;
}
.v1-side.red {
  background: linear-gradient(225deg, color-mix(in oklch, var(--red-bg) 65%, transparent) 0%, transparent 85%);
}
.side-inner { position: relative; z-index: 1; }
.v1-side .side-tag {
  font-family: 'JetBrains Mono'; font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em;
  display: flex; align-items: center; gap: 8px;
}
.v1-side.blue .side-tag { justify-content: flex-end; color: var(--blue); }
.v1-side.red .side-tag { color: var(--red); }
.side-tag .dot {
  width: 7px; height: 7px; border-radius: 50%;
  box-shadow: 0 0 0 4px color-mix(in oklch, currentColor 18%, transparent);
}
.v1-side.blue .side-tag .dot { background: var(--blue); }
.v1-side.red .side-tag .dot { background: var(--red); }
.pulse-blue { animation: pulse-dot 2.4s ease-in-out infinite; }
.pulse-red { animation: pulse-dot 2.4s ease-in-out infinite 1.2s; }

.v1-side h2 {
  font-family: 'Space Grotesk'; font-weight: 700; font-size: clamp(52px, 7.8vw, 112px);
  line-height: 0.9; letter-spacing: -0.04em; margin: 28px 0 0;
}
.v1-side.blue h2 {
  color: var(--blue);
  text-shadow: 0 0 80px color-mix(in oklch, var(--blue) 45%, transparent);
}
.v1-side.red h2 {
  color: var(--red);
  text-shadow: 0 0 80px color-mix(in oklch, var(--red) 45%, transparent);
}
.v1-side .hex { margin-top: 14px; font-family: 'JetBrains Mono'; font-size: 12px; color: var(--fg-3); }

.v1-vs {
  width: 1px; position: relative; align-self: stretch;
  background: linear-gradient(180deg, transparent 0%, var(--line-2) 25%, var(--line-2) 75%, transparent 100%);
}
.vs-ring {
  position: absolute; left: 50%; top: 50%;
  width: 88px; height: 88px; transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid color-mix(in oklch, var(--line-2) 80%, var(--blue) 20%);
  animation: ring-spin 12s linear infinite;
}
.vs-ring::after {
  content: ""; position: absolute; inset: -1px; border-radius: 50%;
  border: 1px solid transparent;
  border-top-color: var(--red);
  border-bottom-color: var(--blue);
  opacity: 0.6;
}
.vs-badge {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  font-family: 'Space Grotesk'; font-weight: 700; font-size: 22px;
  background: color-mix(in oklch, var(--bg-0) 88%, transparent);
  backdrop-filter: blur(8px);
  padding: 18px 12px; color: var(--fg-1); letter-spacing: 0.08em;
  border: 1px solid var(--line-2);
  border-radius: 10px;
  animation: vs-glow 3s ease-in-out infinite;
}

.v1-meta { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); background: var(--bg-1); position: relative; z-index: 4; }
.v1-meta .cell { padding: 22px 32px; border-right: 1px solid var(--line); }
.v1-meta .cell:last-child { border-right: 0; }
.v1-meta .k { font-family: 'JetBrains Mono'; font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; color: var(--fg-3); }
.v1-meta .v { font-family: 'Space Grotesk'; font-size: 28px; font-weight: 600; margin-top: 6px; letter-spacing: -0.02em; }
.v1-meta .v .unit { font-size: 13px; color: var(--fg-3); margin-left: 4px; font-family: 'JetBrains Mono'; }

.v1-actions { padding: 40px 0 72px; display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 16px; }
.action-card {
  border: 1px solid var(--line); border-radius: 14px; padding: 26px; background: var(--bg-1);
  display: flex; flex-direction: column;
  min-height: 220px; position: relative; overflow: hidden; text-decoration: none; color: inherit;
  transition: border-color 0.25s, box-shadow 0.3s, background 0.25s;
}
.card-shine {
  position: absolute; inset: 0; opacity: 0; pointer-events: none;
  background: radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklch, var(--blue) 14%, transparent), transparent 45%);
  transition: opacity 0.35s;
}
.action-card:hover .card-shine { opacity: 1; }
.action-card:hover {
  border-color: var(--line-2);
  background: var(--bg-2);
  box-shadow: 0 16px 48px color-mix(in oklch, var(--bg-0) 50%, transparent), 0 0 0 1px color-mix(in oklch, var(--line-2) 50%, transparent);
}
.action-card.primary {
  background: linear-gradient(135deg, color-mix(in oklch, var(--blue-bg) 75%, var(--bg-1)) 0%, color-mix(in oklch, var(--red-bg) 55%, var(--bg-1)) 100%);
  border-color: var(--line-2);
}
.action-card.primary .card-shine {
  background: radial-gradient(480px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklch, var(--gold) 12%, transparent), transparent 50%);
}
.action-card .num { font-family: 'JetBrains Mono'; font-size: 11px; color: var(--fg-3); letter-spacing: 0.1em; position: relative; z-index: 1; }
.action-card h3 { white-space: pre-line; font-family: 'Space Grotesk'; font-size: 26px; font-weight: 600; letter-spacing: -0.02em; margin: 18px 0 10px; position: relative; z-index: 1; }
.action-card.primary h3 { font-size: 36px; }
.action-card p { color: var(--fg-2); font-size: 13.5px; line-height: 1.55; margin: 0 0 20px; flex: 1; position: relative; z-index: 1; }
.action-card .cta-row {
  display: flex; align-items: center; justify-content: space-between; color: var(--fg-1); font-size: 13px;
  border-top: 1px solid var(--line); padding-top: 16px; position: relative; z-index: 1;
}
.action-card .cta-row .arr {
  width: 28px; height: 28px; border-radius: 50%; background: var(--bg-2); display: grid; place-items: center;
  transition: background 0.15s, transform 0.2s;
}
.action-card:hover .cta-row .arr { background: var(--fg-0); color: var(--bg-0); transform: translateX(3px); }
.action-card.primary .cta-row .arr { background: var(--fg-0); color: var(--bg-0); }
.action-card .glyph {
  position: absolute; right: -10px; top: -10px; width: 90px; height: 90px; border-radius: 50%;
  opacity: 0.35; transition: opacity 0.35s, transform 0.35s; filter: blur(2px);
}
.action-card:hover .glyph { opacity: 0.7; transform: scale(1.2); }
.action-card.players .glyph { background: radial-gradient(circle, var(--r-mid) 0%, transparent 70%); }
.action-card.new .glyph { background: radial-gradient(circle, var(--r-jng) 0%, transparent 70%); }
.action-card.match .glyph { background: radial-gradient(circle, var(--r-top) 0%, transparent 70%); }

@keyframes breathe {
  0%, 100% { opacity: 0.32; transform: scale(1) translateY(0); }
  50% { opacity: 0.48; transform: scale(1.06) translateY(-8px); }
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 4px color-mix(in oklch, currentColor 18%, transparent); }
  50% { box-shadow: 0 0 0 10px color-mix(in oklch, currentColor 6%, transparent), 0 0 20px color-mix(in oklch, currentColor 30%, transparent); }
}
@keyframes vs-glow {
  0%, 100% { box-shadow: 0 0 24px color-mix(in oklch, var(--fg-2) 10%, transparent); }
  50% { box-shadow: 0 0 40px color-mix(in oklch, var(--blue) 18%, transparent), 0 0 40px color-mix(in oklch, var(--red) 18%, transparent); }
}
@keyframes beam-drift {
  0%, 100% { transform: translateY(0); opacity: 0.25; }
  50% { transform: translateY(12px); opacity: 0.45; }
}
@keyframes ring-spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-glow, .pulse-blue, .pulse-red, .vs-badge, .vs-ring, .hero-beam { animation: none !important; }
}

@media (max-width: 1024px) {
  .v1-split { grid-template-columns: 1fr; }
  .v1-vs { display: none; }
  .v1-side.blue { text-align: left; }
  .v1-meta { grid-template-columns: 1fr 1fr; }
  .v1-actions { grid-template-columns: 1fr 1fr; padding-top: 28px; }
  .hero-beam { display: none; }
}
@media (max-width: 768px) {
  .container { padding: 0 20px; }
  .v1-side { padding: 38px 24px 32px; }
  .v1-meta .cell { padding: 16px 18px; }
  .v1-actions { grid-template-columns: 1fr; padding-bottom: 56px; }
}
`
