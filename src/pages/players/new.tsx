import { useState } from 'react'
import Link from 'next/link'
import { collection, addDoc } from 'firebase/firestore'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import { db } from '@/lib/firebase'
import { GameRole, Player, RANK_RATES, Rank } from '@/types'

const AVAILABLE_TAGS = ['249', 'SHIFT', 'きらくに', 'その他']
const ROLES: GameRole[] = [GameRole.TOP, GameRole.JUNGLE, GameRole.MID, GameRole.ADC, GameRole.SUP]
const ROLE_ICONS: Record<GameRole, string> = { TOP: '🗡', JUNGLE: '🌲', MID: '⚡', ADC: '🏹', SUP: '🛡' }

const RANK_COLORS: Record<Rank, string> = {
  CHALLENGER: 'var(--gold)',
  GRANDMASTER: 'var(--r-top)',
  MASTER: 'var(--r-adc)',
  DIAMOND: 'var(--blue)',
  EMERALD: 'oklch(0.74 0.18 155)',
  PLATINUM: 'oklch(0.72 0.15 180)',
  GOLD: 'var(--gold)',
  SILVER: '#a8a9ad',
  BRONZE: '#cd7f32',
  IRON: 'var(--fg-3)',
  UNRANKED: 'var(--fg-3)',
}

const getRankFromRate = (rate: number): Rank => {
  if (rate >= 3000) return 'CHALLENGER'
  if (rate >= 2700) return 'GRANDMASTER'
  if (rate >= 2500) return 'MASTER'
  if (rate >= 2200) return 'DIAMOND'
  if (rate >= 2000) return 'EMERALD'
  if (rate >= 1900) return 'PLATINUM'
  if (rate >= 1700) return 'GOLD'
  if (rate >= 1500) return 'SILVER'
  if (rate >= 1300) return 'BRONZE'
  if (rate >= 600) return 'IRON'
  return 'UNRANKED'
}

