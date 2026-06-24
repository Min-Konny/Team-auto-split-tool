import type { NextApiRequest, NextApiResponse } from 'next'
import { assertAdminForUsers } from '@/lib/communityUsersServer'
import {
  ensurePresetCommunitiesAndSplit,
  ensureShiftMembersFromDefault,
} from '@/lib/splitCommunitiesByTags'
import { assertSessionSecretConfigured } from '@/lib/sessionSecret'

/** 249 / きらくに / SHIFT の作成と default からのタグ分離（冪等） */
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

  const secret = process.env.MIGRATION_SECRET || process.env.SESSION_SECRET
  const { migrationSecret } = req.body as { migrationSecret?: string }
  if (!secret || migrationSecret !== secret) {
    return res.status(403).json({ error: 'migrationSecret が不正です' })
  }

  try {
    const result = await ensurePresetCommunitiesAndSplit()
    const shiftMoved = await ensureShiftMembersFromDefault()
    return res.status(200).json({ ...result, shiftMoved })
  } catch (e) {
    console.error('setup-communities:', e)
    return res.status(500).json({ error: e instanceof Error ? e.message : '移行に失敗しました' })
  }
}
