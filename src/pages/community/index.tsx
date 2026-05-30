import Head from 'next/head'
import Link from 'next/link'
import Header from '@/components/Header'

export default function CommunityIndexPage() {
  return (
    <>
      <Head>
        <title>コミュニティ | Team Maker</title>
      </Head>
      <Header />
      <main className="comm-page">
        <h1>コミュニティ</h1>
        <p className="lead">内戦メンバーごとにデータを分けて管理します。</p>
        <div className="cards">
          <Link href="/community/join" className="card">
            <span className="card-t">参加する</span>
            <span className="card-d">招待リンク・パスコードで既存コミュに入る</span>
          </Link>
          <Link href="/community/create" className="card">
            <span className="card-t">新規作成</span>
            <span className="card-d">新しいコミュニティを作る</span>
          </Link>
        </div>
      </main>
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}

const css = `
.comm-page{max-width:520px;margin:0 auto;padding:40px 24px}
.comm-page h1{font-family:'Space Grotesk';font-size:24px;margin:0 0 8px}
.lead{color:var(--fg-2);font-size:14px;margin-bottom:28px}
.cards{display:flex;flex-direction:column;gap:12px}
.card{display:block;padding:20px;border-radius:12px;border:1px solid var(--line);background:var(--bg-1);text-decoration:none;color:inherit}
.card:hover{border-color:var(--line-2)}
.card-t{display:block;font-weight:700;font-size:16px;margin-bottom:6px}
.card-d{font-size:13px;color:var(--fg-3)}
`
