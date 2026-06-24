import bcrypt from 'bcryptjs'
import { FieldValue } from 'firebase-admin/firestore'
import { PRESET_COMMUNITY_IDS } from '@/constants/community'
import { normalizeUsername, validateUsername } from '@/lib/communityAuth'
import { getAdminFirestore } from '@/lib/firebaseAdmin'

/** 既存メンバー向けの仮パスワード（初回ログイン後に変更推奨） */
export const SEED_USER_PASSWORD = '0000'

function baseUsernameFromMember(name: string, nickname: string | undefined, memberId: string): string {
  for (const raw of [nickname?.trim(), name.trim()]) {
    if (!raw) continue
    const sanitized = raw.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
    if (sanitized.length >= 3 && sanitized.length <= 20 && validateUsername(sanitized) === null) {
      return sanitized
    }
  }
  const idPart = memberId.replace(/[^a-zA-Z0-9]/g, '').slice(-16) || 'user'
  return `m_${idPart}`.slice(0, 20)
}

function uniqueUsername(base: string, used: Set<string>): string {
  let candidate = base.slice(0, 20)
  if (validateUsername(candidate)) {
    candidate = `m_${base.replace(/[^a-z0-9]/gi, '').slice(-12) || 'usr'}`.slice(0, 20)
  }
  let n = 2
  while (used.has(normalizeUsername(candidate)) || validateUsername(candidate)) {
    candidate = `${base.slice(0, 17)}_${n}`.slice(0, 20)
    n++
  }
  used.add(normalizeUsername(candidate))
  return candidate
}

export async function seedAuthUsersForCommunity(
  communityId: string
): Promise<{ created: number; skipped: number; usernames: string[] }> {
  const db = getAdminFirestore()
  const commRef = db.collection('communities').doc(communityId)
  const commSnap = await commRef.get()
  if (!commSnap.exists) return { created: 0, skipped: 0, usernames: [] }

  if (commSnap.data()?.authUsersSeededAt) {
    return { created: 0, skipped: 0, usernames: [] }
  }

  const membersSnap = await commRef.collection('members').get()
  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, 10)
  const used = new Set<string>()
  const createdNames: string[] = []
  let created = 0
  let skipped = 0

  let batch = db.batch()
  let ops = 0
  const flush = async () => {
    if (ops === 0) return
    await batch.commit()
    batch = db.batch()
    ops = 0
  }

  for (const d of membersSnap.docs) {
    const data = d.data()
    const name = (data.name as string) || ''
    const nickname = data.nickname as string | undefined

    const existing = await commRef.collection('users').where('linkedMemberId', '==', d.id).limit(1).get()
    if (!existing.empty) {
      skipped++
      continue
    }

    const base = baseUsernameFromMember(name, nickname, d.id)
    const username = uniqueUsername(base, used)
    const userRef = commRef.collection('users').doc()

    batch.set(userRef, {
      username,
      usernameLower: normalizeUsername(username),
      displayName: name || nickname || null,
      passwordHash,
      linkedMemberId: d.id,
      seeded: true,
      createdAt: FieldValue.serverTimestamp(),
    })
    createdNames.push(username)
    created++
    ops++
    if (ops >= 400) await flush()
  }

  batch.set(commRef, { authUsersSeededAt: FieldValue.serverTimestamp() }, { merge: true })
  ops++
  await flush()

  return { created, skipped, usernames: createdNames }
}

export async function ensureAuthUsersSeededForPresets(): Promise<
  Record<string, { created: number; skipped: number }>
> {
  const out: Record<string, { created: number; skipped: number }> = {}
  for (const id of PRESET_COMMUNITY_IDS) {
    const r = await seedAuthUsersForCommunity(id)
    out[id] = { created: r.created, skipped: r.skipped }
  }
  return out
}
