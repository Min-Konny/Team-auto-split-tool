import { motion, useReducedMotion } from 'framer-motion'
import { SplitCandidate, SplitMode } from '@/lib/teamBalancer'

const MODE_META: Record<
  SplitMode,
  { title: string; desc: string; accent: 'blue' | 'neutral' | 'red' }
> = {
  party_balance: {
    title: 'パーティー',
    desc: '同じパーティのメンバーが片側に偏らないよう調整します。',
    accent: 'blue',
  },
  rate_equal: {
    title: 'レート均等',
    desc: 'BLUE / RED の合計レート差が最小になる組み合わせを選びます。',
    accent: 'neutral',
  },
  random: {
    title: 'ランダム',
    desc: 'バランスの良い候補の中からランダムに1パターンを選びます。',
    accent: 'red',
  },
}

type Props = {
  candidates: SplitCandidate[]
  open: boolean
  onPick: (index: number) => void
  onClose: () => void
}

const ease = [0.22, 1, 0.36, 1] as const

export default function SplitModePickerModal({ candidates, open, onPick, onClose }: Props) {
  const reduced = useReducedMotion()

  if (!open) return null

  return (
    <div className="mode-overlay" role="dialog" aria-modal="true" aria-labelledby="split-mode-title">
      <motion.div
        className="mode-modal"
        initial={reduced ? false : { opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease }}
      >
        <div className="mode-hd">
          <div>
            <p className="mode-kicker">126 patterns explored</p>
            <h2 id="split-mode-title">分け方を選んでください</h2>
            <p className="mode-lead">3つの方式から1つ選ぶとチーム構成を表示します。</p>
          </div>
          <button type="button" className="mode-close" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>

        <div className="mode-grid">
          {candidates.map((c, i) => {
            const meta = MODE_META[c.mode]
            return (
              <motion.button
                key={c.mode}
                type="button"
                className={`mode-card accent-${meta.accent}`}
                onClick={() => onPick(i)}
                initial={reduced ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.07, duration: 0.4, ease }}
                whileHover={reduced ? undefined : { y: -4 }}
                whileTap={reduced ? undefined : { scale: 0.98 }}
              >
                <span className="mode-card-title">{meta.title}</span>
                <span className="mode-card-desc">{meta.desc}</span>
                <span className="mode-card-score">
                  バランス <strong>{c.metrics.balanceScore}</strong>
                  <span className="mode-card-sub">/ 100</span>
                </span>
                <span className="mode-card-cta">この方式で分ける →</span>
              </motion.button>
            )
          })}
        </div>
        <p className="mode-footnote">※ チーム表示後もプレイヤーを2回クリックして入れ替えできます</p>
      </motion.div>
      <style dangerouslySetInnerHTML={{ __html: modeStyles }} />
    </div>
  )
}

const modeStyles = `
.mode-overlay{position:fixed;inset:0;z-index:110;background:color-mix(in oklch,var(--bg-0) 88%,transparent);backdrop-filter:blur(10px);display:grid;place-items:center;padding:24px}
.mode-modal{width:min(720px,100%);background:var(--bg-1);border:1px solid var(--line);border-radius:16px;padding:28px;box-shadow:0 32px 64px color-mix(in oklch,#000 40%,transparent)}
.mode-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px}
.mode-kicker{margin:0 0 6px;font-family:'JetBrains Mono';font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--fg-3)}
.mode-hd h2{margin:0;font-family:'Space Grotesk';font-size:22px;font-weight:700}
.mode-lead{margin:8px 0 0;font-size:13px;color:var(--fg-2);line-height:1.5}
.mode-close{flex-shrink:0;width:36px;height:36px;border-radius:9px;border:1px solid var(--line);background:transparent;color:var(--fg-2);cursor:pointer;font-size:14px}
.mode-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.mode-card{display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:20px 18px;border-radius:14px;border:1px solid var(--line);background:var(--bg-0);cursor:pointer;color:inherit;transition:border-color .2s,box-shadow .2s}
.mode-card.accent-blue:hover{border-color:color-mix(in oklch,var(--blue) 55%,var(--line));box-shadow:0 8px 28px color-mix(in oklch,var(--blue) 12%,transparent)}
.mode-card.accent-neutral:hover{border-color:var(--fg-2);box-shadow:0 8px 28px color-mix(in oklch,var(--fg-0) 8%,transparent)}
.mode-card.accent-red:hover{border-color:color-mix(in oklch,var(--red) 55%,var(--line));box-shadow:0 8px 28px color-mix(in oklch,var(--red) 12%,transparent)}
.mode-card-title{font-family:'Space Grotesk';font-size:18px;font-weight:700;margin-bottom:8px}
.mode-card-desc{font-size:12px;color:var(--fg-2);line-height:1.55;margin-bottom:16px;flex:1}
.mode-card-score{font-family:'JetBrains Mono';font-size:11px;color:var(--fg-3);margin-bottom:14px}
.mode-card-score strong{font-size:20px;color:var(--fg-0);margin:0 4px}
.mode-card-sub{font-size:10px}
.mode-card-cta{font-family:'Space Grotesk';font-size:12px;font-weight:600;color:var(--fg-1)}
.mode-card.accent-blue .mode-card-cta{color:var(--blue)}
.mode-card.accent-red .mode-card-cta{color:var(--red)}
.mode-footnote{margin:16px 0 0;font-size:11px;color:var(--fg-3);text-align:center;line-height:1.5}
@media(max-width:720px){.mode-grid{grid-template-columns:1fr}}
`
