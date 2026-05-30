import { Timestamp } from 'firebase/firestore'

export type LobbyStatus = 'open' | 'locked'

export interface Lobby {
  id?: string
  communityId: string
  inviteToken: string
  status: LobbyStatus
  checkInIds: string[]
  createdAt: Timestamp
  expiresAt: Timestamp
}
