import { DEFAULT_COMMUNITY_ID } from '@/constants/community'
import { db } from '@/lib/firebase'
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebaseAdmin'
import { legacyToMember } from '@/lib/roleTier'
import { membersCollection, communityDoc } from '@/lib/paths'
import { LegacyPlayer } from '@/types/member'
import { FieldValue } from 'firebase-admin/firestore'
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  writeBatch,
} from 'firebase/firestore'

const BATCH_LIMIT = 450

export async function runDefaultMigration(): Promise<{ migrated: boolean; memberCount: number }> {
  if (isAdminConfigured()) {
    return runDefaultMigrationAdmin()
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('本番では FIREBASE_SERVICE_ACCOUNT_JSON が必須です')
  }
  return runDefaultMigrationClient()
}

async function runDefaultMigrationAdmin(): Promise<{ migrated: boolean; memberCount: number }> {
  const communityId = DEFAULT_COMMUNITY_ID
  const db = getAdminFirestore()
  const commRef = db.collection('communities').doc(communityId)

  const shouldRun = await db.runTransaction(async (tx) => {
    const snap = await tx.get(commRef)
    const data = snap.data()
    if (snap.exists && data?.migratedAt) return false
    if (snap.exists && data?.migrationInProgress) {
      throw new Error('移行が進行中です。しばらく待ってから再試行してください。')
    }
    tx.set(
      commRef,
      {
        name: snap.exists ? data?.name : 'メイン',
        passcodeHash: data?.passcodeHash ?? null,
        migrationInProgress: true,
        createdAt: data?.createdAt ?? FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    return true
  })

  if (!shouldRun) {
    const snap = await commRef.collection('members').get()
    return { migrated: false, memberCount: snap.size }
  }

  try {
    const legacySnap = await db.collection('players').get()
    const legacyMatches = await db.collection('matches').get()

    let memberCount = 0
    let batch = db.batch()
    let ops = 0

    const flush = async () => {
      if (ops === 0) return
      await batch.commit()
      batch = db.batch()
      ops = 0
    }

    for (const d of legacySnap.docs) {
      const legacy = { id: d.id, ...d.data() } as LegacyPlayer
      const member = legacyToMember(d.id, legacy)
      const memberRef = commRef.collection('members').doc(d.id)
      batch.set(memberRef, {
        name: member.name,
        nickname: member.nickname ?? null,
        elo: member.elo,
        roles: member.roles,
        mainRole: member.mainRole,
        stats: member.stats,
      })
      ops++
      memberCount++
      if (ops >= BATCH_LIMIT) await flush()
    }

    for (const d of legacyMatches.docs) {
      batch.set(commRef.collection('matches').doc(d.id), d.data())
      ops++
      if (ops >= BATCH_LIMIT) await flush()
    }

    batch.set(
      commRef,
      {
        migratedAt: FieldValue.serverTimestamp(),
        migrationInProgress: false,
      },
      { merge: true }
    )
    ops++
    await flush()

    return { migrated: true, memberCount }
  } catch (e) {
    await commRef.set({ migrationInProgress: false }, { merge: true })
    throw e
  }
}

async function runDefaultMigrationClient(): Promise<{ migrated: boolean; memberCount: number }> {
  const communityId = DEFAULT_COMMUNITY_ID
  const commRef = communityDoc(communityId)

  const shouldRun = await runTransaction(db, async (tx) => {
    const snap = await tx.get(commRef)
    if (snap.exists() && snap.data()?.migratedAt) return false
    if (snap.exists() && snap.data()?.migrationInProgress) {
      throw new Error('移行が進行中です。しばらく待ってから再試行してください。')
    }
    tx.set(
      commRef,
      {
        name: snap.exists() ? snap.data()?.name : 'メイン',
        passcodeHash: snap.data()?.passcodeHash ?? null,
        migrationInProgress: true,
        createdAt: snap.data()?.createdAt ?? Timestamp.now(),
      },
      { merge: true }
    )
    return true
  })

  if (!shouldRun) {
    const snap = await getDocs(membersCollection(communityId))
    return { migrated: false, memberCount: snap.size }
  }

  try {
    const legacySnap = await getDocs(collection(db, 'players'))
    const legacyMatches = await getDocs(collection(db, 'matches'))

    let memberCount = 0
    let batch = writeBatch(db)
    let ops = 0

    const flush = async () => {
      if (ops === 0) return
      await batch.commit()
      batch = writeBatch(db)
      ops = 0
    }

    for (const d of legacySnap.docs) {
      const legacy = { id: d.id, ...d.data() } as LegacyPlayer
      const member = legacyToMember(d.id, legacy)
      batch.set(doc(db, 'communities', communityId, 'members', d.id), {
        name: member.name,
        nickname: member.nickname ?? null,
        elo: member.elo,
        roles: member.roles,
        mainRole: member.mainRole,
        stats: member.stats,
      })
      ops++
      memberCount++
      if (ops >= BATCH_LIMIT) await flush()
    }

    for (const d of legacyMatches.docs) {
      batch.set(doc(db, 'communities', communityId, 'matches', d.id), d.data())
      ops++
      if (ops >= BATCH_LIMIT) await flush()
    }

    batch.set(
      commRef,
      {
        migratedAt: Timestamp.now(),
        migrationInProgress: false,
      },
      { merge: true }
    )
    ops++
    await flush()

    return { migrated: true, memberCount }
  } catch (e) {
    await setDoc(commRef, { migrationInProgress: false }, { merge: true })
    throw e
  }
}
