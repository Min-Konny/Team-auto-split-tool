import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '@/lib/apiAuth'
import { getDoc } from 'firebase/firestore'
import { communityDoc } from '@/lib/paths'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = getSessionFromRequest(req)
  if (!session) return res.status(200).json({ community: null, user: null })

  const snap = await getDoc(communityDoc(session.communityId))
  if (!snap.exists()) return res.status(200).json({ community: null, user: null })

  const data = snap.data()
  return res.status(200).json({
    community: {
      id: snap.id,
      name: data?.name,
      hasPasscode: !!data?.passcodeHash,
    },
    user: {
      id: session.userId,
      username: session.username,
    },
  })
}
