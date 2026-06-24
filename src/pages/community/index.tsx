import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import { useCommunity } from '@/lib/useCommunity'

export default function CommunityIndexPage() {
  const { community, loading } = useCommunity()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/community/join')
  }

  return (
    <>
      <Head>
        <title>コミュニティ | Team Maker</title>
      </Head>
      <Header />
      <main className="comm-page">
        <h1>コミュニティ</h1>

        {!loading && community && (
          <section className="session-box">
            <p>
              <strong>{community.name}</strong> にログイン中
            </p>
            <button type="button" className="secondary" onClick={logout}>
              ログアウト
            </button>
          </section>
        )}

        <div className="cards">
          <Link href="/community/join" className="card">
            <h2>ログイン</h2>
            <p>249 ・ きらくに ・ SHIFT</p>
          </Link>
          <Link href="/community/create" className="card">
            <h2>新しいコミュニティを作る</h2>
            <p>名前とパスワードを設定</p>
          </Link>
        </div>
      </main>
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}

const css = `
.comm-page{max-width:480px;margin:0 auto;padding:40px 24px}
.comm-page h1{font-family:'Space Grotesk';font-size:22px;margin:0 0 24px}
.session-box{background:var(--bg-1);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:24px}
.session-box p{margin:0 0 8px;font-size:14px}
.secondary{margin-top:12px;width:100%;padding:10px;border-radius:9px;border:1px solid var(--line);background:transparent;color:var(--fg-0);font-weight:600;cursor:pointer}
.cards{display:flex;flex-direction:column;gap:12px}
.card{display:block;padding:18px;border-radius:12px;border:1px solid var(--line);background:var(--bg-1);text-decoration:none;color:inherit}
.card h2{font-size:15px;margin:0 0 6px}
.card p{font-size:12px;color:var(--fg-2);margin:0}
.card:hover{border-color:var(--line-2)}
`
