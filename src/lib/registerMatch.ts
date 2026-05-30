import { db } from '@/lib/firebase'
import { isAdminConfigured, getAdminFirestore } from '@/lib/firebaseAdmin'
import { computeEloUpdates } from '@/lib/elo'
import { fetchMembers } from '@/lib/members'
import { matchesCollection } from '@/lib/paths'
import { GameRole } from '@/types'
import { MatchEloChange } from '@/types'
import { FieldValue } from 'firebase-admin/firestore'
import { Timestamp, doc, writeBatch } from 'firebase/firestore'

export type MatchPlayerPayload = {
  playerId: string
  role: GameRole
  team: 'BLUE' | 'RED'
}

export async function registerMatchAtomic(
  communityId: string,
  winner: 'BLUE' | 'RED',
  players: MatchPlayerPayload[],
  meta?: { balanceScore?: number; splitMode?: string }
): Promise<{ eloChanges: MatchEloChange[]; matchId: string }> {
  if (players.length !== 10) {
    throw new Error('10人分のプレイヤー情報が必要です')
  }

  const members = await fetchMembers(communityId)
  const memberMap = new Map(members.map((m) => [m.id, m]))

  const eloInputs = players.map((p) => {
    const m = memberMap.get(p.playerId)
    if (!m) throw new Error(`メンバーが見つかりません: ${p.playerId}`)
    return { memberId: p.playerId, elo: m.elo, team: p.team }
  })

  const eloChanges = computeEloUpdates(eloInputs, winner)

  if (isAdminConfigured()) {
    return registerWithAdmin(communityId, winner, players, eloChanges, memberMap, meta)
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('本番では FIREBASE_SERVICE_ACCOUNT_JSON が必須です')
  }
  return registerWithClientSdk(communityId, winner, players, eloChanges, memberMap, meta)
}

async function registerWithAdmin(
  communityId: string,
  winner: 'BLUE' | 'RED',
  players: MatchPlayerPayload[],
  eloChanges: ReturnType<typeof computeEloUpdates>,
  memberMap: Map<string, { stats: { wins: number; losses: number } }>,
  meta?: { balanceScore?: number; splitMode?: string }
) {
  const db = getAdminFirestore()
  const batch = db.batch()
  const matchRef = db.collection('communities').doc(communityId).collection('matches').doc()

  batch.set(matchRef, {
    date: FieldValue.serverTimestamp(),
    players,
    winner,
    eloChanges,
    balanceScore: meta?.balanceScore ?? null,
    splitMode: meta?.splitMode ?? null,
  })

  for (const ch of eloChanges) {
    const m = memberMap.get(ch.memberId)
    if (!m) continue
    const won = players.find((p) => p.playerId === ch.memberId)?.team === winner
    const memberRef = db.collection('communities').doc(communityId).collection('members').doc(ch.memberId)
    batch.update(memberRef, {
      elo: ch.after,
      stats: {
        wins: m.stats.wins + (won ? 1 : 0),
        losses: m.stats.losses + (won ? 0 : 1),
      },
    })
  }

  await batch.commit()
  return { eloChanges, matchId: matchRef.id }
}

async function registerWithClientSdk(
  communityId: string,
  winner: 'BLUE' | 'RED',
  players: MatchPlayerPayload[],
  eloChanges: ReturnType<typeof computeEloUpdates>,
  memberMap: Map<string, { stats: { wins: number; losses: number } }>,
  meta?: { balanceScore?: number; splitMode?: string }
) {
  const batch = writeBatch(db)
  const matchRef = doc(matchesCollection(communityId))

  batch.set(matchRef, {
    date: Timestamp.now(),
    players,
    winner,
    eloChanges,
    balanceScore: meta?.balanceScore ?? null,
    splitMode: meta?.splitMode ?? null,
  })

  for (const ch of eloChanges) {
    const m = memberMap.get(ch.memberId)
    if (!m) continue
    const won = players.find((p) => p.playerId === ch.memberId)?.team === winner
    batch.update(doc(db, 'communities', communityId, 'members', ch.memberId), {
      elo: ch.after,
      stats: {
        wins: m.stats.wins + (won ? 1 : 0),
        losses: m.stats.losses + (won ? 0 : 1),
      },
    })
  }

  await batch.commit()
  return { eloChanges, matchId: matchRef.id }
}
