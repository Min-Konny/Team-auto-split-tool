import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { FieldValue } from 'firebase-admin/firestore'
import { Timestamp, collection, doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebaseAdmin'
import { assertAdminForUsers } from '@/lib/communityUsersServer'
import { encodeSession, newSessionPayload, sessionCookieHeader } from '@/lib/sessionCookie'
import { assertSessionSecretConfigured } from '@/lib/sessionSecret'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertSessionSecretConfigured()
    assertAdminForUsers()
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Server misconfigured' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, password } = req.body as {
    name?: string
    password?: string
  }
  if (!name?.trim()) return res.status(400).json({ error: 'コミュニティ名が必要です' })
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'パスワードは4文字以上にしてください' })
  }

  const passcodeHash = await bcrypt.hash(password, 10)

  try {
    if (isAdminConfigured()) {
      const adb = getAdminFirestore()
      const ref = adb.collection('communities').doc()
      await ref.set({
        name: name.trim(),
        passcodeHash,
        createdAt: FieldValue.serverTimestamp(),
      })
      const communityId = ref.id
      const token = encodeSession(newSessionPayload(communityId))
      res.setHeader('Set-Cookie', sessionCookieHeader(token))
      return res.status(201).json({ communityId, name: name.trim() })
    }

    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT_JSON が未設定です' })
    }

    const ref = doc(collection(db, 'communities'))
    await setDoc(ref, {
      name: name.trim(),
      passcodeHash,
      createdAt: Timestamp.now(),
    })
    return res.status(501).json({
      error: 'ローカルでは Admin 未設定のため作成できません。FIREBASE_SERVICE_ACCOUNT_JSON を設定してください。',
      communityId: ref.id,
    })
  } catch (e) {
    console.error('community create:', e)
    return res.status(500).json({ error: e instanceof Error ? e.message : '作成に失敗しました' })
  }
}
