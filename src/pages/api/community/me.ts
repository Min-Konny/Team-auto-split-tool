import type { NextApiRequest, NextApiResponse } from 'next'
import { decodeSession, SESSION_COOKIE } from '@/lib/sessionCookie'
import { getDoc } from 'firebase/firestore'
import { communityDoc } from '@/lib/paths'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.cookies[SESSION_COOKIE]
  if (!token) return res.status(200).json({ community: null })

  const session = decodeSession(token)
  if (!session) return res.status(200).json({ community: null })

  const snap = await getDoc(communityDoc(session.communityId))
  if (!snap.exists()) return res.status(200).json({ community: null })

  const data = snap.data()
  return res.status(200).json({
    community: {
      id: snap.id,
      name: data?.name,
      hasPasscode: !!data?.passcodeHash,
    },
  })
}
