import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import { COMMUNITY_249_ID, PRESET_COMMUNITIES } from '@/constants/community'

type Mode = 'login' | 'register'

export default function CommunityJoinPage() {
  const [communityId, setCommunityId] = useState(COMMUNITY_249_ID)
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passcode, setPasscode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  const selected = PRESET_COMMUNITIES.find((c) => c.id === communityId)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body =
        mode === 'login'
          ? { communityId, username, password }
          : { communityId, username, password, passcode, displayName: displayName || undefined }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
          コミュニティごとに<strong>ユーザー名とパスワード</strong>でログインします。既存プレイヤーには仮パスワード <code>0000</code> のアカウントが用意されています（ユーザー名はプレイヤー名の英数字部分など）。
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

        <div className="mode-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            ログイン
          </button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            新規登録
          </button>
        </div>

        {mode === 'register' && selected && (
          <p className="hint">
            <strong>{selected.name}</strong> のパスコード（初回のみ）を入力してください。メンバーには共有しないでください。
          </p>
        )}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <label>
              コミュニティのパスコード
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="コミュニティから共有されたコード"
                autoComplete="off"
              />
            </label>
          )}
          <label>
            ユーザー名（英数字・_ 3〜20文字）
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>
          {mode === 'register' && (
            <label>
              表示名（任意）
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </label>
          )}
          <label>
            パスワード
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
          {error && <p className="err">{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? '処理中…' : mode === 'login' ? 'ログイン' : 'アカウント作成'}
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
.community-pick{display:flex;gap:10px;margin-bottom:20px}
.comm-card{flex:1;padding:14px;border-radius:12px;border:1px solid var(--line);background:var(--bg-1);cursor:pointer;text-align:left}
.comm-card.active{border-color:var(--blue-d);background:color-mix(in oklch,var(--blue) 12%,transparent)}
.comm-name{display:block;font-weight:700;font-size:15px}
.comm-id{display:block;font-size:11px;color:var(--fg-3);margin-top:4px;font-family:'JetBrains Mono'}
.mode-tabs{display:flex;gap:8px;margin-bottom:16px}
.mode-tabs button{flex:1;padding:10px;border-radius:8px;border:1px solid var(--line);background:transparent;color:var(--fg-2);cursor:pointer;font-weight:600}
.mode-tabs button.active{background:var(--fg-0);color:var(--bg-0);border-color:var(--fg-0)}
.hint{font-size:12px;color:var(--fg-2);margin:0 0 12px;padding:10px 12px;background:var(--bg-1);border-radius:8px;border:1px solid var(--line)}
form{display:flex;flex-direction:column;gap:14px}
label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--fg-3)}
input{padding:11px 12px;border-radius:9px;border:1px solid var(--line);background:var(--bg-1);color:var(--fg-0)}
button[type=submit]{padding:13px;border-radius:10px;border:0;background:var(--fg-0);color:var(--bg-0);font-weight:700;cursor:pointer}
button:disabled{opacity:.4}
.err{color:var(--red);font-size:13px}
`
