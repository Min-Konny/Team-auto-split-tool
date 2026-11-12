import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCommunity } from '@/lib/useCommunity'

const links = [
  { href:'/community', label:'コミュ' },
  { href:'/players', label:'プレイヤー' },
  { href:'/players/new', label:'登録' },
  { href:'/matches', label:'試合履歴' },
  { href:'/team-maker', label:'チーム作成' },
]

export default function Header() {
  const { community, loading, refresh } = useCommunity()
  const router = useRouter()
  const logout = async () => {
    await fetch('/api/auth/logout', { method:'POST', credentials:'include' })
    refresh()
    router.push('/community/join')
  }
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand" aria-label="LoL Team Maker ホーム">
          <svg viewBox="0 0 40 44" fill="none" aria-hidden="true"><path d="M20 2 37 11v22L20 42 3 33V11Z" stroke="currentColor" strokeWidth="1.4"/><path d="M13 12h5v20h12v4H13Z" fill="currentColor"/><path d="M22 9h6v16h-6z" fill="currentColor" opacity=".45"/></svg>
          <span>LoL <strong>TEAM MAKER</strong></span>
        </Link>
        <nav className="site-nav" aria-label="メインナビゲーション">
          {links.map(({href,label}) => {
            const active = href === '/players' ? router.pathname === href : router.pathname.startsWith(href)
            return <Link key={href} href={href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>{label}</Link>
          })}
        </nav>
        {!loading && community && <details className="site-account">
          <summary>{community.name}<span aria-hidden="true">⌄</span></summary>
          <div><Link href="/community">コミュニティ</Link><button type="button" onClick={logout}>ログアウト</button></div>
        </details>}
      </div>
    </header>
  )
}
