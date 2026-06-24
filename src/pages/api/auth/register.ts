import type { NextApiRequest, NextApiResponse } from 'next'
import {
  assertAdminForUsers,
  createCommunityUser,
  verifyCommunityPasscode,
} from '@/lib/communityUsersServer'
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

  const { communityId, passcode, username, password, displayName } = req.body as {
    communityId?: string
    username?: string
    password?: string
    passcode?: string
    displayName?: string
  }

  const cid = communityId?.trim()
  if (!cid || !passcode || !username?.trim() || !password) {
    return res.status(400).json({ error: 'すべての項目を入力してください' })
  }

  try {
    if (PRESET_COMMUNITY_IDS.includes(cid as (typeof PRESET_COMMUNITY_IDS)[number])) {
      await ensurePresetCommunitiesAndSplit()
    }

    const comm = await getAdminFirestore().collection('communities').doc(cid).get()
    if (!comm.exists) return res.status(404).json({ error: 'コミュニティが見つかりません' })

    const passOk = await verifyCommunityPasscode(cid, passcode)
    if (!passOk) return res.status(401).json({ error: 'コミュニティのパスコードが違います' })

    const user = await createCommunityUser(cid, username, password, displayName)
    const token = encodeSession(newSessionPayload(cid, user.id, user.username))
    res.setHeader('Set-Cookie', sessionCookieHeader(token))
    return res.status(201).json({
      communityId: cid,
      name: comm.data()?.name,
      user,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '登録に失敗しました'
    const code = msg.includes('既に') ? 409 : 500
    console.error('auth register:', e)
    return res.status(code).json({ error: msg })
  }
}
