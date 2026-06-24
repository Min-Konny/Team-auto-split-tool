import bcrypt from 'bcryptjs'
import { FieldValue } from 'firebase-admin/firestore'
import {
  COMMUNITY_249_ID,
  COMMUNITY_KIRAKUNI_ID,
  DEFAULT_COMMUNITY_ID,
  PRESET_COMMUNITIES,
  TAG_249,
  TAG_KIRAKUNI,
} from '@/constants/community'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { runDefaultMigration } from '@/lib/migrationServer'
import { ensureAuthUsersSeededForPresets } from '@/lib/seedCommunityAuthUsers'

const BATCH_LIMIT = 450

function targetCommunityForTags(tags: string[] | undefined): typeof COMMUNITY_249_ID | typeof COMMUNITY_KIRAKUNI_ID | null {
  const t = tags ?? []
  const has249 = t.includes(TAG_249)
  const hasKira = t.includes(TAG_KIRAKUNI)
  if (has249 && !hasKira) return COMMUNITY_249_ID
  if (hasKira && !has249) return COMMUNITY_KIRAKUNI_ID
  if (has249 && hasKira) return COMMUNITY_249_ID
  return null
}

/** 249 / きらくに コミュニティ作成 + default からタグでメンバー・試合を分離 */
export async function ensurePresetCommunitiesAndSplit(): Promise<{
  presetCreated: boolean
  split: boolean
  counts: { '249': number; kirakuni: number }
  authUsers: Record<string, { created: number; skipped: number }>
}> {
  const db = getAdminFirestore()
  let presetCreated = false

  for (const preset of PRESET_COMMUNITIES) {
    const ref = db.collection('communities').doc(preset.id)
    const snap = await ref.get()
    if (!snap.exists) {
      const passcodeHash = await bcrypt.hash(preset.passcode, 10)
      await ref.set({
        name: preset.name,
        passcodeHash,
        createdAt: FieldValue.serverTimestamp(),
      })
      presetCreated = true
    }
  }

  const defaultRef = db.collection('communities').doc(DEFAULT_COMMUNITY_ID)
  const defaultSnap = await defaultRef.get()
  if (!defaultSnap.exists) {
    await runDefaultMigration()
  }

  const splitFlag = defaultSnap.data()?.splitByTagsAt
  if (splitFlag) {
    const c249 = await db.collection('communities').doc(COMMUNITY_249_ID).collection('members').get()
    const cKira = await db.collection('communities').doc(COMMUNITY_KIRAKUNI_ID).collection('members').get()
    const authUsers = await ensureAuthUsersSeededForPresets()
    return {
      presetCreated,
      split: false,
      counts: { '249': c249.size, kirakuni: cKira.size },
      authUsers,
    }
  }

  const membersSnap = await defaultRef.collection('members').get()
  const memberTargets = new Map<string, typeof COMMUNITY_249_ID | typeof COMMUNITY_KIRAKUNI_ID>()
  const counts = { '249': 0, kirakuni: 0 }

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
    const target = targetCommunityForTags(data.tags as string[] | undefined)
    if (!target) continue
    memberTargets.set(d.id, target)
    const dest = db.collection('communities').doc(target).collection('members').doc(d.id)
    batch.set(dest, data, { merge: true })
    ops++
    if (target === COMMUNITY_249_ID) counts['249']++
    else counts.kirakuni++
    if (ops >= BATCH_LIMIT) await flush()
  }

  const matchesSnap = await defaultRef.collection('matches').get()
  for (const d of matchesSnap.docs) {
    const data = d.data()
    const players = (data.players as { playerId: string }[]) ?? []
    if (players.length === 0) continue
    const targets = players
      .map((p) => memberTargets.get(p.playerId))
      .filter((t): t is typeof COMMUNITY_249_ID | typeof COMMUNITY_KIRAKUNI_ID => !!t)
    const unique = Array.from(new Set(targets))
    if (unique.length !== 1) continue
    const target = unique[0]!
    batch.set(db.collection('communities').doc(target).collection('matches').doc(d.id), data, { merge: true })
    ops++
    if (ops >= BATCH_LIMIT) await flush()
  }

  batch.set(
    defaultRef,
    { splitByTagsAt: FieldValue.serverTimestamp(), migrationInProgress: false },
    { merge: true }
  )
  ops++
  await flush()

  const authUsers = await ensureAuthUsersSeededForPresets()
  return { presetCreated, split: true, counts, authUsers }
}
