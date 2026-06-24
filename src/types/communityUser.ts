import { Timestamp } from 'firebase/firestore'

export interface CommunityUser {
  id: string
  username: string
  usernameLower: string
  displayName: string | null
  passwordHash: string
  createdAt: Timestamp
}

export type CommunityUserPublic = Pick<CommunityUser, 'id' | 'username' | 'displayName'>
