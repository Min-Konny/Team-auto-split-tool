import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import RoleBadge from '@/components/RoleBadge'
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { GameRole, Match, Player } from '@/types'

const ROLES: GameRole[] = [GameRole.TOP, GameRole.JUNGLE, GameRole.MID, GameRole.ADC, GameRole.SUP]
const DEFAULT_TAGS = ['249', 'SHIFT', 'その他', '交流']

type PlayerWithId = Player & { id: string }
type MatchWithPlayer = Match & { playerTeam: 'BLUE' | 'RED'; playerRole: string; isWinner: boolean }

const getRankFromRate = (rate: number) => {
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

const getRankColor = (rank: string) =>
  ({
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
  }[rank] || 'var(--fg-2)')

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerWithId[]>([])
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'mainRate' | 'subRate' | 'wr' | 'name'>('mainRate')

  const [editTarget, setEditTarget] = useState<PlayerWithId | null>(null)
  const [historyTarget, setHistoryTarget] = useState<PlayerWithId | null>(null)
  const [history, setHistory] = useState<MatchWithPlayer[]>([])

  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [mainRate, setMainRate] = useState(0)
  const [subRate, setSubRate] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [unwantedRoles, setUnwantedRoles] = useState<GameRole[]>([])

  const fetchPlayers = async () => {
    const snapshot = await getDocs(collection(db, 'players'))
    setPlayers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PlayerWithId)))
  }

  useEffect(() => {
    fetchPlayers().catch(console.error)
  }, [])

  const availableTags = useMemo(
    () => Array.from(new Set([...DEFAULT_TAGS, ...players.flatMap((p) => p.tags || [])])).filter(Boolean),
    [players]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = players.filter((p) => {
      const display = p.nickname || p.name
      const matchName = display.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      const matchTag = selectedTags.length === 0 || selectedTags.some((tag) => p.tags?.includes(tag))
      return matchName && matchTag
    })

    return list.sort((a, b) => {
      if (sortBy === 'mainRate') return b.mainRate - a.mainRate
      if (sortBy === 'subRate') return b.subRate - a.subRate
      if (sortBy === 'wr') {
        const aw = a.stats.wins + a.stats.losses === 0 ? 0 : Math.round((a.stats.wins / (a.stats.wins + a.stats.losses)) * 100)
        const bw = b.stats.wins + b.stats.losses === 0 ? 0 : Math.round((b.stats.wins / (b.stats.wins + b.stats.losses)) * 100)
        return bw - aw
      }
      return (a.nickname || a.name).localeCompare(b.nickname || b.name, 'ja')
    })
  }, [players, search, selectedTags, sortBy])

  const openEdit = (player: PlayerWithId) => {
    setEditTarget(player)
    setName(player.name)
    setNickname(player.nickname || '')
    setMainRate(player.mainRate)
    setSubRate(player.subRate)
    setTags([...(player.tags || [])])
    setUnwantedRoles([...(player.unwantedRoles || [])])
  }

  const saveEdit = async () => {
    if (!editTarget) return
    await updateDoc(doc(db, 'players', editTarget.id), {
      name: name.trim(),
      nickname: nickname.trim() || null,
      mainRate,
      subRate,
      tags,
      unwantedRoles,
    })
    await fetchPlayers()
    setEditTarget(null)
  }

  const removePlayer = async (player: PlayerWithId) => {
    if (!window.confirm(`${player.nickname || player.name} を削除しますか？`)) return
    await deleteDoc(doc(db, 'players', player.id))
    await fetchPlayers()
  }

  const openHistory = async (player: PlayerWithId) => {
    setHistoryTarget(player)
    const snapshot = await getDocs(query(collection(db, 'matches'), orderBy('date', 'desc')))
    const rows = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as Match))
      .filter((m) => m.players.some((p) => p.playerId === player.id))
      .map((m) => {
        const me = m.players.find((p) => p.playerId === player.id)!
        return { ...m, playerTeam: me.team, playerRole: me.role, isWinner: me.team === m.winner }
      })
    setHistory(rows)
  }

  return (
    <div>
      <Header />
      <main className="page">
        <div className="head">
          <div className="title">
            プレイヤー一覧 <span>{filtered.length} / {players.length} 件</span>
          </div>
          <Link href="/players/new" className="btnAdd">新規登録</Link>
        </div>

        <div className="filters">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="名前で検索" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="mainRate">メインレート順</option>
            <option value="subRate">サブレート順</option>
            <option value="wr">勝率順</option>
            <option value="name">名前順</option>
          </select>
          <div className="chips">
            {availableTags.map((t) => (
              <button key={t} className={selectedTags.includes(t) ? 'active' : ''} onClick={() => setSelectedTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t])}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="table">
          <div className="row hd">{['プレイヤー', 'Role', 'Main', 'Sub', 'WR', 'タグ', 'NG', ''].map((h) => <div key={h}>{h}</div>)}</div>
          {filtered.map((p) => {
            const total = p.stats.wins + p.stats.losses
            const wr = total === 0 ? 0 : Math.round((p.stats.wins / total) * 100)
            return (
              <div className="row" key={p.id}>
                <div><div className="nm">{p.nickname || p.name}</div>{p.nickname && <div className="sub">{p.name}</div>}</div>
                <div><RoleBadge role={p.mainRole} /></div>
                <div><div className="num">{p.mainRate}</div><div className="sub" style={{ color: getRankColor(getRankFromRate(p.mainRate)) }}>{getRankFromRate(p.mainRate)}</div></div>
                <div><div className="num">{p.subRate}</div><div className="sub" style={{ color: getRankColor(getRankFromRate(p.subRate)) }}>{getRankFromRate(p.subRate)}</div></div>
                <div><div className="num" style={{ color: wr >= 50 ? 'var(--ok)' : 'var(--red)' }}>{wr}%</div><div className="sub">{p.stats.wins}W {p.stats.losses}L</div></div>
                <div className="chips mini">{(p.tags || []).map((t) => <span key={t}>{t}</span>)}</div>
                <div className="chips mini">{(p.unwantedRoles || []).map((r) => <span key={r} className="ng">{r}</span>)}</div>
                <div className="acts">
                  <button onClick={() => openHistory(p)}>⏱</button>
                  <button onClick={() => openEdit(p)}>✎</button>
                  <button onClick={() => removePlayer(p)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {editTarget && (
        <div className="backdrop" onClick={(e) => e.target === e.currentTarget && setEditTarget(null)}>
          <div className="modal">
            <h3>{editTarget.nickname || editTarget.name} を編集</h3>
            <div className="grid">
              <input value={name} onChange={(e) => setName(e.target.value)} />
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} />
              <input type="number" value={mainRate} onChange={(e) => setMainRate(Number(e.target.value) || 0)} />
              <input type="number" value={subRate} onChange={(e) => setSubRate(Number(e.target.value) || 0)} />
            </div>
            <div className="chips">
              {availableTags.map((t) => <button key={t} className={tags.includes(t) ? 'active' : ''} onClick={() => setTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t])}>{t}</button>)}
            </div>
            <div className="chips">
              {ROLES.map((r) => <button key={r} className={unwantedRoles.includes(r) ? 'active ng' : ''} onClick={() => setUnwantedRoles((p) => p.includes(r) ? p.filter((x) => x !== r) : [...p, r])}>{r}</button>)}
            </div>
            <div className="acts"><button onClick={() => setEditTarget(null)}>キャンセル</button><button onClick={saveEdit}>保存</button></div>
          </div>
        </div>
      )}

      {historyTarget && (
        <div className="backdrop" onClick={(e) => e.target === e.currentTarget && setHistoryTarget(null)}>
          <div className="modal wide">
            <h3>{historyTarget.nickname || historyTarget.name} の試合履歴</h3>
            {history.map((h) => (
              <div key={h.id} className="hist">
                <span>{new Date(h.date.seconds * 1000).toLocaleString('ja-JP')}</span>
                <span>{h.playerTeam}</span>
                <RoleBadge role={h.playerRole} sm />
                <span>{h.isWinner ? 'WIN' : 'LOSS'}</span>
              </div>
            ))}
            {history.length === 0 && <div className="sub">試合履歴がありません</div>}
          </div>
        </div>
      )}

      <style>{`
        .page { max-width: 1440px; margin: 0 auto; padding: 28px; }
        .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .title { font-family: 'Space Grotesk'; font-size: 22px; font-weight: 600; }
        .title span { font-family: 'JetBrains Mono'; font-size: 12px; color: var(--fg-3); margin-left: 8px; }
        .btnAdd { background: var(--fg-0); color: var(--bg-0); border-radius: 9px; padding: 10px 20px; text-decoration: none; }
        .filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
        .filters input, .filters select { background: var(--bg-1); border: 1px solid var(--line); border-radius: 9px; padding: 9px 12px; color: var(--fg-0); }
        .chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .chips button, .chips span { font-family: 'JetBrains Mono'; font-size: 10px; border-radius: 999px; border: 1px solid var(--line); padding: 5px 10px; background: transparent; color: var(--fg-2); }
        .chips button.active { background: color-mix(in oklch, var(--blue) 18%, transparent); border-color: var(--blue-d); color: var(--blue); }
        .chips .ng { border-radius: 4px; border-color: var(--red-d); color: var(--red); background: color-mix(in oklch, var(--red) 14%, transparent); }
        .table { border: 1px solid var(--line); border-radius: 14px; overflow: auto; background: var(--bg-1); }
        .row { display: grid; grid-template-columns: 220px 72px 140px 140px 90px 120px 90px 100px; gap: 0; padding: 0 14px; align-items: center; border-bottom: 1px solid var(--line); min-width: 980px; }
        .row > div { padding: 10px 8px; }
        .row.hd { background: var(--bg-2); font-family: 'JetBrains Mono'; font-size: 10px; color: var(--fg-3); letter-spacing: .12em; }
        .nm { font-weight: 600; }
        .sub { font-family: 'JetBrains Mono'; font-size: 11px; color: var(--fg-3); }
        .num { font-family: 'JetBrains Mono'; font-size: 15px; font-weight: 600; }
        .mini span { padding: 2px 7px; }
        .acts { display: flex; gap: 5px; justify-content: flex-end; }
        .acts button { width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--line); background: transparent; color: var(--fg-2); }
        .backdrop { position: fixed; inset: 0; z-index: 100; background: color-mix(in oklch, var(--bg-0) 80%, transparent); backdrop-filter: blur(6px); display: grid; place-items: center; }
        .modal { width: min(560px, 94vw); max-height: 90vh; overflow: auto; background: var(--bg-1); border: 1px solid var(--line-2); border-radius: 16px; padding: 18px 22px; display: grid; gap: 12px; }
        .modal.wide { width: min(700px, 94vw); }
        .modal h3 { margin: 0; font-family: 'Space Grotesk'; font-size: 16px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .grid input { background: var(--bg-0); border: 1px solid var(--line); border-radius: 9px; color: var(--fg-0); padding: 10px 12px; }
        .hist { display: grid; grid-template-columns: 1fr 90px 60px 80px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--line); }
      `}</style>
    </div>
  )
}
