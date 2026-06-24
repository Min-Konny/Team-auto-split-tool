import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import { COMMUNITY_249_ID, PRESET_COMMUNITIES } from '@/constants/community'

export default function CommunityJoinPage() {
  const [communityId, setCommunityId] = useState(COMMUNITY_249_ID)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '失敗しました')
      router.push('/team-maker')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラー')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Head>
        <title>ログイン | Team Maker</title>
      </Head>
      <Header />
      <main className="comm-page">
        <Link href="/community" className="back">
          ← 戻る
        </Link>
        <h1>コミュニティに参加</h1>
        <p className="lead">
          コミュニティを選び、<strong>パスワード</strong>を入力してログインします。
        </p>

        <div className="community-pick">
          {PRESET_COMMUNITIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`comm-card${communityId === c.id ? ' active' : ''}`}
              onClick={() => setCommunityId(c.id)}
            >
              <span className="comm-name">{c.name}</span>
              <span className="comm-id">ID: {c.id}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          <label>
            パスワード
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="err">{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? 'ログイン中…' : 'ログイン'}
          </button>
        </form>
      </main>
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}

const css = `
.comm-page{max-width:440px;margin:0 auto;padding:40px 24px}
.back{font-size:12px;color:var(--fg-3);text-decoration:none}
.comm-page h1{font-family:'Space Grotesk';font-size:22px;margin:16px 0 8px}
.lead{font-size:13px;color:var(--fg-2);line-height:1.5;margin:0 0 20px}
.community-pick{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}
.comm-card{padding:14px;border-radius:12px;border:1px solid var(--line);background:var(--bg-1);cursor:pointer;text-align:left}
.comm-card.active{border-color:var(--blue-d);background:color-mix(in oklch,var(--blue) 12%,transparent)}
.comm-name{display:block;font-weight:700;font-size:15px}
.comm-id{display:block;font-size:11px;color:var(--fg-3);margin-top:4px;font-family:'JetBrains Mono'}
form{display:flex;flex-direction:column;gap:14px}
label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--fg-3)}
input{padding:11px 12px;border-radius:9px;border:1px solid var(--line);background:var(--bg-1);color:var(--fg-0)}
button[type=submit]{padding:13px;border-radius:10px;border:0;background:var(--fg-0);color:var(--bg-0);font-weight:700;cursor:pointer}
button:disabled{opacity:.4}
.err{color:var(--red);font-size:13px}
`
