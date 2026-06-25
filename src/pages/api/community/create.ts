import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { FieldValue } from 'firebase-admin/firestore'
import { assertAdminForUsers } from '@/lib/communityUsersServer'
import {
  isFormLogin,
  redirectCreateError,
  redirectCreateSuccess,
} from '@/lib/authRedirect'
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebaseAdmin'
import { encodeSession, newSessionPayload, sessionCookieHeader } from '@/lib/sessionCookie'
import { assertSessionSecretConfigured } from '@/lib/sessionSecret'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = isFormLogin(req)

  try {
    assertSessionSecretConfigured()
    assertAdminForUsers()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server misconfigured'
    if (form) return redirectCreateError(res, msg)
    return res.status(500).json({ error: msg })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!isAdminConfigured()) {
    const msg = 'FIREBASE_SERVICE_ACCOUNT_JSON が未設定のためコミュニティを作成できません'
    if (form) return redirectCreateError(res, msg)
    return res.status(500).json({ error: msg })
  }

  const { name, password } = req.body as {
    name?: string
    password?: string
  }
  if (!name?.trim()) {
    if (form) return redirectCreateError(res, 'コミュニティ名が必要です')
    return res.status(400).json({ error: 'コミュニティ名が必要です' })
  }
  if (!password || password.length < 4) {
    if (form) return redirectCreateError(res, 'パスワードは4文字以上にしてください')
    return res.status(400).json({ error: 'パスワードは4文字以上にしてください' })
  }

  const passcodeHash = await bcrypt.hash(password, 10)

  try {
    const adb = getAdminFirestore()
    const ref = adb.collection('communities').doc()
    await ref.set({
      name: name.trim(),
      passcodeHash,
      createdAt: FieldValue.serverTimestamp(),
    })
    const communityId = ref.id
    const token = encodeSession(newSessionPayload(communityId))
    const cookie = sessionCookieHeader(token)

    if (form) {
      return redirectCreateSuccess(res, communityId, name.trim(), cookie)
    }

    res.setHeader('Set-Cookie', cookie)
    return res.status(201).json({ communityId, name: name.trim() })
  } catch (e) {
    console.error('community create:', e)
    const msg = e instanceof Error ? e.message : '作成に失敗しました'
    if (form) return redirectCreateError(res, msg)
    return res.status(500).json({ error: msg })
  }
}
