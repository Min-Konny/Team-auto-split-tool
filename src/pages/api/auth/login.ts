import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { assertAdminForUsers, findUserByUsername } from '@/lib/communityUsersServer'
import { encodeSession, newSessionPayload, sessionCookieHeader } from '@/lib/sessionCookie'
import { assertSessionSecretConfigured } from '@/lib/sessionSecret'
import { getAdminFirestore } from '@/lib/firebaseAdmin'

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

  const { communityId, username, password } = req.body as {
    communityId?: string
    username?: string
    password?: string
  }

  const cid = communityId?.trim()
  if (!cid || !username?.trim() || !password) {
    return res.status(400).json({ error: 'コミュニティ・ユーザー名・パスワードが必要です' })
  }

  try {
    const comm = await getAdminFirestore().collection('communities').doc(cid).get()
    if (!comm.exists) return res.status(404).json({ error: 'コミュニティが見つかりません' })

    const user = await findUserByUsername(cid, username)
    if (!user) return res.status(401).json({ error: 'ユーザー名またはパスワードが違います' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'ユーザー名またはパスワードが違います' })

    const token = encodeSession(newSessionPayload(cid, user.id, user.username))
    res.setHeader('Set-Cookie', sessionCookieHeader(token))
    return res.status(200).json({
      communityId: cid,
      name: comm.data()?.name,
      user: { id: user.id, username: user.username, displayName: user.displayName },
    })
  } catch (e) {
    console.error('auth login:', e)
    return res.status(500).json({ error: e instanceof Error ? e.message : 'ログインに失敗しました' })
  }
}