export default function NewPlayerPage() {
  const [name, setName] = useState('')
  const [nick, setNick] = useState('')
  const [role, setRole] = useState<GameRole | ''>('')
  const [rank, setRank] = useState<Rank>('GOLD')
  const [tags, setTags] = useState<string[]>([])
  const [unwanted, setUnwanted] = useState<GameRole[]>([])
  const [errors, setErrors] = useState<{ name?: string; role?: string; tags?: string }>({})
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const canSubmit = name.trim() && role && tags.length > 0

  const toggleTag = (t: string) => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  const toggleUnwanted = (r: GameRole) =>
    setUnwanted((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: { name?: string; role?: string; tags?: string } = {}
    if (!name.trim()) nextErrors.name = 'サモナーネームを入力してください'
    if (!role) nextErrors.role = 'メインロールを選択してください'
    if (tags.length === 0) nextErrors.tags = 'タグを1つ以上選択してください'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const rates = RANK_RATES[rank]
    const player: Omit<Player, 'id'> = {
      name: name.trim(),
      nickname: nick.trim() || undefined,
      mainRole: role as GameRole,
      mainRate: rates.main,
      subRate: rates.sub,
      stats: { wins: 0, losses: 0 },
      tags,
      ...(unwanted.length > 0 ? { unwantedRoles: unwanted } : {}),
    }

    await addDoc(collection(db, 'players'), player)
    setSaved(true)
    setTimeout(() => {
      router.push('/players')
    }, 650)
  }

  const rates = RANK_RATES[rank]

  return (
    <div>
      <Header />
      <main className="page">
        <section className="form-wrap">
          <div className="page-hd">
            <Link href="/players" className="back-link">← プレイヤー一覧へ</Link>
            <h1>プレイヤー登録</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <section className="fsec">
              <label className="fsec-lbl">サモナーネーム *</label>
              <input className="form-input" placeholder="FAKER#JP1" value={name} onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })) }} />
              {errors.name && <div className="err-msg">{errors.name}</div>}
            </section>

            <section className="fsec">
              <label className="fsec-lbl">ニックネーム</label>
              <input className="form-input" placeholder="こにー" value={nick} onChange={(e) => setNick(e.target.value)} />
              <div className="form-hint">設定するとリストや選択画面で優先表示されます</div>
            </section>

            <section className="fsec">
              <label className="fsec-lbl">メインロール *</label>
              <div className="role-grid">
                {ROLES.map((r) => (
                  <button key={r} type="button" className={`role-btn${role === r ? ` sel-${r}` : ''}`} onClick={() => { setRole(r); setErrors((p) => ({ ...p, role: undefined })) }}>
                    <span className="role-icon">{ROLE_ICONS[r]}</span>{r}
                  </button>
                ))}
              </div>
              {errors.role && <div className="err-msg">{errors.role}</div>}
            </section>

            <section className="fsec">
              <label className="fsec-lbl">ランク</label>
              <div className="rank-list">
                {(Object.keys(RANK_RATES) as Rank[]).map((r) => (
                  <div key={r} className={`rank-row${rank === r ? ' selected' : ''}`} onClick={() => setRank(r)}>
                    <span className="rank-name" style={{ color: RANK_COLORS[r] }}>{r}</span>
                    <span className="rank-rates-hint">M:{RANK_RATES[r].main} / S:{RANK_RATES[r].sub}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="fsec">
              <label className="fsec-lbl">タグ *</label>
              <div className="chip-row">
                {AVAILABLE_TAGS.map((t) => (
                  <button key={t} type="button" className={`chip${tags.includes(t) ? ' on-blue' : ''}`} onClick={() => { toggleTag(t); setErrors((p) => ({ ...p, tags: undefined })) }}>
                    {t}
                  </button>
                ))}
              </div>
              {errors.tags && <div className="err-msg">{errors.tags}</div>}
            </section>

            <section className="fsec">
              <label className="fsec-lbl">NGロール（任意）</label>
              <div className="chip-row">
                {ROLES.map((r) => (
                  <button key={r} type="button" className={`chip${unwanted.includes(r) ? ' on-red' : ''}`} onClick={() => toggleUnwanted(r)}>
                    {r}
                  </button>
                ))}
              </div>
              <div className="form-hint">絶対にやりたくないロール。チーム自動振り分け時に除外されます。</div>
            </section>

            <button className="submit-btn" type="submit" disabled={!canSubmit}>登録する</button>
          </form>
        </section>

        <aside className="preview-col">
          <div className="preview-lbl">プレビュー</div>
          <div className={`preview-card${name ? ' ready' : ''}`}>
            {name ? (
              <>
                <div className="pv-name">{nick || name}</div>
                {nick && <div className="pv-sub">{name}</div>}
                {role && <div className={`pv-role-badge ${role}`}>{role}</div>}
                <div className="pv-rates">
                  <div className="pv-rate-block">
                    <div className="pv-rate-k">MAIN</div>
                    <div className="pv-rate-v">{rates.main}</div>
                    <div className="pv-rank" style={{ color: RANK_COLORS[getRankFromRate(rates.main)] }}>{getRankFromRate(rates.main)}</div>
                  </div>
                  <div className="pv-rate-block">
                    <div className="pv-rate-k">SUB</div>
                    <div className="pv-rate-v">{rates.sub}</div>
                    <div className="pv-rank" style={{ color: RANK_COLORS[getRankFromRate(rates.sub)] }}>{getRankFromRate(rates.sub)}</div>
                  </div>
                </div>
                {tags.length > 0 && <div className="pv-tags">{tags.map((t) => <span className="pv-tag" key={t}>{t}</span>)}</div>}
                {unwanted.length > 0 && <div className="pv-tags">{unwanted.map((r) => <span className="pv-ng-chip" key={r}>{r}</span>)}</div>}
              </>
            ) : (
              <div className="pv-empty">入力するとここにプレビューされます</div>
            )}
          </div>
        </aside>
      </main>

      {saved && <div className="toast">保存しました</div>}

      <style dangerouslySetInnerHTML={{ __html: `
        .page { max-width: 1100px; margin: 0 auto; padding: 36px 28px 80px; display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
        .form-wrap { display: flex; flex-direction: column; gap: 12px; }
        .page-hd h1 { font-family: 'Space Grotesk'; font-size: 22px; font-weight: 600; letter-spacing: -0.02em; margin: 10px 0 4px; }
        .back-link { display: inline-flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono'; font-size: 11px; color: var(--fg-3); text-decoration: none; letter-spacing: 0.08em; }
        .fsec { background: var(--bg-1); border: 1px solid var(--line); border-radius: 13px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
        .fsec-lbl { font-family: 'JetBrains Mono'; font-size: 10px; letter-spacing: 0.14em; color: var(--fg-3); text-transform: uppercase; }
        .form-input { width: 100%; padding: 11px 14px; background: var(--bg-0); border: 1px solid var(--line); border-radius: 9px; color: var(--fg-0); font-size: 14px; outline: none; }
        .form-input:focus { border-color: var(--line-2); }
        .form-hint { font-size: 12px; color: var(--fg-3); }
        .err-msg { font-size: 12px; color: var(--red); font-family: 'JetBrains Mono'; }
        .role-grid { display: flex; gap: 8px; }
        .role-btn { flex: 1; padding: 10px 4px; border-radius: 9px; border: 1px solid var(--line); background: var(--bg-0); color: var(--fg-2); font-family: 'JetBrains Mono'; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; }
        .role-btn:hover { border-color: var(--line-2); color: var(--fg-1); }
        .role-btn .role-icon { font-size: 16px; display: block; margin-bottom: 4px; }
        .role-btn.sel-TOP { background: color-mix(in oklch, var(--r-top) 14%, var(--bg-0)); border-color: var(--r-top); color: var(--r-top); }
        .role-btn.sel-JUNGLE { background: color-mix(in oklch, var(--r-jng) 14%, var(--bg-0)); border-color: var(--r-jng); color: var(--r-jng); }
        .role-btn.sel-MID { background: color-mix(in oklch, var(--r-mid) 14%, var(--bg-0)); border-color: var(--r-mid); color: var(--r-mid); }
        .role-btn.sel-ADC { background: color-mix(in oklch, var(--r-adc) 14%, var(--bg-0)); border-color: var(--r-adc); color: var(--r-adc); }
        .role-btn.sel-SUP { background: color-mix(in oklch, var(--r-sup) 14%, var(--bg-0)); border-color: var(--r-sup); color: var(--r-sup); }
        .rank-list { display: flex; flex-direction: column; gap: 4px; }
        .rank-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 12px; border-radius: 8px; border: 1px solid transparent; background: var(--bg-0); cursor: pointer; }
        .rank-row:hover { border-color: var(--line); }
        .rank-row.selected { border-color: var(--line-2); background: var(--bg-2); }
        .rank-name { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600; }
        .rank-rates-hint { font-family: 'JetBrains Mono'; font-size: 10px; color: var(--fg-3); }
        .chip-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .chip { font-family: 'JetBrains Mono'; font-size: 11px; letter-spacing: 0.06em; padding: 7px 16px; border-radius: 999px; border: 1px solid var(--line); background: transparent; color: var(--fg-2); }
        .chip.on-blue { background: color-mix(in oklch, var(--blue) 18%, transparent); border-color: var(--blue-d); color: var(--blue); }
        .chip.on-red { background: color-mix(in oklch, var(--red) 14%, transparent); border-color: var(--red-d); color: var(--red); }
        .submit-btn { width: 100%; padding: 14px; border-radius: 11px; border: 0; background: var(--fg-0); color: var(--bg-0); font-family: 'Space Grotesk'; font-weight: 700; font-size: 15px; }
        .submit-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .preview-col { position: sticky; top: 90px; display: flex; flex-direction: column; gap: 14px; }
        .preview-lbl { font-family: 'JetBrains Mono'; font-size: 10px; letter-spacing: 0.14em; color: var(--fg-3); text-transform: uppercase; padding: 0 2px; }
        .preview-card { background: var(--bg-1); border: 1px solid var(--line); border-radius: 13px; padding: 20px; }
        .preview-card.ready { border-color: var(--line-2); }
        .pv-name { font-family: 'Space Grotesk'; font-size: 22px; font-weight: 600; letter-spacing: -0.02em; }
        .pv-sub { font-family: 'JetBrains Mono'; font-size: 11px; color: var(--fg-3); margin-top: 2px; }
        .pv-role-badge { display: inline-block; font-family: 'JetBrains Mono'; font-size: 10px; font-weight: 600; padding: 3px 0; border-radius: 5px; letter-spacing: 0.05em; width: 60px; text-align: center; background: var(--bg-2); margin-top: 12px; }
        .pv-role-badge.TOP { color: var(--r-top); border: 1px solid color-mix(in oklch, var(--r-top) 35%, transparent); }
        .pv-role-badge.JUNGLE { color: var(--r-jng); border: 1px solid color-mix(in oklch, var(--r-jng) 35%, transparent); }
        .pv-role-badge.MID { color: var(--r-mid); border: 1px solid color-mix(in oklch, var(--r-mid) 35%, transparent); }
        .pv-role-badge.ADC { color: var(--r-adc); border: 1px solid color-mix(in oklch, var(--r-adc) 35%, transparent); }
        .pv-role-badge.SUP { color: var(--r-sup); border: 1px solid color-mix(in oklch, var(--r-sup) 35%, transparent); }
        .pv-rates { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
        .pv-rate-block { background: var(--bg-0); border-radius: 9px; padding: 12px; }
        .pv-rate-k { font-family: 'JetBrains Mono'; font-size: 10px; letter-spacing: 0.1em; color: var(--fg-3); }
        .pv-rate-v { font-family: 'Space Grotesk'; font-size: 28px; font-weight: 600; letter-spacing: -0.03em; margin-top: 4px; }
        .pv-rank { font-family: 'JetBrains Mono'; font-size: 11px; margin-top: 2px; }
        .pv-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 14px; }
        .pv-tag { font-family: 'JetBrains Mono'; font-size: 10px; padding: 3px 10px; border-radius: 999px; background: color-mix(in oklch, var(--blue) 16%, transparent); border: 1px solid var(--blue-d); color: var(--blue); }
        .pv-ng-chip { font-family: 'JetBrains Mono'; font-size: 10px; padding: 2px 8px; border-radius: 4px; background: color-mix(in oklch, var(--red) 13%, transparent); border: 1px solid var(--red-d); color: var(--red); }
        .pv-empty { color: var(--fg-3); font-family: 'JetBrains Mono'; font-size: 12px; text-align: center; padding: 24px 0; }
        .toast { position: fixed; bottom: 24px; right: 24px; z-index: 200; background: var(--bg-2); border: 1px solid var(--ok); border-radius: 11px; padding: 14px 18px; color: var(--ok); font-size: 13px; }
        @media (max-width: 1000px) {
          .page { grid-template-columns: 1fr; }
          .preview-col { position: static; }
          .role-grid { flex-wrap: wrap; }
        }
      ` }} />
    </div>
  )
}
