import { DEFAULT_COMMUNITY_ID } from '@/constants/community'
import { db } from '@/lib/firebase'
import { parseMemberDoc } from '@/lib/parseMember'
import { membersCollection } from '@/lib/paths'
import { Member } from '@/types/member'
import { addDoc, getDocs } from 'firebase/firestore'

export async function fetchMembers(communityId: string = DEFAULT_COMMUNITY_ID): Promise<Member[]> {
  const snap = await getDocs(membersCollection(communityId))
  const list: Member[] = []
  for (const d of snap.docs) {
    const m = parseMemberDoc(d.id, d.data() as Record<string, unknown>)
    if (m) list.push(m)
  }
  return list
}

export async function addMember(communityId: string, data: Omit<Member, 'id'>): Promise<string> {
  const mainRole = data.mainRole
  const ref = await addDoc(membersCollection(communityId), {
    name: data.name,
    nickname: data.nickname ?? null,
    elo: data.elo,
    roles: data.roles,
    mainRole,
    stats: data.stats,
  })
  return ref.id
}
