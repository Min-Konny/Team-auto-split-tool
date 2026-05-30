import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import { DEFAULT_COMMUNITY_ID } from '@/constants/community'

export default function CommunityJoinPage() {
  const [communityId, setCommunityId] = useState(DEFAULT_COMMUNITY_ID)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  const enterDefault = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/community/enter-default', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '失敗しました')
      router.push('/team-maker')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラー')
    } finally {
      setBusy(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/community/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId: communityId.trim(), passcode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '認証に失敗しました')
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
        <title>コミュニティ参加 | Team Maker</title>
      </Head>
      <Header />
      <main className="comm-page">
        <Link href="/community" className="back">
          ← 戻る
        </Link>
        <h1>コミュニティに参加</h1>

        <section className="default-box">
          <h2>既存の「メイン」コミュニティ</h2>
          <p>これまでのプレイヤー・試合データはこちらに移行されています。</p>
          <button type="button" className="secondary" disabled={busy} onClick={enterDefault}>
            メインに入る（パスコードなし）
          </button>
        </section>

        <hr />

        <h2>別のコミュニティ</h2>
        <form onSubmit={submit}>
          <label>
            コミュニティ ID
            <input value={communityId} onChange={(e) => setCommunityId(e.target.value)} />
          </label>
          <label>
            パスコード
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="パスコードなしの場合は空欄"
            />
          </label>
          {error && <p className="err">{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? '確認中…' : '参加する'}
          </button>
        </form>
      </main>
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}

const css = `
.comm-page{max-width:420px;margin:0 auto;padding:40px 24px}
.back{font-size:12px;color:var(--fg-3);text-decoration:none}
.comm-page h1{font-family:'Space Grotesk';font-size:22px;margin:16px 0 20px}
.comm-page h2{font-size:15px;margin:0 0 8px}
.default-box{background:var(--bg-1);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:20px}
.default-box p{font-size:13px;color:var(--fg-2);margin:0 0 12px}
.secondary{width:100%;padding:12px;border-radius:9px;border:1px solid var(--line);background:transparent;color:var(--fg-0);font-weight:600;cursor:pointer}
hr{border:0;border-top:1px solid var(--line);margin:24px 0}
form{display:flex;flex-direction:column;gap:16px}
label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--fg-3)}
input{padding:11px 12px;border-radius:9px;border:1px solid var(--line);background:var(--bg-1);color:var(--fg-0)}
button{padding:13px;border-radius:10px;border:0;background:var(--fg-0);color:var(--bg-0);font-weight:700;cursor:pointer}
button:disabled{opacity:.4}
.err{color:var(--red);font-size:13px}
`
