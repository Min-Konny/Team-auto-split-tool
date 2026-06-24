import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '@/components/Header'

export default function CommunityCreatePage() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/community/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '作成に失敗しました')
      const me = await fetch('/api/community/me', { credentials: 'include' })
      const meData = await me.json()
      if (meData.community) {
        window.location.href = '/team-maker'
        return
      }
      setCreated({ id: data.communityId, name: data.name })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラー')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Head>
        <title>コミュニティ作成 | Team Maker</title>
      </Head>
      <Header />
      <main className="comm-page">
        <Link href="/" className="back">
          ← トップへ
        </Link>
        <h1>コミュニティを作成</h1>
        <p className="lead">
          コミュニティ名と<strong>ログインパスワード</strong>を設定します。メンバーには ID とパスワードを共有してください。
        </p>
        {created ? (
          <div className="success-box">
            <p>
              <strong>{created.name}</strong> を作成しました
            </p>
            <p className="id-label">コミュニティ ID（メンバーに共有）</p>
            <code className="id-code">{created.id}</code>
            <button type="button" onClick={() => { window.location.href = '/team-maker' }}>
              チーム作成へ進む
            </button>
          </div>
        ) : (
        <form onSubmit={submit}>
          <label>
            コミュニティ名
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            ログインパスワード（4文字以上）
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={4}
              required
            />
          </label>
          {error && <p className="err">{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? '作成中…' : '作成してログイン'}
          </button>
        </form>
        )}
      </main>
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}

const css = `
.comm-page{max-width:420px;margin:0 auto;padding:40px 24px}
.back{font-size:12px;color:var(--fg-3);text-decoration:none}
.comm-page h1{font-family:'Space Grotesk';font-size:22px;margin:16px 0 8px}
.lead{font-size:13px;color:var(--fg-2);line-height:1.5;margin:0 0 20px}
form{display:flex;flex-direction:column;gap:16px}
label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--fg-3)}
input{padding:11px 12px;border-radius:9px;border:1px solid var(--line);background:var(--bg-1);color:var(--fg-0)}
button{padding:13px;border-radius:10px;border:0;background:var(--fg-0);color:var(--bg-0);font-weight:700;cursor:pointer}
button:disabled{opacity:.4}
.err{color:var(--red);font-size:13px}
.success-box{display:flex;flex-direction:column;gap:14px;padding:18px;border-radius:12px;border:1px solid var(--line);background:var(--bg-1)}
.success-box p{margin:0;font-size:14px}
.id-label{margin:0;font-size:12px;color:var(--fg-3)}
.id-code{display:block;padding:12px;border-radius:8px;background:var(--bg-0);border:1px solid var(--line);font-family:'JetBrains Mono';font-size:13px;word-break:break-all}
.success-box button{padding:13px;border-radius:10px;border:0;background:var(--fg-0);color:var(--bg-0);font-weight:700;cursor:pointer}
`
