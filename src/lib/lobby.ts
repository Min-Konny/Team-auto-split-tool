import { DEFAULT_COMMUNITY_ID, LOBBY_TTL_MS } from '@/constants/community'
import { lobbiesCollection } from '@/lib/paths'
import { Lobby, LobbyStatus } from '@/types/lobby'
import { db } from '@/lib/firebase'
import {
  Timestamp,
  addDoc,
  arrayRemove,
  arrayUnion,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'

function randomToken(): string {
  const bytes = new Uint8Array(12)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function createLobby(communityId: string = DEFAULT_COMMUNITY_ID): Promise<Lobby & { id: string }> {
  const now = Date.now()
  const payload = {
    communityId,
    inviteToken: randomToken(),
    status: 'open' as LobbyStatus,
    checkInIds: [] as string[],
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + LOBBY_TTL_MS),
  }
  const ref = await addDoc(lobbiesCollection(communityId), payload)
  return { id: ref.id, ...payload }
}

export async function findLobbyByInviteToken(token: string): Promise<(Lobby & { id: string }) | null> {
  const q = query(collectionGroup(db, 'lobbies'), where('inviteToken', '==', token))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  const communityId = d.ref.parent.parent?.id ?? DEFAULT_COMMUNITY_ID
  return { ...(d.data() as Lobby), id: d.id, communityId }
}

export async function getLobby(
  lobbyId: string,
  communityId: string = DEFAULT_COMMUNITY_ID
): Promise<(Lobby & { id: string }) | null> {
  const snap = await getDoc(doc(db, 'communities', communityId, 'lobbies', lobbyId))
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Lobby) }
}

export function subscribeLobby(
  lobbyId: string,
  onData: (lobby: (Lobby & { id: string }) | null) => void,
  communityId: string = DEFAULT_COMMUNITY_ID
): () => void {
  return onSnapshot(doc(db, 'communities', communityId, 'lobbies', lobbyId), (snap) => {
    if (!snap.exists()) {
      onData(null)
      return
    }
    onData({ id: snap.id, ...(snap.data() as Lobby) })
  })
}

function lobbyRef(lobbyId: string, communityId: string) {
  return doc(db, 'communities', communityId, 'lobbies', lobbyId)
}

export async function setLobbyCheckIns(
  lobbyId: string,
  playerIds: string[],
  communityId: string = DEFAULT_COMMUNITY_ID
): Promise<void> {
  const unique = Array.from(new Set(playerIds))
  await updateDoc(lobbyRef(lobbyId, communityId), { checkInIds: unique })
}

export async function mergeLobbyCheckIns(
  lobbyId: string,
  playerIds: string[],
  communityId: string = DEFAULT_COMMUNITY_ID
): Promise<void> {
  const lobby = await getLobby(lobbyId, communityId)
  if (!lobby) return
  const merged = Array.from(new Set([...lobby.checkInIds, ...playerIds]))
  await setLobbyCheckIns(lobbyId, merged, communityId)
}

export async function toggleLobbyCheckIn(
  lobbyId: string,
  playerId: string,
  checked: boolean,
  communityId: string = DEFAULT_COMMUNITY_ID
): Promise<void> {
  await updateDoc(lobbyRef(lobbyId, communityId), {
    checkInIds: checked ? arrayUnion(playerId) : arrayRemove(playerId),
  })
}

export async function lockLobby(lobbyId: string, communityId: string = DEFAULT_COMMUNITY_ID): Promise<void> {
  await updateDoc(lobbyRef(lobbyId, communityId), { status: 'locked' })
}

export function lobbyJoinUrl(inviteToken: string): string {
  if (typeof window === 'undefined') return `/join/lobby/${inviteToken}`
  return `${window.location.origin}/join/lobby/${inviteToken}`
}

export function isLobbyExpired(lobby: Lobby): boolean {
  const exp = lobby.expiresAt?.toMillis?.() ?? 0
  return Date.now() > exp
}
