import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { findLobbyByInviteToken, isLobbyExpired, subscribeLobby, toggleLobbyCheckIn } from '@/lib/lobby'
import { fetchMembers } from '@/lib/members'
import { getStoredMemberId, setStoredMemberId } from '@/lib/memberSession'
import { Lobby } from '@/types/lobby'
import { Member } from '@/types/member'

export default function JoinLobbyPage() {
  const router = useRouter()
  const token = typeof router.query.token === 'string' ? router.query.token : ''
  const [lobby, setLobby] = useState<(Lobby & { id: string }) | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [communityId, setCommunityId] = useState<string | null>(null)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setMemberId(getStoredMemberId())
  }, [])


  useEffect(() => {
    if (!token) return
    let unsub: (() => void) | undefined
    findLobbyByInviteToken(token)
      .then((found) => {
        if (!found) {
          setError('ロビーが見つかりません')
          setLoading(false)
          return
        }
        if (isLobbyExpired(found)) {
          setError('このロビーは期限切れです。運営に新しいリンクを依頼してください。')
          setLoading(false)
          return
        }
        setCommunityId(found.communityId)
        setLobby(found)
        setLoading(false)
        fetchMembers(found.communityId).then(setMembers).catch(() => setError('メンバー一覧の取得に失敗しました'))
        unsub = subscribeLobby(found.id, setLobby, found.communityId)
      })
      .catch(() => {
        setError('ロビーの読み込みに失敗しました')
        setLoading(false)
      })
    return () => unsub?.()
  }, [token])

  const checkedIn = useMemo(() => new Set(lobby?.checkInIds ?? []), [lobby?.checkInIds])
  const me = members.find((p) => p.id === memberId)
  const isJoined = memberId ? checkedIn.has(memberId) : false

  const pickMember = async (id: string) => {
    setStoredMemberId(id)
    setMemberId(id)
  }

  const handleToggleJoin = async () => {
    if (!lobby?.id || !memberId || lobby.status !== 'open') return
    setBusy(true)
    try {
      await toggleLobbyCheckIn(lobby.id, memberId, !isJoined, communityId || lobby.communityId)
    } catch {
      setError('参加の更新に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <main className="join-page">
        <p>読み込み中…</p>
      </main>
    )
  }

  if (error || !lobby) {
    return (
      <main className="join-page">
        <p className="join-err">{error || '不明なエラー'}</p>
        <Link href="/">トップへ</Link>
      </main>
    )
  }

  return (
    <>
      <Head>
        <title>今夜のロビーに参加 | Team Maker</title>
      </Head>
      <main className="join-page">
        <h1>今夜のロビー</h1>
        <p className="join-count">
          <strong>{lobby.checkInIds.length}</strong> / 10 人が参加
        </p>
        {lobby.status === 'locked' && <p className="join-locked">ロビーは締め切られています</p>}

        {!memberId && (
          <section className="join-pick">
            <h2>あなたはどれ？</h2>
            <p className="join-hint">一度選ぶと次回から自動で選ばれます</p>
            <ul className="join-list">
              {members.map((p) => (
                <li key={p.id}>
                  <button type="button" className="join-pick-btn" onClick={() => pickMember(p.id!)}>
                    {p.nickname || p.name}
                    {p.nickname && <span className="sub">{p.name}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {memberId && me && (
          <section className="join-me">
            <p>
              {me.nickname || me.name}
              <button type="button" className="join-change" onClick={() => setMemberId(null)}>
                変更
              </button>
            </p>
            {lobby.status === 'open' && (
              <button
                type="button"
                className={`join-toggle ${isJoined ? 'out' : 'in'}`}
                disabled={busy}
                onClick={handleToggleJoin}
              >
                {isJoined ? '参加を取り消す' : '参加する'}
              </button>
            )}
            {isJoined && <p className="join-ok">✓ ロビーに参加済み</p>}
          </section>
        )}

        {lobby.checkInIds.length > 0 && (
          <section className="join-roster">
            <h2>参加者</h2>
            <ul>
              {lobby.checkInIds.map((id) => {
                const p = members.find((x) => x.id === id)
                return <li key={id}>{p?.nickname || p?.name || id}</li>
              })}
            </ul>
          </section>
        )}

        <p className="join-footer">
          <Link href="/team-maker">運営: チーム分け画面へ →</Link>
        </p>
      </main>
      <style dangerouslySetInnerHTML={{ __html: joinStyles }} />
    </>
  )
}

const joinStyles = `
.join-page{max-width:420px;margin:0 auto;padding:28px 20px 48px;font-family:'Space Grotesk',sans-serif;color:var(--fg-0)}
.join-page h1{font-size:22px;margin:0 0 8px}
.join-count{font-family:'JetBrains Mono',monospace;font-size:14px;color:var(--fg-2)}
.join-count strong{font-size:28px;color:var(--ok)}
.join-err{color:var(--red)}
.join-locked{color:var(--warn);font-size:13px}
.join-hint{font-size:12px;color:var(--fg-3)}
.join-list{list-style:none;padding:0;margin:12px 0}
.join-pick-btn{width:100%;text-align:left;padding:12px 14px;margin-bottom:6px;border-radius:10px;border:1px solid var(--line);background:var(--bg-1);color:var(--fg-0);cursor:pointer;font-size:15px;font-weight:600}
.join-pick-btn .sub{display:block;font-size:11px;font-weight:400;color:var(--fg-3);font-family:'JetBrains Mono',monospace}
.join-toggle{width:100%;padding:14px;border-radius:11px;border:0;font-size:16px;font-weight:700;cursor:pointer;margin-top:12px}
.join-toggle.in{background:var(--fg-0);color:var(--bg-0)}
.join-toggle.out{background:transparent;border:1px solid var(--line);color:var(--fg-1)}
.join-ok{color:var(--ok);font-family:'JetBrains Mono',monospace;font-size:12px}
.join-change{margin-left:10px;font-size:11px;background:transparent;border:0;color:var(--fg-3);cursor:pointer;text-decoration:underline}
.join-roster ul{list-style:none;padding:0;font-size:14px;color:var(--fg-1)}
.join-roster li{padding:6px 0;border-bottom:1px solid var(--line)}
.join-footer{margin-top:28px;font-size:13px}
`
