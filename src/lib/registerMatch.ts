import { db } from '@/lib/firebase'
import { isAdminConfigured, getAdminFirestore } from '@/lib/firebaseAdmin'
import { computeEloUpdates, MatchPerformance } from '@/lib/elo'
import { parseMemberDoc } from '@/lib/parseMember'
import { Member } from '@/types/member'
import { matchesCollection } from '@/lib/paths'
import { GameRole } from '@/types'
import { MatchEloChange } from '@/types'
import { FieldValue } from 'firebase-admin/firestore'
import { Timestamp, doc, runTransaction } from 'firebase/firestore'

export type MatchPlayerPayload = {
  playerId: string
  role: GameRole
  team: 'BLUE' | 'RED'
}

type MatchMeta = {
  balanceScore?: number
  splitMode?: string
  performance?: MatchPerformance
  registrationId?: string
}

function prepareResult(
  players: MatchPlayerPayload[],
  winner: 'BLUE' | 'RED',
  members: (Member | null)[],
  meta?: MatchMeta
) {
  const inputs = players.map((p, i) => {
    const member = members[i]
    if (!member) throw new Error('試合参加者が見つかりません')
    return { memberId: p.playerId, elo: member.elo, team: p.team }
  })
  const eloChanges = computeEloUpdates(inputs, winner, meta?.performance)
  const updates = eloChanges.map((ch, i) => {
    const member = members[i]!
    const won = players[i].team === winner
    return {
      elo: ch.after,
      stats: {
        wins: (member.stats.wins ?? 0) + Number(won),
        losses: (member.stats.losses ?? 0) + Number(!won),
      },
    }
  })
  return {
    match: {
      players, winner, eloChanges,
      balanceScore: meta?.balanceScore ?? null,
      splitMode: meta?.splitMode ?? null,
    },
    updates,
  }
}

export async function registerMatchAtomic(
  communityId: string,
  winner: 'BLUE' | 'RED',
  players: MatchPlayerPayload[],
  meta?: MatchMeta
): Promise<{ eloChanges: MatchEloChange[]; matchId: string; winner: 'BLUE' | 'RED' }> {
  if (isAdminConfigured()) {
    const adminDb = getAdminFirestore()
    const community = adminDb.collection('communities').doc(communityId)
    const matches = community.collection('matches')
    const matchRef = meta?.registrationId ? matches.doc(meta.registrationId) : matches.doc()
    const refs = players.map((p) => community.collection('members').doc(p.playerId))
    return adminDb.runTransaction(async (tx) => {
      const existing = (await tx.get(matchRef)).data()
      if (existing) return { eloChanges: existing.eloChanges, matchId: matchRef.id, winner: existing.winner }

      const snapshots = await tx.getAll(...refs)
      const members = snapshots.map((snap) => parseMemberDoc(snap.id, snap.data() ?? {}))
      const { match, updates } = prepareResult(players, winner, members, meta)
      tx.create(matchRef, { ...match, date: FieldValue.serverTimestamp() })
      refs.forEach((ref, i) => tx.update(ref, updates[i]))
      return { eloChanges: match.eloChanges, matchId: matchRef.id, winner }
    })
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('本番では FIREBASE_SERVICE_ACCOUNT_JSON が必須です')
  }
  const matches = matchesCollection(communityId)
  const matchRef = meta?.registrationId ? doc(matches, meta.registrationId) : doc(matches)
  const refs = players.map((p) => doc(db, 'communities', communityId, 'members', p.playerId))
  return runTransaction(db, async (tx) => {
    const existing = (await tx.get(matchRef)).data()
    if (existing) return { eloChanges: existing.eloChanges, matchId: matchRef.id, winner: existing.winner }

    const snapshots = await Promise.all(refs.map((ref) => tx.get(ref)))
    const members = snapshots.map((snap) => parseMemberDoc(snap.id, snap.data() ?? {}))
    const { match, updates } = prepareResult(players, winner, members, meta)
    tx.set(matchRef, { ...match, date: Timestamp.now() })
    refs.forEach((ref, i) => tx.update(ref, updates[i]))
    return { eloChanges: match.eloChanges, matchId: matchRef.id, winner }
  })
}
