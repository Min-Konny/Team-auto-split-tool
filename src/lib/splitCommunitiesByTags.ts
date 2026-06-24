import bcrypt from 'bcryptjs'
import { FieldValue } from 'firebase-admin/firestore'
import {
  COMMUNITY_249_ID,
  COMMUNITY_KIRAKUNI_ID,
  COMMUNITY_SHIFT_ID,
  DEFAULT_COMMUNITY_ID,
  PRESET_COMMUNITIES,
  TAG_249,
  TAG_KIRAKUNI,
  TAG_SHIFT,
} from '@/constants/community'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { runDefaultMigration } from '@/lib/migrationServer'

const BATCH_LIMIT = 450

type PresetCommunityId = typeof COMMUNITY_249_ID | typeof COMMUNITY_KIRAKUNI_ID | typeof COMMUNITY_SHIFT_ID

function targetCommunityForTags(tags: string[] | undefined): PresetCommunityId | null {
  const t = tags ?? []
  const has249 = t.includes(TAG_249)
  const hasKira = t.includes(TAG_KIRAKUNI)
  const hasShift = t.includes(TAG_SHIFT)
  if (has249) return COMMUNITY_249_ID
  if (hasKira) return COMMUNITY_KIRAKUNI_ID
  if (hasShift) return COMMUNITY_SHIFT_ID
  return null
}

async function syncPresetCommunities(): Promise<boolean> {
  const db = getAdminFirestore()
  let created = false
  for (const preset of PRESET_COMMUNITIES) {
    const ref = db.collection('communities').doc(preset.id)
    const snap = await ref.get()
    const passcodeHash = await bcrypt.hash(preset.password, 10)
    if (!snap.exists) {
      await ref.set({
        name: preset.name,
        passcodeHash,
        createdAt: FieldValue.serverTimestamp(),
      })
      created = true
    } else {
      await ref.set({ name: preset.name, passcodeHash }, { merge: true })
    }
  }
  return created
}

/** 249 / きらくに / SHIFT の作成 + default からタグでメンバー・試合を分離 */
export async function ensurePresetCommunitiesAndSplit(): Promise<{
  presetCreated: boolean
  split: boolean
  counts: { '249': number; kirakuni: number; shift: number }
}> {
  const db = getAdminFirestore()
  const presetCreated = await syncPresetCommunities()

  const defaultRef = db.collection('communities').doc(DEFAULT_COMMUNITY_ID)
  const defaultSnap = await defaultRef.get()
  if (!defaultSnap.exists) {
    await runDefaultMigration()
  }

  const refreshedDefault = await defaultRef.get()
  const splitFlag = refreshedDefault.data()?.splitByTagsAt
  if (splitFlag) {
    const c249 = await db.collection('communities').doc(COMMUNITY_249_ID).collection('members').get()
    const cKira = await db.collection('communities').doc(COMMUNITY_KIRAKUNI_ID).collection('members').get()
    const cShift = await db.collection('communities').doc(COMMUNITY_SHIFT_ID).collection('members').get()
    return {
      presetCreated,
      split: false,
      counts: { '249': c249.size, kirakuni: cKira.size, shift: cShift.size },
    }
  }

  const membersSnap = await defaultRef.collection('members').get()
  const memberTargets = new Map<string, PresetCommunityId>()
  const counts = { '249': 0, kirakuni: 0, shift: 0 }

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
    else if (target === COMMUNITY_KIRAKUNI_ID) counts.kirakuni++
    else counts.shift++
    if (ops >= BATCH_LIMIT) await flush()
  }

  const matchesSnap = await defaultRef.collection('matches').get()
  for (const d of matchesSnap.docs) {
    const data = d.data()
    const players = (data.players as { playerId: string }[]) ?? []
    if (players.length === 0) continue
    const targets = players
      .map((p) => memberTargets.get(p.playerId))
      .filter((t): t is PresetCommunityId => !!t)
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

  return { presetCreated, split: true, counts }
}

/** 初回分離後に SHIFT タグだけが default に残っていた場合の追補移行 */
export async function ensureShiftMembersFromDefault(): Promise<number> {
  const db = getAdminFirestore()
  const defaultRef = db.collection('communities').doc(DEFAULT_COMMUNITY_ID)
  const defaultSnap = await defaultRef.get()
  if (!defaultSnap.exists) return 0
  if (defaultSnap.data()?.shiftSplitAt) return 0

  await syncPresetCommunities()

  const membersSnap = await defaultRef.collection('members').get()
  let moved = 0
  let batch = db.batch()
  let ops = 0
  const flush = async () => {
    if (ops === 0) return
    await batch.commit()
    batch = db.batch()
    ops = 0
  }

  for (const d of membersSnap.docs) {
    const tags = (d.data().tags as string[] | undefined) ?? []
    if (!tags.includes(TAG_SHIFT)) continue
    if (tags.includes(TAG_249) || tags.includes(TAG_KIRAKUNI)) continue
    const dest = db.collection('communities').doc(COMMUNITY_SHIFT_ID).collection('members').doc(d.id)
    batch.set(dest, d.data(), { merge: true })
    moved++
    ops++
    if (ops >= BATCH_LIMIT) await flush()
  }

  batch.set(defaultRef, { shiftSplitAt: FieldValue.serverTimestamp() }, { merge: true })
  ops++
  await flush()
  return moved
}
