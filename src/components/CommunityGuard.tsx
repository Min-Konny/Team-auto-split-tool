import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useCommunity } from '@/lib/useCommunity'

const PUBLIC_PREFIXES = ['/community', '/join/lobby']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

type Props = {
  children: React.ReactNode
}

export default function CommunityGuard({ children }: Props) {
  const router = useRouter()
  const { community, loading } = useCommunity()

  useEffect(() => {
    if (loading || !router.isReady) return
    if (isPublicPath(router.pathname)) return
    if (!community) {
      router.replace('/community/join')
    }
  }, [loading, community, router, router.isReady, router.pathname])

  if (loading && !isPublicPath(router.pathname)) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--fg-3)', fontFamily: 'JetBrains Mono', fontSize: 13 }}>
        読み込み中…
      </div>
    )
  }

  if (!community && !isPublicPath(router.pathname)) {
    return null
  }

  return <>{children}</>
}
