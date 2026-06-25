import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import { useCommunity } from '@/lib/useCommunity'

export default function CommunityCreatePage() {
  const router = useRouter()
  const { community, loading } = useCommunity()
  const [copied, setCopied] = useState(false)

  const successId = typeof router.query.id === 'string' ? router.query.id : null
  const successName = typeof router.query.name === 'string' ? router.query.name : null
  const queryError = typeof router.query.error === 'string' ? router.query.error : null
  const created =
    router.query.success === '1' && successId
      ? { id: successId, name: successName || 'コミュニティ' }
      : null

  useEffect(() => {
    if (queryError) return
    if (!loading && community && !created) {
      router.replace('/team-maker')
    }
  }, [loading, community, created, queryError, router])

  const copyId = async () => {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
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
          コミュニティ名と<strong>ログインパスワード</strong>を設定します。作成後に表示される
          <strong>コミュニティ ID</strong>は必ず控えてください（次回ログインに必要です）。
        </p>

        {created ? (
          <div className="success-box">
            <p>
              <strong>{created.name}</strong> を作成しました
            </p>
            <p className="id-label">コミュニティ ID（必ずメモ・共有してください）</p>
            <code className="id-code">{created.id}</code>
            <button type="button" className="secondary" onClick={copyId}>
              {copied ? 'コピーしました' : 'ID をコピー'}
            </button>
            <p className="hint">
              次回ログインするときは、ログイン画面で<strong>「その他」</strong>を選び、この ID とパスワードを入力してください。
            </p>
            <button type="button" onClick={() => { window.location.href = '/team-maker' }}>
              チーム作成へ進む
            </button>
          </div>
        ) : (
          <form method="POST" action="/api/community/create">
            <label>
              コミュニティ名
              <input name="name" required autoComplete="organization" />
            </label>
            <label>
              ログインパスワード（4文字以上）
              <input
                type="password"
                name="password"
                minLength={4}
                required
                autoComplete="new-password"
              />
            </label>
            {queryError && <p className="err">{queryError}</p>}
            <button type="submit">作成してログイン</button>
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
button.secondary{background:transparent;color:var(--fg-0);border:1px solid var(--line)}
button:disabled{opacity:.4}
.err{color:var(--red);font-size:13px;margin:0}
.success-box{display:flex;flex-direction:column;gap:14px;padding:18px;border-radius:12px;border:1px solid var(--line);background:var(--bg-1)}
.success-box p{margin:0;font-size:14px}
.hint{margin:0;font-size:12px;color:var(--fg-2);line-height:1.55}
.id-label{margin:0;font-size:12px;color:var(--fg-3)}
.id-code{display:block;padding:12px;border-radius:8px;background:var(--bg-0);border:1px solid var(--line);font-family:'JetBrains Mono';font-size:13px;word-break:break-all}
`
