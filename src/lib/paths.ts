import { collection, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DEFAULT_COMMUNITY_ID } from '@/constants/community'

export function communityDoc(communityId: string = DEFAULT_COMMUNITY_ID) {
  return doc(db, 'communities', communityId)
}

export function membersCollection(communityId: string = DEFAULT_COMMUNITY_ID) {
  return collection(db, 'communities', communityId, 'members')
}

export function matchesCollection(communityId: string = DEFAULT_COMMUNITY_ID) {
  return collection(db, 'communities', communityId, 'matches')
}

export function lobbiesCollection(communityId: string = DEFAULT_COMMUNITY_ID) {
  return collection(db, 'communities', communityId, 'lobbies')
}
