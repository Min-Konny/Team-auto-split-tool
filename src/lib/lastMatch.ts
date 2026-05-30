import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { DEFAULT_COMMUNITY_ID } from '@/constants/community'
import { matchesCollection } from '@/lib/paths'
import { Match } from '@/types'

export async function fetchLastMatchPlayerIds(
  communityId: string = DEFAULT_COMMUNITY_ID
): Promise<string[]> {
  const snap = await getDocs(query(matchesCollection(communityId), orderBy('date', 'desc')))
  if (snap.empty) return []
  const match = snap.docs[0].data() as Match
  return Array.from(new Set(match.players.map((p) => p.playerId)))
}
