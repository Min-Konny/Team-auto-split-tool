export enum GameRole {
  TOP = 'TOP',
  JUNGLE = 'JUNGLE',
  MID = 'MID',
  ADC = 'ADC',
  SUP = 'SUP'
}

export type Role = GameRole | 'FILL'

export type Rank = 'UNRANKED' | 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'EMERALD' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER'

export interface RankRate {
  main: number
  sub: number
}

export const RANK_RATES: { [key in Rank]: RankRate } = {
  UNRANKED: { main: 500, sub: 450 },
  IRON: { main: 600, sub: 540 },
  BRONZE: { main: 1300, sub: 1170 },
  SILVER: { main: 1500, sub: 1350 },
  GOLD: { main: 1700, sub: 1530 },
  PLATINUM: { main: 1900, sub: 1710 },
  EMERALD: { main: 2000, sub: 1800 },
  DIAMOND: { main: 2200, sub: 1980 },
  MASTER: { main: 2500, sub: 2250 },
  GRANDMASTER: { main: 2700, sub: 2430 },
  CHALLENGER: { main: 3000, sub: 2700 }
}

/** @deprecated Member を使用 */
export interface Player {
  id: string
  name: string
  nickname?: string
  mainRole: GameRole
  mainRate: number
  subRate: number
  stats: { wins: number; losses: number }
  unwantedRoles?: GameRole[]
}

export type { Member, RoleTier, RoleMap, LegacyPlayer } from '@/types/member'
export type { Community } from '@/types/community'

export interface SelectedPlayer {
  player: Player & { id: string }
  preferredRoles: [Role, Role]
  roleWish?: GameRole // その日にやりたいロールの希望
  roleWishPriority?: 'HIGH' | 'MEDIUM' | 'LOW' // ロール希望の優先度
}

export interface TeamPlayer {
  player: Player
  role: GameRole
}

export interface Teams {
  blue: TeamPlayer[]
  red: TeamPlayer[]
}

export interface MatchEloChange {
  memberId: string
  before: number
  after: number
  delta: number
}

export interface Match {
  id: string
  date: {
    seconds: number
    nanoseconds: number
  }
  players: {
    playerId: string
    role: Role
    team: 'BLUE' | 'RED'
  }[]
  winner: 'BLUE' | 'RED'
  eloChanges?: MatchEloChange[]
  balanceScore?: number
  splitMode?: string
} 