import { useEffect, useMemo, useState } from 'react'
import Header from '@/components/Header'
import RoleBadge from '@/components/RoleBadge'
import { getDocs, orderBy, query } from 'firebase/firestore'
import { fetchMembers } from '@/lib/members'
import { matchesCollection } from '@/lib/paths'
import { getEffectiveElo } from '@/lib/roleTier'
import { useCommunity } from '@/lib/useCommunity'
import { GameRole, Match, MatchEloChange } from '@/types'
import { Member } from '@/types/member'

interface MatchWithPlayers extends Omit<Match, 'players'> {
  id: string
  players: {
    player: Member
    role: GameRole
    team: 'BLUE' | 'RED'
  }[]
}

const ROLES: GameRole[] = [GameRole.TOP, GameRole.JUNGLE, GameRole.MID, GameRole.ADC, GameRole.SUP]

const getRateForRole = (member: Member, role: GameRole) => getEffectiveElo(member, role)

function RatingChange({ change, fallback }: { change?: MatchEloChange; fallback: number }) {
  if (!change) return <span className="detail-rate">{fallback}</span>
  return (
    <span className="detail-rate">
      {change.before} → {change.after} <strong className={change.delta < 0 ? 'rating-negative' : 'rating-positive'}>({change.delta > 0 ? '+' : ''}{change.delta})</strong>
      {change.performance && <small className="detail-performance">{change.performance === 'MVP' ? 'MVP +' : '下方補正 '}{change.performanceDelta}</small>}
    </span>
  )
}

const fmtDate = (seconds: number) => {
  const d = new Date(seconds * 1000)
  return {
    day: d.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' }),
    time: d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false }),
    full: d.toLocaleString('ja-JP'),
  }
}

