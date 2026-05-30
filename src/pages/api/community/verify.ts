import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { getDoc } from 'firebase/firestore'
import { DEFAULT_COMMUNITY_ID } from '@/constants/community'
import { communityDoc } from '@/lib/paths'
import { encodeSession, newSessionPayload, sessionCookieHeader } from '@/lib/sessionCookie'
import { assertSessionSecretConfigured } from '@/lib/sessionSecret'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertSessionSecretConfigured()
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Server misconfigured' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { communityId, passcode } = req.body as { communityId?: string; passcode?: string }
  const id = communityId?.trim() || DEFAULT_COMMUNITY_ID

  const snap = await getDoc(communityDoc(id))
  if (!snap.exists()) return res.status(404).json({ error: 'コミュニティが見つかりません' })

  const data = snap.data()
  const hash = data?.passcodeHash as string | null | undefined

  if (hash) {
    if (!passcode) return res.status(400).json({ error: 'パスコードが必要です' })
    const ok = await bcrypt.compare(passcode, hash)
    if (!ok) return res.status(401).json({ error: 'パスコードが違います' })
  }

  const token = encodeSession(newSessionPayload(id))
  res.setHeader('Set-Cookie', sessionCookieHeader(token))
  return res.status(200).json({ communityId: id, name: data?.name })
}
