import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '@/components/Header'

export default function CommunityCreatePage() {
  const [name, setName] = useState('')
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/community/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, passcode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '作成に失敗しました')
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
        <title>コミュニティ作成 | Team Maker</title>
      </Head>
      <Header />
      <main className="comm-page">
        <Link href="/community" className="back">
          ← 戻る
        </Link>
        <h1>コミュニティを作成</h1>
        <form onSubmit={submit}>
          <label>
            名前
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            パスコード（4文字以上）
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              minLength={4}
              required
            />
          </label>
          {error && <p className="err">{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? '作成中…' : '作成して始める'}
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
form{display:flex;flex-direction:column;gap:16px}
label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--fg-3)}
input{padding:11px 12px;border-radius:9px;border:1px solid var(--line);background:var(--bg-1);color:var(--fg-0)}
button{padding:13px;border-radius:10px;border:0;background:var(--fg-0);color:var(--bg-0);font-weight:700;cursor:pointer}
button:disabled{opacity:.4}
.err{color:var(--red);font-size:13px}
`
