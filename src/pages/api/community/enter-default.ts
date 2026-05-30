import type { NextApiRequest, NextApiResponse } from 'next'
import { DEFAULT_COMMUNITY_ID } from '@/constants/community'
import { runDefaultMigration } from '@/lib/migrationServer'
import { assertSessionSecretConfigured } from '@/lib/sessionSecret'
import { encodeSession, newSessionPayload, sessionCookieHeader } from '@/lib/sessionCookie'

/** 既定コミュ「メイン」へパスコードなしで入る */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    assertSessionSecretConfigured()
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Server misconfigured' })
  }

  await runDefaultMigration()
  const token = encodeSession(newSessionPayload(DEFAULT_COMMUNITY_ID))
  res.setHeader('Set-Cookie', sessionCookieHeader(token))
  return res.status(200).json({ communityId: DEFAULT_COMMUNITY_ID, name: 'メイン' })
}
