import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { GameRole } from '@/types'
import { Member } from '@/types/member'
import { getEffectiveElo, ROLE_TIER_LABEL } from '@/lib/roleTier'
import {
  getAvgRate,
  getTotalRate,
  SplitCandidate,
  SplitMode,
  Teams,
} from '@/lib/teamBalancer'
import { formatTeamsForChat } from '@/lib/teamClipboard'

const ROLES: GameRole[] = [GameRole.TOP, GameRole.JUNGLE, GameRole.MID, GameRole.ADC, GameRole.SUP]
const LANE_DIFF_TOLERANCE = 500

const MODE_LABEL: Record<SplitMode, string> = {
  party_balance: 'パーティー',
  rate_equal: 'レート均等',
  random: 'ランダム',
}

const SWAP_HINT_KEY = 'team_maker_swap_hint_v1'

const ease = [0.22, 1, 0.36, 1] as const

type Props = {
  teams: Teams
  candidates: SplitCandidate[]
  activeCandidate: number
  revealKey: number
  shuffling: boolean
  swapSource: { team: 'blue' | 'red'; idx: number; id: string } | null
  result: 'BLUE' | 'RED' | null
  registering: boolean
  registerError: string | null
  onClose: () => void
  onRegenerate: () => void
  onPickCandidate: (index: number) => void
  onSwapClick: (team: 'blue' | 'red', idx: number) => void
  onSwapCancel: () => void
  onRegister: (winner: 'BLUE' | 'RED') => void
}

function byRole(teams: Teams, team: 'blue' | 'red', role: GameRole) {
  const idx = teams[team].findIndex((t) => t.role === role)
  return { tp: idx >= 0 ? teams[team][idx] : undefined, idx }
}

const tierLabel = (m: Member, r: GameRole) => ROLE_TIER_LABEL[m.roles[r]]

