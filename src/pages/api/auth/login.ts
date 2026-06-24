import type { NextApiRequest, NextApiResponse } from 'next'
import { assertAdminForUsers, verifyCommunityPassword } from '@/lib/communityUsersServer'
import { ensurePresetCommunitiesAndSplit } from '@/lib/splitCommunitiesByTags'
import { encodeSession, newSessionPayload, sessionCookieHeader } from '@/lib/sessionCookie'
import { assertSessionSecretConfigured } from '@/lib/sessionSecret'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { PRESET_COMMUNITY_IDS } from '@/constants/community'
import {
  isFormLogin,
  redirectLoginError,
  redirectWithCookie,
  safeRedirectPath,
} from '@/lib/authRedirect'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const form = isFormLogin(req)

  try {
    assertSessionSecretConfigured()
    assertAdminForUsers()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server misconfigured'
    if (form) return redirectLoginError(res, msg)
    return res.status(500).json({ error: msg })
  }

  const { communityId, password, redirect } = req.body as {
    communityId?: string
    password?: string
    redirect?: string
  }

  const cid = communityId?.trim()
  if (!cid || !password) {
    if (form) return redirectLoginError(res, 'コミュニティとパスワードが必要です', cid)
    return res.status(400).json({ error: 'コミュニティとパスワードが必要です' })
  }

  try {
    if (PRESET_COMMUNITY_IDS.includes(cid as (typeof PRESET_COMMUNITY_IDS)[number])) {
      await ensurePresetCommunitiesAndSplit()
    }

    const comm = await getAdminFirestore().collection('communities').doc(cid).get()
    if (!comm.exists) {
      if (form) return redirectLoginError(res, 'コミュニティが見つかりません', cid)
      return res.status(404).json({ error: 'コミュニティが見つかりません' })
    }

    const ok = await verifyCommunityPassword(cid, password)
    if (!ok) {
      if (form) return redirectLoginError(res, 'パスワードが違います', cid)
      return res.status(401).json({ error: 'パスワードが違います' })
    }

    const token = encodeSession(newSessionPayload(cid))
    const cookie = sessionCookieHeader(token)

    if (form) {
      return redirectWithCookie(res, safeRedirectPath(redirect), cookie)
    }

    res.setHeader('Set-Cookie', cookie)
    return res.status(200).json({
      communityId: cid,
      name: comm.data()?.name,
    })
  } catch (e) {
    console.error('auth login:', e)
    const msg = e instanceof Error ? e.message : 'ログインに失敗しました'
    if (form) return redirectLoginError(res, msg, cid)
    return res.status(500).json({ error: msg })
  }
}
