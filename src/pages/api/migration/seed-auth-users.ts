import type { NextApiRequest, NextApiResponse } from 'next'
import { PRESET_COMMUNITY_IDS } from '@/constants/community'
import { assertAdminForUsers } from '@/lib/communityUsersServer'
import { assertSessionSecretConfigured } from '@/lib/sessionSecret'
import { seedAuthUsersForCommunity } from '@/lib/seedCommunityAuthUsers'

/** 既存メンバーに仮パスワード 0000 のログインアカウントを作成（冪等・コミュニティ単位） */
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
  const { migrationSecret, communityId, force } = req.body as {
    migrationSecret?: string
    communityId?: string
    force?: boolean
  }
  if (!secret || migrationSecret !== secret) {
    return res.status(403).json({ error: 'migrationSecret が不正です' })
  }

  try {
    const targets = communityId?.trim()
      ? PRESET_COMMUNITY_IDS.includes(communityId.trim() as (typeof PRESET_COMMUNITY_IDS)[number])
        ? [communityId.trim()]
        : [communityId.trim()]
      : [...PRESET_COMMUNITY_IDS]

    const results: Record<string, unknown> = {}
    for (const id of targets) {
      if (force) {
        const { getAdminFirestore } = await import('@/lib/firebaseAdmin')
        const { FieldValue } = await import('firebase-admin/firestore')
        await getAdminFirestore()
          .collection('communities')
          .doc(id)
          .update({ authUsersSeededAt: FieldValue.delete() })
      }
      results[id] = await seedAuthUsersForCommunity(id)
    }
    return res.status(200).json({
      password: '0000',
      note: 'ログインはコミュニティ + ユーザー名 + パスワード 0000。初回登録のパスコードは別途必要です。',
      results,
    })
  } catch (e) {
    console.error('seed-auth-users:', e)
    return res.status(500).json({ error: e instanceof Error ? e.message : '作成に失敗しました' })
  }
}
