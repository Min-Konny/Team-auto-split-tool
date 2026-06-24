import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '@/lib/apiAuth'
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebaseAdmin'
import { getDoc } from 'firebase/firestore'
import { communityDoc } from '@/lib/paths'
import { db } from '@/lib/firebase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = getSessionFromRequest(req)
  if (!session) return res.status(200).json({ community: null })

  try {
    if (isAdminConfigured()) {
      const snap = await getAdminFirestore().collection('communities').doc(session.communityId).get()
      if (!snap.exists) return res.status(200).json({ community: null })
      const data = snap.data()
      return res.status(200).json({
        community: {
          id: snap.id,
          name: data?.name,
          hasPasscode: !!data?.passcodeHash,
        },
      })
    }

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
  } catch (e) {
    console.error('community/me:', e)
    return res.status(500).json({ error: e instanceof Error ? e.message : '取得に失敗しました' })
  }
}
