const MEMBER_ID_KEY = 'teamMakerMemberId'

export function getStoredMemberId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(MEMBER_ID_KEY)
}

export function setStoredMemberId(memberId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(MEMBER_ID_KEY, memberId)
}

export function clearStoredMemberId(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(MEMBER_ID_KEY)
}

const ACTIVE_LOBBY_KEY = 'teamMakerActiveLobbyId'

export function getStoredActiveLobbyId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACTIVE_LOBBY_KEY)
}

export function setStoredActiveLobbyId(lobbyId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACTIVE_LOBBY_KEY, lobbyId)
}