export default function TeamSplitOverlay({
  teams,
  candidates,
  activeCandidate,
  revealKey,
  shuffling,
  swapSource,
  result,
  registering,
  registerError,
  onClose,
  onRegenerate,
  onPickCandidate,
  onSwapClick,
  onSwapCancel,
  onRegister,
}: Props) {
  const reduced = useReducedMotion()
  const [showSwapHint, setShowSwapHint] = useState(false)
  const [copied, setCopied] = useState(false)
  const activeMetrics = candidates[activeCandidate]?.metrics
  const totalDiff = Math.abs(getTotalRate(teams.blue) - getTotalRate(teams.red))

  useEffect(() => {
    if (shuffling) return
    try {
      setShowSwapHint(localStorage.getItem(SWAP_HINT_KEY) !== '1')
    } catch {
      setShowSwapHint(true)
    }
  }, [shuffling, revealKey])

  const dismissSwapHint = () => {
    setShowSwapHint(false)
    try {
      localStorage.setItem(SWAP_HINT_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const handleSwapClick = (team: 'blue' | 'red', idx: number) => {
    if (showSwapHint) dismissSwapHint()
    onSwapClick(team, idx)
  }

  const copyTeamsToChat = async () => {
    try {
      await navigator.clipboard.writeText(formatTeamsForChat(teams))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error(e)
    }
  }

  const cardMotion = (side: 'blue' | 'red', i: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, x: side === 'blue' ? -72 : 72, scale: 0.92 },
          animate: { opacity: 1, x: 0, scale: 1 },
          transition: { delay: 0.12 + i * 0.07, duration: 0.55, ease },
        }

  return (
    <motion.div
      className="overlay"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduced ? undefined : { opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        className="split-flash"
        aria-hidden
        initial={reduced ? false : { scaleY: 0, opacity: 0.8 }}
        animate={{ scaleY: 1, opacity: 0 }}
        transition={{ duration: 0.65, ease }}
      />

      <AnimatePresence>
        {shuffling && !reduced && (
          <motion.div
            className="shuffle-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="shuffle-vs">VS</div>
            <div className="shuffle-bars">
              <span className="shuffle-bar blue" />
              <span className="shuffle-bar red" />
            </div>
            <p className="shuffle-text">126 patterns · balancing…</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`overlay-content${shuffling ? ' is-shuffling' : ''}`}>
        <div className="ov-hd">
          <h2>チーム構成</h2>
          <span className="ov-help">プレイヤーを2回クリックで入れ替え</span>
          <div className="ov-actions">
            <button type="button" className="copy-btn" onClick={copyTeamsToChat} disabled={shuffling}>
              {copied ? 'コピー済' : 'チャット用コピー'}
            </button>
            <button type="button" className="regen-btn" onClick={onRegenerate}>
              再生成
            </button>
            <button type="button" className="icon-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="cand-tabs-wrap">
          <span className="cand-tabs-label">分け方を変更</span>
          <div className="cand-tabs">
            {candidates.map((c, i) => (
              <button
                key={c.mode}
                type="button"
                className={`cand-tab${activeCandidate === i ? ' active' : ''}`}
                onClick={() => onPickCandidate(i)}
              >
                {MODE_LABEL[c.mode]} <span className="cand-sc">{c.metrics.balanceScore}</span>
              </button>
            ))}
          </div>
        </div>

        {candidates[activeCandidate]?.reasons && (
          <motion.div
            className="cand-reasons"
            key={`reasons-${revealKey}`}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            {candidates[activeCandidate].reasons.map((r) => (
              <span key={r} className="cand-reason-chip">
                {r}
              </span>
            ))}
            <span className="cand-reason-chip">BLUE勝率目安 {activeMetrics?.blueWinChance ?? 50}%</span>
          </motion.div>
        )}

        <motion.div
          className="ov-stats"
          key={`stats-${revealKey}`}
          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.45, ease }}
        >
          <div className="ov-stat-side">
            <div className="stat-block">
              <motion.div
                className="sv blue"
                key={`bavg-${getAvgRate(teams.blue)}`}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
              >
                {getAvgRate(teams.blue)}
              </motion.div>
              <div className="sk">Blue avg rate</div>
            </div>
            <div className="stat-block">
              <div className="sv sub">{getTotalRate(teams.blue)}</div>
              <div className="sk">Total</div>
            </div>
          </div>
          <div className="ov-stat-mid">
            <div className="total-diff">
              <motion.div
                className={`td-n ${totalDiff > LANE_DIFF_TOLERANCE ? 'warn' : 'ok'}`}
                key={`diff-${totalDiff}-${revealKey}`}
                initial={reduced ? false : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.55, type: 'spring', stiffness: 260, damping: 18 }}
              >
                Δ{totalDiff}
              </motion.div>
              <div className="td-k">total diff</div>
            </div>
          </div>
          <div className="ov-stat-side right">
            <div className="stat-block right">
              <div className="sv sub">{getTotalRate(teams.red)}</div>
              <div className="sk">Total</div>
            </div>
            <div className="stat-block right">
              <motion.div
                className="sv red"
                key={`ravg-${getAvgRate(teams.red)}`}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
              >
                {getAvgRate(teams.red)}
              </motion.div>
              <div className="sk">Red avg rate</div>
            </div>
          </div>
        </motion.div>

        <div className="ov-body">
          <AnimatePresence>
            {showSwapHint && !swapSource && !shuffling && (
              <motion.div
                className="swap-hint-banner"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <div className="swap-hint-icon" aria-hidden>
                  ↔
                </div>
                <div className="swap-hint-text">
                  <strong>手動でチーム・ロールを調整できます</strong>
                  <p>
                    1人目のプレイヤーをクリック → 入れ替え先をクリック。
                    BLUE / RED のチーム変更や、別ロールへの移動ができます。
                  </p>
                </div>
                <button type="button" className="swap-hint-ok" onClick={dismissSwapHint}>
                  了解
                </button>
              </motion.div>
            )}
            {swapSource && (
              <motion.div
                className="swap-banner"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <span className="swap-banner-step">STEP 2</span>
                <span>
                  <strong>
                    {teams[swapSource.team][swapSource.idx].member.nickname ||
                      teams[swapSource.team][swapSource.idx].member.name}
                  </strong>{' '}
                  を選択中 — 入れ替え先をクリック
                </span>
                <button type="button" className="swap-cancel" onClick={onSwapCancel}>
                  キャンセル
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {ROLES.map((role, i) => {
            const { tp: bTp, idx: bIdx } = byRole(teams, 'blue', role)
            const { tp: rTp, idx: rIdx } = byRole(teams, 'red', role)
            const diff =
              bTp && rTp ? Math.abs(getEffectiveElo(bTp.member, role) - getEffectiveElo(rTp.member, role)) : 0
            const isWarn = diff > LANE_DIFF_TOLERANCE
            const isSrcBlue = swapSource?.team === 'blue' && swapSource?.id === bTp?.member.id
            const isSrcRed = swapSource?.team === 'red' && swapSource?.id === rTp?.member.id

            return (
              <div className="role-row" key={`${revealKey}-${role}`}>
                <motion.div
                  className={`rr-card blue-card${isSrcBlue ? ' is-source' : ''}${swapSource && !isSrcBlue ? ' is-target' : ''}${showSwapHint && !swapSource ? ' swap-hint-pulse' : ''}`}
                  layout={!reduced}
                  {...cardMotion('blue', i)}
                  onClick={() => bIdx >= 0 && handleSwapClick('blue', bIdx)}
                  title="クリックで選択・入れ替え"
                >
                  <span className="rr-swap-icon" aria-hidden>
                    ↔
                  </span>
                  <div className="rr-info">
                    <div className="rr-line1">
                      <span className="rr-name">{bTp?.member.nickname || bTp?.member.name || '—'}</span>
                      <span className="rr-sub">{bTp ? tierLabel(bTp.member, role) : ''}</span>
                    </div>
                    <div className="rr-line2">
                      <span className="rr-rate blue">{bTp ? getEffectiveElo(bTp.member, role) : '-'}</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="rr-center"
                  initial={reduced ? false : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.18 + i * 0.07, duration: 0.4, ease }}
                >
                  <div className={`rr-role-btn ${role}`}>{role}</div>
                  <div className={`rr-diff ${isWarn ? 'warn' : 'ok'}`}>Δ {diff}</div>
                </motion.div>

                <motion.div
                  className={`rr-card red-card${isSrcRed ? ' is-source' : ''}${swapSource && !isSrcRed ? ' is-target' : ''}${showSwapHint && !swapSource ? ' swap-hint-pulse' : ''}`}
                  layout={!reduced}
                  {...cardMotion('red', i)}
                  onClick={() => rIdx >= 0 && handleSwapClick('red', rIdx)}
                  title="クリックで選択・入れ替え"
                >
                  <span className="rr-swap-icon" aria-hidden>
                    ↔
                  </span>
                  <div className="rr-info">
                    <div className="rr-line1">
                      <span className="rr-sub">{rTp ? tierLabel(rTp.member, role) : ''}</span>
                      <span className="rr-name">{rTp?.member.nickname || rTp?.member.name || '—'}</span>
                    </div>
                    <div className="rr-line2">
                      <span className="rr-rate red">{rTp ? getEffectiveElo(rTp.member, role) : '-'}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            )
          })}
        </div>

        <div className="result-bar">
          <span className="res-lbl">結果登録:</span>
          {registerError && <span className="reg-error">{registerError}</span>}
          <motion.button
            type="button"
            className={`win-btn blue ${result === 'BLUE' ? 'won-blue' : ''}`}
            onClick={() => onRegister('BLUE')}
            disabled={registering || result !== null}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            animate={result === 'BLUE' && !reduced ? { scale: [1, 1.04, 1] } : undefined}
            transition={{ duration: 0.35 }}
          >
            {registering ? '登録中…' : result === 'BLUE' ? '✓ BLUE WIN' : 'BLUE WIN'}
          </motion.button>
          <motion.button
            type="button"
            className={`win-btn red ${result === 'RED' ? 'won-red' : ''}`}
            onClick={() => onRegister('RED')}
            disabled={registering || result !== null}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            animate={result === 'RED' && !reduced ? { scale: [1, 1.04, 1] } : undefined}
            transition={{ duration: 0.35 }}
          >
            {registering ? '登録中…' : result === 'RED' ? '✓ RED WIN' : 'RED WIN'}
          </motion.button>
          <a className="draft-btn" href="https://draftlol.dawe.gg/" target="_blank" rel="noopener noreferrer">
            Draft Tool
          </a>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: overlayAnimCss }} />
    </motion.div>
  )
}