export default function MatchesPage() {
  const { community } = useCommunity()
  const [matches, setMatches] = useState<MatchWithPlayers[]>([])
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [filter, setFilter] = useState<'ALL' | 'BLUE' | 'RED'>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!community) return
    let active = true
    setLoadStatus('loading')
    const fetchData = async () => {
      const [memberList, matchesSnapshot] = await Promise.all([
        fetchMembers(community.id),
        getDocs(query(matchesCollection(community.id), orderBy('date', 'desc'))),
      ])
      const playersMap = memberList.reduce((acc, m) => {
        acc[m.id] = m
        return acc
      }, {} as Record<string, Member>)

      const rows = matchesSnapshot.docs.map((d) => {
        const match = { id: d.id, ...d.data() } as Match
        return {
          ...match,
          id: d.id,
          players: match.players
            .map((p) => ({ ...p, player: playersMap[p.playerId], role: p.role as GameRole }))
            .filter((p) => !!p.player) as MatchWithPlayers['players'],
        }
      })

      if (active) {
        setMatches(rows)
        setLoadStatus('ready')
      }
    }

    fetchData().catch((error) => {
      console.error(error)
      if (active) setLoadStatus('error')
    })
    return () => { active = false }
  }, [community?.id])

  const filtered = useMemo(() => {
    if (filter === 'ALL') return matches
    return matches.filter((m) => m.winner === filter)
  }, [matches, filter])

  const stats = useMemo(() => {
    const blueWins = matches.filter((m) => m.winner === 'BLUE').length
    const redWins = matches.filter((m) => m.winner === 'RED').length
    const total = matches.length
    return { blueWins, redWins, total, last: matches[0] }
  }, [matches])

  return (
    <div>
      <Header />
      <main className="page">
        <section className="page-hd">
          <span className="history-kicker">MATCH ARCHIVE</span>
          <h1>試合履歴</h1><p>勝敗とレート変動を振り返る</p>
        </section>

        <section className="stats">
          <div className="stat-cell"><div className="stat-k">総試合数</div><div className="stat-v">{stats.total}</div></div>
          <div className="stat-cell"><div className="stat-k">BLUE WIN</div><div className="stat-v blue">{stats.blueWins}</div></div>
          <div className="stat-cell"><div className="stat-k">RED WIN</div><div className="stat-v red">{stats.redWins}</div></div>
          <div className="stat-cell"><div className="stat-k">BLUE 勝率</div><div className="stat-v">{stats.total ? Math.round((stats.blueWins / stats.total) * 100) : 0}%</div></div>
          <div className="stat-cell"><div className="stat-k">最新の試合</div><div className="stat-v last">{stats.last ? fmtDate(stats.last.date.seconds).full : '-'}</div></div>
        </section>

        <section className="filter-bar">
          <button className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>ALL</button>
          <button className={`filter-btn ${filter === 'BLUE' ? 'active' : ''}`} onClick={() => setFilter('BLUE')}>BLUE WIN</button>
          <button className={`filter-btn ${filter === 'RED' ? 'active' : ''}`} onClick={() => setFilter('RED')}>RED WIN</button>
        </section>

        <section className="match-list">
          {loadStatus === 'loading' && <div className="empty" role="status">試合履歴を読み込み中…</div>}
          {loadStatus === 'error' && <div className="empty" role="alert">試合履歴を読み込めませんでした。ページを再読み込みしてください。</div>}
          {loadStatus === 'ready' && filtered.map((match) => {
            const blue = match.players.filter((p) => p.team === 'BLUE')
            const red = match.players.filter((p) => p.team === 'RED')
            const beforeById = new Map(match.eloChanges?.map((change) => [change.memberId, change.before]))
            const rateAtMatch = (p: MatchWithPlayers['players'][number]) => {
              const elo = beforeById.get(p.player.id)
              return getRateForRole(elo === undefined ? p.player : { ...p.player, elo }, p.role)
            }
            const blueAvg = Math.round(blue.reduce((s, p) => s + rateAtMatch(p), 0) / Math.max(blue.length, 1))
            const redAvg = Math.round(red.reduce((s, p) => s + rateAtMatch(p), 0) / Math.max(red.length, 1))
            const isExpanded = expandedId === match.id
            const dateParts = fmtDate(match.date.seconds)

            return (
              <article key={match.id} className={`match-card ${match.winner === 'BLUE' ? 'blue-win' : 'red-win'} ${isExpanded ? 'expanded' : ''}`}>
                <div className="match-row" role="button" tabIndex={0} aria-expanded={isExpanded}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setExpandedId(isExpanded ? null : match.id)
                    }
                  }}
                  onClick={() => setExpandedId((prev) => (prev === match.id ? null : match.id))}>
                  <div className="match-date">
                    <span className="day">{dateParts.day}</span>
                    <span>{dateParts.time}</span>
                  </div>

                  <div className="team-col">
                    {blue.map((p) => (
                      <div key={p.player.id} className="team-player-row">
                        <RoleBadge role={p.role} sm />
                        <span className="team-player-name">{p.player.nickname || p.player.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="vs-col">
                    <div className="vs-word">VS</div>
                    <div className="rate-diff">{'\u0394'}{Math.abs(blueAvg - redAvg)}</div>
                  </div>

                  <div className="team-col right">
                    {red.map((p) => (
                      <div key={p.player.id} className="team-player-row">
                        <RoleBadge role={p.role} sm />
                        <span className="team-player-name">{p.player.nickname || p.player.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="winner-col">
                    <span className={`winner-badge ${match.winner === 'BLUE' ? 'blue' : 'red'}`}>{match.winner} WIN</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="match-detail">
                    <div className="detail-side blue-side">
                      <div className="detail-side-hd">BLUE SIDE {'\u00b7'} avg {blueAvg}</div>
                      {blue.map((p) => (
                        <div className="detail-player" key={p.player.id}>
                          <RoleBadge role={p.role} sm />
                          <span className="detail-name">{p.player.nickname || p.player.name}</span>
                          <RatingChange change={match.eloChanges?.find((change) => change.memberId === p.player.id)} fallback={getRateForRole(p.player, p.role)} />
                        </div>
                      ))}
                    </div>

                    <div className="detail-center">
                      <div className="vc">VS</div>
                      <div className="detail-diff-rows">
                        {ROLES.map((role) => {
                          const bp = blue.find((p) => p.role === role)
                          const rp = red.find((p) => p.role === role)
                          const diff = bp && rp ? Math.abs(rateAtMatch(bp) - rateAtMatch(rp)) : 0
                          return (
                            <div className="detail-diff-row" key={role}>
                              <span className="diff-role">{role}</span>
                              <span className="diff-num">{'\u0394'}{diff}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="detail-side red-side">
                      <div className="detail-side-hd">RED SIDE {'\u00b7'} avg {redAvg}</div>
                      {red.map((p) => (
                        <div className="detail-player" key={p.player.id}>
                          <RoleBadge role={p.role} sm />
                          <span className="detail-name">{p.player.nickname || p.player.name}</span>
                          <RatingChange change={match.eloChanges?.find((change) => change.memberId === p.player.id)} fallback={getRateForRole(p.player, p.role)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            )
          })}

          {loadStatus === 'ready' && filtered.length === 0 && (
            <div className="empty">{'\u8a72\u5f53\u3059\u308b\u8a66\u5408\u304c\u3042\u308a\u307e\u305b\u3093'}</div>
          )}
        </section>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .detail-performance { display: block; color: var(--fg-2); }
        .page { max-width: 1440px; margin: 0 auto; padding: 28px 28px 60px; }
        .page-hd {
          padding: 22px 24px;
          margin-bottom: 14px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: linear-gradient(108deg, color-mix(in srgb, var(--blue) 15%, var(--bg-1)), var(--bg-1) 54%, color-mix(in srgb, var(--red) 12%, var(--bg-1)));
        }
        .history-kicker { color: var(--fg-1); font: 600 10px 'JetBrains Mono', monospace; letter-spacing: .18em; }
        .page-hd h1 {
          margin: 4px 0 0;
          font-family: 'Space Grotesk';
          font-size: clamp(24px, 4vw, 36px);
          font-weight: 600;
          letter-spacing: -0.02em;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          border: 1px solid var(--line);
          border-radius: 14px;
          overflow: hidden;
          background: var(--bg-1);
        }
        .stat-cell { padding: 18px 20px; border-right: 1px solid var(--line); }
        .stat-cell:last-child { border-right: 0; }
        .stat-k {
          font-family: 'JetBrains Mono';
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--fg-3);
        }
        .stat-v {
          font-family: 'Space Grotesk';
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.03em;
          margin-top: 6px;
        }
        .stat-v.blue { color: var(--blue); }
        .stat-v.red { color: var(--red); }
        .stat-v.last { font-size: 20px; letter-spacing: -0.02em; }
        .filter-bar { display: flex; gap: 8px; margin: 16px 0; align-items: center; }
        .filter-btn {
          font-family: 'JetBrains Mono';
          font-size: 11px;
          letter-spacing: 0.08em;
          padding: 7px 16px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: transparent;
          color: var(--fg-2);
          cursor: pointer;
          transition: all 0.12s;
        }
        .filter-btn:hover { border-color: var(--line-2); color: var(--fg-0); background: var(--bg-2); }
        .filter-btn.active { background: var(--fg-0); color: var(--bg-0); border-color: var(--fg-0); }
        .match-list { display: flex; flex-direction: column; gap: 8px; }
        .match-card {
          border: 1px solid var(--line);
          border-radius: 13px;
          background: var(--bg-1);
          overflow: hidden;
          transition: border-color 0.12s;
        }
        .match-card:hover, .match-card.expanded { border-color: var(--line-2); }
        .match-card.blue-win { border-left: 3px solid var(--blue-d); }
        .match-card.red-win { border-left: 3px solid var(--red-d); }
        .match-row {
          display: grid;
          grid-template-columns: 90px 1fr 84px 1fr 110px;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          cursor: pointer;
        }
        .match-date {
          font-family: 'JetBrains Mono';
          font-size: 11.5px;
          color: var(--fg-2);
          display: flex;
          flex-direction: column;
          line-height: 1.25;
        }
        .match-date .day { font-size: 13px; color: var(--fg-1); font-weight: 600; }
        .team-col { display: flex; flex-direction: column; gap: 5px; }
        .team-col.right { align-items: flex-end; }
        .team-player-row { display: flex; align-items: center; gap: 7px; }
        .team-player-name { font-size: 12.5px; font-weight: 500; }
        .vs-col { text-align: center; }
        .vs-word { font-family: 'Space Grotesk'; font-size: 14px; font-weight: 700; color: var(--fg-3); }
        .rate-diff { font-family: 'JetBrains Mono'; font-size: 10px; color: var(--fg-3); margin-top: 3px; }
        .winner-col { text-align: right; }
        .winner-badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 12px;
          border-radius: 7px;
          font-family: 'JetBrains Mono';
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          border: 1px solid;
        }
        .winner-badge.blue { border-color: var(--blue-d); color: var(--blue); }
        .winner-badge.red { border-color: var(--red-d); color: var(--red); }
        .match-detail {
          border-top: 1px solid var(--line);
          padding: 16px 18px;
          display: grid;
          grid-template-columns: 1fr 100px 1fr;
          gap: 12px;
        }
        .detail-side { display: flex; flex-direction: column; gap: 6px; }
        .detail-side.blue-side { background: color-mix(in oklch, var(--blue-bg) 40%, transparent); border-radius: 10px; padding: 12px 14px; }
        .detail-side.red-side { background: color-mix(in oklch, var(--red-bg) 40%, transparent); border-radius: 10px; padding: 12px 14px; }
        .detail-side-hd { font-family: 'JetBrains Mono'; font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; margin-bottom: 8px; }
        .detail-player {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 0;
          border-bottom: 1px solid color-mix(in oklch, var(--line) 60%, transparent);
        }
        .detail-player:last-child { border-bottom: 0; }
        .detail-name { font-size: 13px; font-weight: 600; flex: 1; }
        .detail-rate { font-family: 'JetBrains Mono'; font-size: 12px; color: var(--fg-2); text-align: right; }
        .detail-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
        .detail-center .vc { font-family: 'Space Grotesk'; font-weight: 700; font-size: 18px; color: var(--fg-3); }
        .detail-diff-rows { display: flex; flex-direction: column; gap: 6px; width: 100%; }
        .detail-diff-row { display: flex; justify-content: space-between; }
        .diff-role { font-family: 'JetBrains Mono'; font-size: 10px; color: var(--fg-3); }
        .diff-num { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600; color: var(--ok); }
        .empty {
          text-align: center;
          color: var(--fg-3);
          font-family: 'JetBrains Mono';
          font-size: 12px;
          padding: 40px;
        }

        @media (max-width: 1100px) {
          .stats { grid-template-columns: 1fr 1fr; }
          .match-row { grid-template-columns: 1fr; gap: 10px; }
          .winner-col { text-align: left; }
          .team-col.right { align-items: flex-start; }
          .match-detail { grid-template-columns: 1fr; }
        }
      ` }} />
    </div>
  )
}
