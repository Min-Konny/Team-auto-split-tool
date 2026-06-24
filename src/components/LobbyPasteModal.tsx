import { useMemo, useState } from 'react'
import { Member } from '@/types/member'
import {
  matchPasteLines,
  parseLobbyJoinLines,
  PasteLineResult,
  resolvedPlayerIds,
} from '@/lib/lobbyPaste'

type Props = {
  members: Member[]
  open: boolean
  onClose: () => void
  onApply: (playerIds: string[]) => void
}

const EXAMPLE_PLACEHOLDER = `⁦⁦こにー⁩ #⁦0329⁩⁩がロビーに参加しました。
⁦⁦たろう⁩ #⁦1234⁩⁩がロビーに参加しました。`

export default function LobbyPasteModal({ members, open, onClose, onApply }: Props) {
  const [text, setText] = useState('')
  const [ambiguousPicks, setAmbiguousPicks] = useState<Record<number, string>>({})
  const [step, setStep] = useState<'paste' | 'review'>('paste')

  const lines = useMemo(() => parseLobbyJoinLines(text), [text])
  const results: PasteLineResult[] = useMemo(
    () => (step === 'review' ? matchPasteLines(lines, members) : []),
    [step, lines, members]
  )

  const matchedCount = results.filter((r) => r.status === 'matched').length
  const ambiguousCount = results.filter((r) => r.status === 'ambiguous').length
  const unmatchedCount = results.filter((r) => r.status === 'unmatched').length

  const canApply = useMemo(() => {
    if (step !== 'review') return false
    const allAmbiguousResolved = results.every((r, i) => {
      if (r.status !== 'ambiguous') return true
      return !!ambiguousPicks[i]
    })
    return allAmbiguousResolved && resolvedPlayerIds(results, ambiguousPicks).length > 0
  }, [step, results, ambiguousPicks])

  const handleParse = () => {
    if (lines.length === 0) return
    setAmbiguousPicks({})
    setStep('review')
  }

  const handleApply = () => {
    const ids = resolvedPlayerIds(results, ambiguousPicks)
    onApply(ids)
    setText('')
    setStep('paste')
    setAmbiguousPicks({})
    onClose()
  }

  const handleClose = () => {
    setText('')
    setStep('paste')
    setAmbiguousPicks({})
    onClose()
  }

  if (!open) return null

  return (
    <div className="paste-overlay" role="dialog" aria-modal="true">
      <div className="paste-modal">
        <div className="paste-hd">
          <h3>カスタム入室ログから追加</h3>
          <button type="button" className="paste-close" onClick={handleClose} aria-label="閉じる">
            ✕
          </button>
        </div>
        <p className="paste-hint">
          LoL クライアントのカスタムロビーで表示される
          <strong>「〇〇がロビーに参加しました。」</strong>
          をそのまま貼り付けてください。サモナー名を自動で抽出します。
        </p>

        {step === 'paste' && (
          <>
            <textarea
              className="paste-area"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={EXAMPLE_PLACEHOLDER}
              rows={8}
            />
            <div className="paste-actions">
              <button type="button" className="paste-btn ghost" onClick={handleClose}>
                キャンセル
              </button>
              <button type="button" className="paste-btn primary" disabled={lines.length === 0} onClick={handleParse}>
                照合する ({lines.length} 人)
              </button>
            </div>
          </>
        )}

        {step === 'review' && (
          <>
            <div className="paste-summary">
              <span className="ok">一致 {matchedCount}</span>
              {ambiguousCount > 0 && <span className="warn">要選択 {ambiguousCount}</span>}
              {unmatchedCount > 0 && <span className="bad">不明 {unmatchedCount}</span>}
            </div>
            <ul className="paste-results">
              {results.map((r, i) => (
                <li key={`${r.raw}-${i}`} className={`paste-row ${r.status}`}>
                  <span className="paste-raw">{r.normalized}</span>
                  {r.status === 'matched' && r.player && (
                    <span className="paste-res ok">→ {r.player.nickname || r.player.name}</span>
                  )}
                  {r.status === 'ambiguous' && r.candidates && (
                    <select
                      className="paste-select"
                      value={ambiguousPicks[i] || ''}
                      onChange={(e) => setAmbiguousPicks((p) => ({ ...p, [i]: e.target.value }))}
                    >
                      <option value="">選択…</option>
                      {r.candidates.map((c) => (
                        <option key={c.id} value={c.id!}>
                          {c.nickname || c.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {r.status === 'unmatched' && <span className="paste-res bad">見つかりません</span>}
                </li>
              ))}
            </ul>
            <div className="paste-actions">
              <button type="button" className="paste-btn ghost" onClick={() => setStep('paste')}>
                戻る
              </button>
              <button type="button" className="paste-btn primary" disabled={!canApply} onClick={handleApply}>
                ロビーに追加
              </button>
            </div>
          </>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: pasteStyles }} />
    </div>
  )
}

const pasteStyles = `
.paste-overlay{position:fixed;inset:0;z-index:200;background:color-mix(in oklch,#000 55%,transparent);display:grid;place-items:center;padding:20px}
.paste-modal{width:min(520px,100%);background:var(--bg-1);border:1px solid var(--line);border-radius:14px;padding:20px;box-shadow:0 24px 48px color-mix(in oklch,#000 35%,transparent)}
.paste-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.paste-hd h3{margin:0;font-family:'Space Grotesk';font-size:17px}
.paste-close{width:32px;height:32px;border-radius:8px;border:1px solid var(--line);background:transparent;color:var(--fg-2);cursor:pointer}
.paste-hint{margin:0 0 12px;font-size:12px;color:var(--fg-3);line-height:1.5}
.paste-hint strong{color:var(--fg-1);font-weight:600}
.paste-area{width:100%;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--bg-0);color:var(--fg-0);font-family:'JetBrains Mono',monospace;font-size:12px;resize:vertical}
.paste-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}
.paste-btn{padding:9px 18px;border-radius:9px;font-family:'Space Grotesk';font-weight:600;font-size:13px;cursor:pointer;border:1px solid var(--line)}
.paste-btn.ghost{background:transparent;color:var(--fg-1)}
.paste-btn.primary{background:var(--fg-0);color:var(--bg-0);border-color:var(--fg-0)}
.paste-btn:disabled{opacity:.35;cursor:not-allowed}
.paste-summary{display:flex;gap:12px;font-family:'JetBrains Mono';font-size:11px;margin-bottom:10px}
.paste-summary .ok{color:var(--ok)}.paste-summary .warn{color:var(--warn)}.paste-summary .bad{color:var(--red)}
.paste-results{list-style:none;margin:0;padding:0;max-height:240px;overflow-y:auto}
.paste-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px}
.paste-raw{font-weight:600;color:var(--fg-0)}
.paste-res.ok{color:var(--ok)}.paste-res.bad{color:var(--red)}
.paste-select{padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--bg-0);color:var(--fg-0);font-size:12px}
`