const overlayAnimCss = `
.split-flash {
  position: absolute; left: 50%; top: 0; bottom: 0; width: 3px; z-index: 200;
  transform-origin: center top;
  background: linear-gradient(180deg, transparent, var(--fg-0), transparent);
  pointer-events: none;
}
.shuffle-layer {
  position: absolute; inset: 0; z-index: 150;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: color-mix(in oklch, var(--bg-0) 92%, transparent);
  backdrop-filter: blur(6px);
}
.shuffle-vs {
  font-family: 'Space Grotesk'; font-weight: 700; font-size: 48px; letter-spacing: 0.12em;
  color: var(--fg-2);
  animation: shuffle-pulse 0.8s ease-in-out infinite;
}
.shuffle-bars {
  display: flex; gap: 48px; margin-top: 28px; height: 120px; align-items: flex-end;
}
.shuffle-bar {
  width: 8px; border-radius: 4px;
  animation: shuffle-bar 0.55s ease-in-out infinite alternate;
}
.shuffle-bar.blue { background: var(--blue); height: 40%; animation-delay: 0s; }
.shuffle-bar.red { background: var(--red); height: 55%; animation-delay: 0.15s; }
.shuffle-text {
  margin-top: 24px; font-family: 'JetBrains Mono'; font-size: 11px;
  color: var(--fg-3); letter-spacing: 0.14em; text-transform: uppercase;
}
.overlay-content { display: flex; flex-direction: column; flex: 1; min-height: 0; transition: opacity 0.25s; }
.overlay-content.is-shuffling { opacity: 0.15; pointer-events: none; }
@keyframes shuffle-pulse {
  0%, 100% { text-shadow: 0 0 20px color-mix(in oklch, var(--blue) 20%, transparent); }
  50% { text-shadow: 0 0 40px color-mix(in oklch, var(--red) 25%, transparent); }
}
@keyframes shuffle-bar {
  from { transform: scaleY(0.4); opacity: 0.5; }
  to { transform: scaleY(1.2); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .split-flash, .shuffle-vs, .shuffle-bar, .swap-hint-pulse { animation: none !important; }
}
.swap-hint-banner {
  display: flex; align-items: flex-start; gap: 14px;
  margin-bottom: 12px; padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid color-mix(in oklch, var(--blue) 35%, var(--line));
  background: color-mix(in oklch, var(--blue) 8%, var(--bg-1));
}
.swap-hint-icon {
  flex-shrink: 0; width: 36px; height: 36px; border-radius: 9px;
  display: grid; place-items: center;
  font-size: 18px; font-weight: 700; color: var(--blue);
  background: color-mix(in oklch, var(--blue) 12%, transparent);
}
.swap-hint-text { flex: 1; min-width: 0; }
.swap-hint-text strong { display: block; font-family: 'Space Grotesk'; font-size: 14px; margin-bottom: 4px; }
.swap-hint-text p { margin: 0; font-size: 12px; color: var(--fg-2); line-height: 1.55; }
.swap-hint-ok {
  flex-shrink: 0; padding: 8px 14px; border-radius: 8px; border: 0;
  background: var(--fg-0); color: var(--bg-0);
  font-family: 'Space Grotesk'; font-weight: 600; font-size: 12px; cursor: pointer;
}
.swap-banner-step {
  flex-shrink: 0; font-family: 'JetBrains Mono'; font-size: 10px; letter-spacing: .1em;
  padding: 2px 8px; border-radius: 4px;
  background: color-mix(in oklch, var(--gold) 20%, transparent);
  color: var(--gold);
}
.rr-swap-icon {
  flex-shrink: 0; width: 28px; height: 28px; border-radius: 7px;
  display: grid; place-items: center;
  font-size: 14px; font-weight: 700; color: var(--fg-3);
  background: var(--bg-0); border: 1px solid var(--line);
  opacity: 0; transition: opacity .15s;
}
.rr-card:hover .rr-swap-icon, .rr-card.is-source .rr-swap-icon, .rr-card.is-target .rr-swap-icon { opacity: 1; }
.rr-card.swap-hint-pulse .rr-swap-icon { opacity: 1; color: var(--blue); border-color: color-mix(in oklch, var(--blue) 40%, var(--line)); }
@keyframes swap-hint-pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in oklch, var(--blue) 0%, transparent); }
  50% { box-shadow: 0 0 0 3px color-mix(in oklch, var(--blue) 22%, transparent); }
}
.rr-card.swap-hint-pulse { animation: swap-hint-pulse 2s ease-in-out 3; cursor: pointer; }
`
