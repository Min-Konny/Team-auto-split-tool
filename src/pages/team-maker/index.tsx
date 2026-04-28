import { useEffect, useMemo, useState } from 'react'
import Header from '@/components/Header'
import RoleBadge from '@/components/RoleBadge'
import { Timestamp, addDoc, collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { GameRole, Player, Rank } from '@/types'

type SelectedPlayer = { player: Player; unwantedRoles: GameRole[] }
type TeamSlot = { player: Player; role: GameRole }
type Teams = { blue: TeamSlot[]; red: TeamSlot[] }

const ROLES: GameRole[] = [GameRole.TOP, GameRole.JUNGLE, GameRole.MID, GameRole.ADC, GameRole.SUP]

const getRateForRole = (player: Player, role: GameRole): number =>
  role === player.mainRole ? player.mainRate : player.subRate

const getAvgRate = (team: TeamSlot[]) =>
  team.length ? Math.round(team.reduce((s, t) => s + getRateForRole(t.player, t.role), 0) / team.length) : 0

const getTotalRate = (team: TeamSlot[]) => team.reduce((s, t) => s + getRateForRole(t.player, t.role), 0)

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

const buildTeams = (selectedPlayers: SelectedPlayer[]): Teams => {
  const sorted = [...selectedPlayers].sort((a, b) => b.player.mainRate - a.player.mainRate)
  const bluePool = [0, 3, 4, 7, 8].map((i) => sorted[i])
  const redPool = [1, 2, 5, 6, 9].map((i) => sorted[i])

  const assignRoles = (pool: SelectedPlayer[]): TeamSlot[] => {
    const res: TeamSlot[] = pool.map((sp) => ({ player: sp.player, role: GameRole.TOP }))
    const used = new Set<GameRole>()
    const done = new Set<number>()

    pool.forEach((sp, i) => {
      const r = sp.player.mainRole
      if (!sp.unwantedRoles.includes(r) && !used.has(r)) {
        res[i].role = r
        used.add(r)
        done.add(i)
      }
    })

    const rem = ROLES.filter((r) => !used.has(r))
    pool.forEach((sp, i) => {
      if (done.has(i)) return
      const avail = rem.filter((r) => !sp.unwantedRoles.includes(r))
      const pick = avail[0] ?? rem[0] ?? sp.player.mainRole
      res[i].role = pick
      const idx = rem.indexOf(pick)
      if (idx >= 0) rem.splice(idx, 1)
    })
    return res
  }

  return { blue: assignRoles(bluePool), red: assignRoles(redPool) }
}

export default function TeamMakerPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selected, setSelected] = useState<SelectedPlayer[]>([])
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [tolerance, setTolerance] = useState(500)
  const [teams, setTeams] = useState<Teams | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const [result, setResult] = useState<'BLUE' | 'RED' | null>(null)
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const [swapSource, setSwapSource] = useState<{ team: 'blue' | 'red'; idx: number; id: string } | null>(null)

  useEffect(() => {
    const fetchPlayers = async () => {
      const snapshot = await getDocs(collection(db, 'players'))
      setPlayers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Player[])
    }
    fetchPlayers().catch(console.error)
  }, [])

  const availableTags = useMemo(() => Array.from(new Set(players.flatMap((p) => p.tags || []))).sort(), [players])

  const filtered = useMemo(
    () =>
      players.filter((p) => {
        const q = search.toLowerCase()
        const mSearch = (p.nickname || '').toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
        const mTag = selectedTags.length === 0 || selectedTags.some((t) => p.tags?.includes(t))
        return mSearch && mTag
      }),
    [players, search, selectedTags]
  )

  const isSelected = (id?: string) => selected.some((s) => s.player.id === id)

  const addPlayer = (player: Player) => {
    if (!player.id || selected.length >= 10 || isSelected(player.id)) return
    setSelected((prev) => [...prev, { player, unwantedRoles: [...(player.unwantedRoles || [])] }])
    setJustAdded(player.id)
    window.setTimeout(() => setJustAdded(null), 500)
  }

  const removePlayer = (idx: number) => setSelected((prev) => prev.filter((_, i) => i !== idx))

  const toggleUnwanted = (idx: number, role: GameRole) => {
    setSelected((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s
        const has = s.unwantedRoles.includes(role)
        return { ...s, unwantedRoles: has ? s.unwantedRoles.filter((r) => r !== role) : [...s.unwantedRoles, role] }
      })
    )
  }

  const createTeams = () => {
    if (selected.length < 10) return
    setTeams(buildTeams(selected))
    setResult(null)
    setSwapSource(null)
    setShowOverlay(true)
  }

  const totalDiff = useMemo(() => {
    if (!teams) return 0
    return Math.abs(getTotalRate(teams.blue) - getTotalRate(teams.red))
  }, [teams])

  const handleSwapClick = (team: 'blue' | 'red', idx: number) => {
    if (!teams) return
    const tp = teams[team][idx]
    if (!tp) return

    if (!swapSource) {
      setSwapSource({ team, idx, id: tp.player.id || '' })
      return
    }
    if (swapSource.team === team && swapSource.idx === idx) {
      setSwapSource(null)
      return
    }
    const next = { blue: [...teams.blue], red: [...teams.red] }
    const tmp = next[swapSource.team][swapSource.idx]
    next[swapSource.team][swapSource.idx] = next[team][idx]
    next[team][idx] = tmp
    setTeams(next)
    setSwapSource(null)
  }

  const byRole = (team: 'blue' | 'red', role: GameRole) => {
    if (!teams) return { tp: undefined as TeamSlot | undefined, idx: -1 }
    const idx = teams[team].findIndex((t) => t.role === role)
    return { tp: idx >= 0 ? teams[team][idx] : undefined, idx }
  }

  const registerMatch = async (winner: 'BLUE' | 'RED') => {
    if (!teams) return
    const payload = [
      ...teams.blue.map((p) => ({ playerId: p.player.id, role: p.role, team: 'BLUE' as const })),
      ...teams.red.map((p) => ({ playerId: p.player.id, role: p.role, team: 'RED' as const })),
    ]
    await addDoc(collection(db, 'matches'), { date: Timestamp.now(), players: payload, winner })
    await Promise.all(
      payload.map(async (p) => {
        const player = players.find((pl) => pl.id === p.playerId)
        if (!player || !p.playerId) return
        await updateDoc(doc(db, 'players', p.playerId), {
          'stats.wins': (player.stats?.wins || 0) + (p.team === winner ? 1 : 0),
          'stats.losses': (player.stats?.losses || 0) + (p.team === winner ? 0 : 1),
        })
      })
    )
    setResult(winner)
  }

  const remain = 10 - selected.length

  return (
    <div>
      <Header />
      <div className="page-layout">
        <section className="panel">
          <div className="panel-hd">
            <h2>プレイヤー</h2>
            <span className="count">{filtered.length} / {players.length}</span>
          </div>
          <div className="search-area">
            <div className="search-row">
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="名前で検索…" />
            </div>
            <div className="tag-row">
              {availableTags.map((tag) => (
                <button key={tag} className={`tag-chip${selectedTags.includes(tag) ? ' active' : ''}`} onClick={() => setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}>
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && <button className="tag-chip" onClick={() => setSelectedTags([])}>✕ 解除</button>}
            </div>
          </div>
          <div className="panel-body">
            {filtered.map((p) => (
              <div key={p.id} className={`pool-card${isSelected(p.id) ? ' pool-selected' : ''}${justAdded === p.id ? ' just-added' : ''}`} onClick={() => addPlayer(p)}>
                <RoleBadge role={p.mainRole} />
                <div className="card-info">
                  <div className="name">{p.nickname || p.name}</div>
                  {p.nickname && <div className="sub-name">{p.name}</div>}
                  <div className="rates">M <strong>{p.mainRate}</strong> <span className="dot">·</span> S <strong>{p.subRate}</strong> <span className="rank">{getRankFromRate(p.mainRate)}</span></div>
                </div>
                {!isSelected(p.id) ? (
                  <div className="add-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></div>
                ) : (
                  <div className="add-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg></div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="panel right-panel">
          <div className="panel-hd">
            <h2>選択中</h2>
            <span className="count" style={{ color: remain === 0 ? 'var(--ok)' : 'var(--fg-3)' }}>{selected.length} / 10</span>
          </div>
          <div className="panel-body">
            {selected.length === 0 && <div className="empty-msg">左のリストからプレイヤーを<br />クリックして選択（最大10人）</div>}
            {selected.map((sp, i) => (
              <div className="roster-slot" key={sp.player.id}>
                <div className="rs-row">
                  <span className="roster-num">{String(i + 1).padStart(2, '0')}</span>
                  <RoleBadge role={sp.player.mainRole} />
                  <div className="rs-name-block">
                    <div className="rs-pname">{sp.player.nickname || sp.player.name}</div>
                    {sp.player.nickname && <div className="rs-sname">{sp.player.name}</div>}
                  </div>
                  <div className="rs-rates"><span>M<strong>{sp.player.mainRate}</strong></span><span>S<strong>{sp.player.subRate}</strong></span></div>
                  <div className="rs-ng-row">
                    {ROLES.map((role) => (
                      <button key={role} className={`uw-btn${sp.unwantedRoles.includes(role) ? ' uw-on' : ''}`} onClick={() => toggleUnwanted(i, role)}>{role}</button>
                    ))}
                  </div>
                  <button className="remove-btn" onClick={() => removePlayer(i)}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
                </div>
              </div>
            ))}
            {selected.length > 0 &&
              Array.from({ length: Math.max(0, 10 - selected.length) }, (_, i) => (
                <div className="empty-slot" key={i}>{String(selected.length + i + 1).padStart(2, '0')} · プレイヤーを選択</div>
              ))}
          </div>
        </section>
      </div>

      <div className="action-footer">
        <div className="footer-inner">
          <div className="progress-wrap">
            <div className="prog-dots">{Array.from({ length: 10 }, (_, i) => <div key={i} className={`prog-dot${i < selected.length ? i < 5 ? ' blue' : ' red' : ''}`} />)}</div>
            <span className="prog-text"><span className="prog-n">{selected.length}/10</span>{remain > 0 ? <span className="prog-remain">— あと{remain}人</span> : <span className="ready">準備完了</span>}</span>
          </div>
          <div className="mode-toggle">
            <button className={`mode-btn${mode === 'auto' ? ' active' : ''}`} onClick={() => setMode('auto')}>ロール自動</button>
            <button className={`mode-btn${mode === 'manual' ? ' active' : ''}`} onClick={() => setMode('manual')}>手動</button>
          </div>
          <div className="tol-wrap"><span className="tol-lbl">許容差</span><input className="tol-input" type="number" min={0} max={1000} step={50} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value) || 0)} /></div>
          <div className="spacer" />
          {teams && !showOverlay && <button className="btn-ghost" onClick={() => setShowOverlay(true)}>チーム表示</button>}
          <button className="btn-primary" disabled={selected.length < 10} onClick={createTeams}>{selected.length < 10 ? `チーム作成 (${selected.length}/10)` : 'チーム作成'}</button>
        </div>
      </div>

      {showOverlay && teams && (
        <div className="overlay">
          <div className="ov-hd">
            <h2>チーム構成</h2>
            <span className="ov-help">クリックして選択 → 別プレイヤーをクリックして交代</span>
            <div className="ov-actions">
              <button className="regen-btn" onClick={() => { setTeams(buildTeams(selected)); setResult(null); setSwapSource(null) }}>再生成</button>
              <button className="icon-btn" onClick={() => setShowOverlay(false)}>✕</button>
            </div>
          </div>
          <div className="ov-stats">
            <div className="ov-stat-side">
              <div className="stat-block"><div className="sv blue">{getAvgRate(teams.blue)}</div><div className="sk">Blue avg rate</div></div>
              <div className="stat-block"><div className="sv sub">{getTotalRate(teams.blue)}</div><div className="sk">Total</div></div>
            </div>
            <div className="ov-stat-mid"><div className="total-diff"><div className={`td-n ${totalDiff > tolerance ? 'warn' : 'ok'}`}>Δ{totalDiff}</div><div className="td-k">total diff</div></div></div>
            <div className="ov-stat-side right">
              <div className="stat-block right"><div className="sv sub">{getTotalRate(teams.red)}</div><div className="sk">Total</div></div>
              <div className="stat-block right"><div className="sv red">{getAvgRate(teams.red)}</div><div className="sk">Red avg rate</div></div>
            </div>
          </div>
          <div className="ov-body">
            {swapSource && <div className="swap-banner"><strong>{teams[swapSource.team][swapSource.idx].player.nickname || teams[swapSource.team][swapSource.idx].player.name}</strong> を選択中 <button className="swap-cancel" onClick={() => setSwapSource(null)}>キャンセル</button></div>}
            {ROLES.map((role) => {
              const { tp: bTp, idx: bIdx } = byRole('blue', role)
              const { tp: rTp, idx: rIdx } = byRole('red', role)
              const diff = bTp && rTp ? Math.abs(getRateForRole(bTp.player, role) - getRateForRole(rTp.player, role)) : 0
              const isWarn = diff > tolerance
              const isSrcBlue = swapSource?.team === 'blue' && swapSource?.id === bTp?.player.id
              const isSrcRed = swapSource?.team === 'red' && swapSource?.id === rTp?.player.id
              return (
                <div className="role-row" key={role}>
                  <div className={`rr-card blue-card${isSrcBlue ? ' is-source' : ''}${swapSource && !isSrcBlue ? ' is-target' : ''}`} onClick={() => bIdx >= 0 && handleSwapClick('blue', bIdx)}>
                    <div className="rr-info"><div className="rr-line1"><span className="rr-name">{bTp?.player.nickname || bTp?.player.name || '—'}</span><span className="rr-sub">{bTp && bTp.role === bTp.player.mainRole ? 'メイン' : 'サブ'}</span></div><div className="rr-line2"><span className="rr-rate blue">{bTp ? getRateForRole(bTp.player, bTp.role) : '-'}</span></div></div>
                  </div>
                  <div className="rr-center"><div className={`rr-role-btn ${role}`}>{role}</div><div className={`rr-diff ${isWarn ? 'warn' : 'ok'}`}>Δ {diff}</div></div>
                  <div className={`rr-card red-card${isSrcRed ? ' is-source' : ''}${swapSource && !isSrcRed ? ' is-target' : ''}`} onClick={() => rIdx >= 0 && handleSwapClick('red', rIdx)}>
                    <div className="rr-info"><div className="rr-line1"><span className="rr-sub">{rTp && rTp.role === rTp.player.mainRole ? 'メイン' : 'サブ'}</span><span className="rr-name">{rTp?.player.nickname || rTp?.player.name || '—'}</span></div><div className="rr-line2"><span className="rr-rate red">{rTp ? getRateForRole(rTp.player, rTp.role) : '-'}</span></div></div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="result-bar">
            <span className="res-lbl">結果登録:</span>
            <button className={`win-btn blue ${result === 'BLUE' ? 'won-blue' : ''}`} onClick={() => registerMatch('BLUE')}>{result === 'BLUE' ? '✓ ' : ''}BLUE WIN</button>
            <button className={`win-btn red ${result === 'RED' ? 'won-red' : ''}`} onClick={() => registerMatch('RED')}>{result === 'RED' ? '✓ ' : ''}RED WIN</button>
            <a className="draft-btn" href="https://draftlol.dawe.gg/" target="_blank" rel="noopener noreferrer">Draft Tool</a>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .page-layout{max-width:1440px;margin:0 auto;display:grid;grid-template-columns:400px 1fr;height:calc(100vh - 57px - 68px);overflow:hidden}
        .panel{border-right:1px solid var(--line);display:flex;flex-direction:column;overflow:hidden}
        .right-panel{border-right:0}
        .panel-hd{padding:16px 20px 12px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
        .panel-hd h2{font-family:'Space Grotesk';font-size:15px;font-weight:600;margin:0}
        .panel-hd .count{font-family:'JetBrains Mono';font-size:12px;color:var(--fg-3)}
        .panel-body{flex:1;overflow-y:auto;padding:10px;scrollbar-width:thin;scrollbar-color:var(--line-2) transparent}
        .search-area{padding:10px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:8px}
        .search-row{position:relative}
        .search-row input{width:100%;padding:9px 12px 9px 36px;background:var(--bg-1);border:1px solid var(--line);border-radius:9px;color:var(--fg-0);font-size:13.5px;outline:none}
        .search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--fg-3)}
        .tag-row{display:flex;gap:5px;flex-wrap:wrap}
        .tag-chip{font-family:'JetBrains Mono';font-size:10px;letter-spacing:.08em;padding:4px 10px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--fg-2)}
        .tag-chip.active{background:color-mix(in oklch,var(--blue) 18%,transparent);border-color:var(--blue-d);color:var(--blue)}
        .pool-card{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid transparent;margin-bottom:5px;background:var(--bg-1);transition:all .12s;cursor:pointer}
        .pool-card:hover:not(.pool-selected){background:var(--bg-2);border-color:var(--line);transform:translateX(2px)}
        .pool-card.pool-selected{opacity:.38;cursor:not-allowed}
        .pool-card.just-added{animation:addedFlash .4s ease}
        @keyframes addedFlash{0%{background:color-mix(in oklch,var(--blue) 25%,var(--bg-1));border-color:var(--blue)}100%{background:var(--bg-1);border-color:transparent}}
        .card-info{flex:1;min-width:0}.name{font-weight:600;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sub-name{font-size:11px;color:var(--fg-3);font-family:'JetBrains Mono';margin-top:1px}
        .rates{font-family:'JetBrains Mono';font-size:11px;color:var(--fg-2);margin-top:4px;display:flex;gap:8px;align-items:center}
        .rates strong{color:var(--fg-1)} .rates .dot{color:var(--line-2)} .rates .rank{color:var(--fg-3)}
        .add-icon{color:var(--fg-3)}
        .roster-slot{background:var(--bg-1);border:1px solid var(--line);border-radius:8px;margin-bottom:4px}
        .rs-row{display:flex;align-items:center;gap:10px;padding:11px 14px}
        .roster-num{font-family:'JetBrains Mono';font-size:11px;color:var(--fg-3);width:18px}
        .rs-name-block{flex:1;min-width:0}.rs-pname{font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .rs-sname{font-family:'JetBrains Mono';font-size:11px;color:var(--fg-3)}
        .rs-rates{font-family:'JetBrains Mono';font-size:12px;color:var(--fg-2);display:flex;gap:10px}
        .rs-rates strong{color:var(--fg-1);margin-left:3px}
        .rs-ng-row{display:flex;gap:3px}
        .uw-btn{font-family:'JetBrains Mono';font-size:9.5px;padding:3px 0;border-radius:4px;border:1px solid var(--line);background:transparent;color:var(--fg-3);width:46px}
        .uw-btn.uw-on{background:color-mix(in oklch,var(--red) 14%,transparent);border-color:var(--red-d);color:var(--red)}
        .remove-btn{width:24px;height:24px;border-radius:5px;background:transparent;border:1px solid var(--line);color:var(--fg-3);display:grid;place-items:center}
        .empty-msg{padding:40px 16px;text-align:center;color:var(--fg-3);font-family:'JetBrains Mono';font-size:12px;line-height:1.6}
        .empty-slot{padding:9px 12px;text-align:center;font-family:'JetBrains Mono';font-size:10.5px;color:var(--fg-3);letter-spacing:.05em;border:1px dashed var(--line);border-radius:8px;margin-bottom:4px}
        .action-footer{position:fixed;bottom:0;left:0;right:0;z-index:40;background:color-mix(in oklch,var(--bg-0) 94%,transparent);backdrop-filter:blur(16px);border-top:1px solid var(--line)}
        .footer-inner{max-width:1440px;margin:0 auto;padding:0 28px;display:flex;align-items:center;gap:16px;height:68px}
        .progress-wrap{display:flex;align-items:center;gap:10px}.prog-dots{display:flex;gap:4px}.prog-dot{width:9px;height:9px;border-radius:2px;background:var(--line-2)}.prog-dot.blue{background:var(--blue)}.prog-dot.red{background:var(--red)}
        .prog-text{font-family:'JetBrains Mono';font-size:12px}.prog-n{color:var(--fg-0);font-weight:600}.prog-remain{color:var(--fg-2);margin-left:6px}.ready{color:var(--ok);margin-left:6px}
        .mode-toggle{display:flex;border:1px solid var(--line);border-radius:8px;overflow:hidden}.mode-btn{padding:7px 14px;font-size:12px;background:transparent;border:0;color:var(--fg-2)}.mode-btn.active{background:var(--bg-2);color:var(--fg-0)}
        .tol-wrap{display:flex;align-items:center;gap:7px}.tol-lbl{font-family:'JetBrains Mono';font-size:11px;color:var(--fg-3)}.tol-input{width:64px;padding:6px 8px;border-radius:7px;background:var(--bg-1);border:1px solid var(--line);color:var(--fg-0);font-family:'JetBrains Mono';text-align:center}
        .spacer{flex:1}.btn-ghost{padding:10px 20px;border-radius:9px;background:transparent;border:1px solid var(--line-2);color:var(--fg-1);font-family:'Space Grotesk';font-weight:600;font-size:13.5px}
        .btn-primary{padding:11px 28px;border-radius:9px;border:0;background:var(--fg-0);color:var(--bg-0);font-family:'Space Grotesk';font-weight:700;font-size:14px}
        .btn-primary:disabled{opacity:.28;cursor:not-allowed}
        .overlay{position:fixed;inset:0;z-index:100;background:var(--bg-0);display:flex;flex-direction:column}
        .ov-hd{display:flex;align-items:center;padding:14px 28px;border-bottom:1px solid var(--line);gap:14px}.ov-hd h2{font-family:'Space Grotesk';font-size:17px;margin:0}.ov-help{font-family:'JetBrains Mono';font-size:11px;color:var(--fg-3)}
        .ov-actions{margin-left:auto;display:flex;gap:8px}.icon-btn{width:34px;height:34px;border-radius:8px;border:1px solid var(--line);background:transparent;color:var(--fg-2)}.regen-btn{padding:8px 15px;border-radius:8px;border:1px solid var(--line);background:transparent;color:var(--fg-1)}
        .ov-stats{display:grid;grid-template-columns:1fr auto 1fr;border-bottom:1px solid var(--line);background:linear-gradient(to right,color-mix(in oklch,var(--blue-bg) 35%,transparent),var(--bg-0) 50%,color-mix(in oklch,var(--red-bg) 35%,transparent))}
        .ov-stat-side{padding:16px 28px;display:flex;gap:24px;align-items:center}.ov-stat-side.right{justify-content:flex-end}.stat-block{display:flex;flex-direction:column}.stat-block.right{align-items:flex-end}
        .sv{font-family:'Space Grotesk';font-size:28px;font-weight:600}.sv.blue{color:var(--blue)}.sv.red{color:var(--red)}.sv.sub{color:var(--fg-2)}.sk{font-family:'JetBrains Mono';font-size:10px;color:var(--fg-3);text-transform:uppercase;letter-spacing:.14em;margin-top:2px}
        .ov-stat-mid{display:flex;align-items:center;justify-content:center;padding:0 20px;border-left:1px solid var(--line);border-right:1px solid var(--line)}
        .total-diff{font-family:'JetBrains Mono';font-size:13px;display:flex;flex-direction:column;align-items:center;gap:2px}.td-n{font-size:20px;font-weight:600}.td-n.ok{color:var(--ok)}.td-n.warn{color:var(--warn)}.td-k{font-size:10px;color:var(--fg-3);letter-spacing:.1em;text-transform:uppercase}
        .ov-body{flex:1;overflow-y:auto;padding:12px 28px;display:flex;flex-direction:column;gap:8px}
        .swap-banner{background:color-mix(in oklch,var(--gold) 10%,var(--bg-1));border:1px solid color-mix(in oklch,var(--gold) 40%,transparent);border-radius:10px;padding:10px 16px;font-family:'JetBrains Mono';font-size:12px;color:var(--gold);display:flex;align-items:center;gap:10px}
        .swap-cancel{margin-left:auto;background:transparent;border:1px solid color-mix(in oklch,var(--gold) 40%,transparent);color:var(--gold);border-radius:5px;padding:3px 10px;font-family:'JetBrains Mono';font-size:10px}
        .role-row{display:grid;grid-template-columns:1fr 84px 1fr;gap:8px;align-items:stretch}
        .rr-card{background:var(--bg-1);border:1px solid var(--line);border-radius:10px;padding:14px 20px;display:flex;align-items:center;gap:14px;height:100%}
        .rr-card.blue-card{border-left:3px solid var(--blue-d)}.rr-card.red-card{border-right:3px solid var(--red-d);flex-direction:row-reverse}
        .rr-card.is-source{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold)}.rr-card.is-target{border-style:dashed}
        .rr-info{flex:1;min-width:0}.rr-line1{display:flex;align-items:baseline;gap:6px}.rr-card.red-card .rr-line1{flex-direction:row-reverse}
        .rr-name{font-weight:600;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rr-sub{font-family:'JetBrains Mono';font-size:11px;color:var(--fg-3)}
        .rr-line2{display:flex;align-items:baseline;gap:8px;margin-top:6px}.rr-card.red-card .rr-line2{flex-direction:row-reverse}
        .rr-rate{font-family:'JetBrains Mono';font-size:22px;font-weight:600}.rr-rate.blue{color:var(--blue)}.rr-rate.red{color:var(--red)}
        .rr-center{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}
        .rr-role-btn{font-family:'JetBrains Mono';font-size:11px;font-weight:600;padding:6px 10px;border-radius:8px;width:84px;text-align:center;background:var(--bg-2);border:1px solid var(--line)}
        .rr-diff{font-family:'JetBrains Mono';font-size:12px;font-weight:600;padding:3px 8px;border-radius:5px}
        .rr-diff.ok{background:color-mix(in oklch,var(--ok) 15%,transparent);color:var(--ok)}.rr-diff.warn{background:color-mix(in oklch,var(--warn) 15%,transparent);color:var(--warn)}
        .result-bar{border-top:1px solid var(--line);padding:14px 28px;display:flex;align-items:center;gap:10px}
        .res-lbl{font-family:'JetBrains Mono';font-size:11px;color:var(--fg-3)}.win-btn{flex:1;padding:14px;border-radius:11px;border:1px solid var(--line);background:transparent;font-family:'Space Grotesk';font-weight:700;font-size:16px}
        .win-btn.blue{color:var(--blue)}.win-btn.red{color:var(--red)}.win-btn.won-blue{background:color-mix(in oklch,var(--blue) 22%,transparent);border-color:var(--blue)}.win-btn.won-red{background:color-mix(in oklch,var(--red) 22%,transparent);border-color:var(--red)}
        .draft-btn{display:flex;align-items:center;justify-content:center;padding:14px 22px;border-radius:11px;border:1px solid var(--line-2);background:transparent;color:var(--fg-1);font-family:'Space Grotesk';font-weight:600;font-size:15px;text-decoration:none;white-space:nowrap}
        @media (max-width:1100px){.page-layout{grid-template-columns:1fr;height:auto;padding-bottom:68px}.footer-inner{padding:10px 14px;height:auto;flex-wrap:wrap}.role-row{grid-template-columns:1fr}.ov-help{display:none}}
      ` }} />
    </div>
  )
}
