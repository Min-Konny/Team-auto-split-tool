import { useEffect, useState } from 'react'

export interface CommunityInfo {
  id: string
  name: string
  hasPasscode: boolean
}

export interface AuthUserInfo {
  id: string
  username: string
}

export function useCommunity() {
  const [community, setCommunity] = useState<CommunityInfo | null>(null)
  const [user, setUser] = useState<AuthUserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    setLoading(true)
    fetch('/api/community/me')
      .then((r) => r.json())
      .then((d) => {
        setCommunity(d.community ?? null)
        setUser(d.user ?? null)
      })
      .catch(() => {
        setCommunity(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [])

  return { community, user, loading, refresh }
}
