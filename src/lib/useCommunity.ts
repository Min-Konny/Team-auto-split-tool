import { useEffect, useState } from 'react'

export interface CommunityInfo {
  id: string
  name: string
  hasPasscode: boolean
}

export function useCommunity() {
  const [community, setCommunity] = useState<CommunityInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    setLoading(true)
    fetch('/api/community/me')
      .then((r) => r.json())
      .then((d) => {
        setCommunity(d.community ?? null)
      })
      .catch(() => {
        setCommunity(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [])

  return { community, loading, refresh }
}
