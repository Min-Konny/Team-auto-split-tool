import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionFromRequest } from '@/lib/apiAuth'
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebaseAdmin'
import { db } from '@/lib/firebase'
import { normalizeRoleMap, validateRoleMap } from '@/lib/roleTier'
import { assertSessionSecretConfigured } from '@/lib/sessionSecret'
import { RoleMap } from '@/types/member'
import { doc, setDoc } from 'firebase/firestore'

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

  const session = getSessionFromRequest(req)
  if (!session) {
    return res.status(401).json({ error: 'コミュニティに参加してください' })
  }

  const { memberId, name, nickname, elo, roles, tags } = req.body as {
    memberId?: string
    name?: string
    nickname?: string
    elo?: number
    roles?: RoleMap
    tags?: string[]
  }

  if (!memberId || !name?.trim() || typeof elo !== 'number' || !roles) {
    return res.status(400).json({ error: '入力が不正です' })
  }

  const roleErr = validateRoleMap(roles)
  if (roleErr) return res.status(400).json({ error: roleErr })

  const { roles: normalizedRoles, mainRole } = normalizeRoleMap(roles)
  const payload = {
    name: name.trim(),
    nickname: nickname?.trim() || null,
    elo: Math.round(elo),
    roles: normalizedRoles,
    mainRole,
    tags: Array.isArray(tags) ? tags : [],
  }

  try {
    if (isAdminConfigured()) {
      const adb = getAdminFirestore()
      await adb
        .collection('communities')
        .doc(session.communityId)
        .collection('members')
        .doc(memberId)
        .set(payload, { merge: true })
    } else {
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT_JSON が未設定です' })
      }
      await setDoc(doc(db, 'communities', session.communityId, 'members', memberId), payload, {
        merge: true,
      })
    }
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('member update:', e)
    return res.status(500).json({ error: e instanceof Error ? e.message : '更新に失敗しました' })
  }
}
