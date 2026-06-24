import type { NextApiRequest, NextApiResponse } from 'next'
import { assertAdminForUsers, verifyCommunityPassword } from '@/lib/communityUsersServer'
import { ensurePresetCommunitiesAndSplit } from '@/lib/splitCommunitiesByTags'
import { encodeSession, newSessionPayload, sessionCookieHeader } from '@/lib/sessionCookie'
import { assertSessionSecretConfigured } from '@/lib/sessionSecret'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { PRESET_COMMUNITY_IDS } from '@/constants/community'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    assertSessionSecretConfigured()
    assertAdminForUsers()
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Server misconfigured' })
  }

  const { communityId, password } = req.body as {
    communityId?: string
    password?: string
  }

  const cid = communityId?.trim()
  if (!cid || !password) {
    return res.status(400).json({ error: 'コミュニティとパスワードが必要です' })
  }

  try {
    if (PRESET_COMMUNITY_IDS.includes(cid as (typeof PRESET_COMMUNITY_IDS)[number])) {
      await ensurePresetCommunitiesAndSplit()
    }

    const comm = await getAdminFirestore().collection('communities').doc(cid).get()
    if (!comm.exists) return res.status(404).json({ error: 'コミュニティが見つかりません' })

    const ok = await verifyCommunityPassword(cid, password)
    if (!ok) return res.status(401).json({ error: 'パスワードが違います' })

    const token = encodeSession(newSessionPayload(cid))
    res.setHeader('Set-Cookie', sessionCookieHeader(token))
    return res.status(200).json({
      communityId: cid,
      name: comm.data()?.name,
    })
  } catch (e) {
    console.error('auth login:', e)
    return res.status(500).json({ error: e instanceof Error ? e.message : 'ログインに失敗しました' })
  }
}
