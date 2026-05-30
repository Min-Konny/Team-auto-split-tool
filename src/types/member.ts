import { GameRole } from '@/types'

export type RoleTier = 'MAIN' | 'SUB' | 'OK' | 'NG'

export type RoleMap = Record<GameRole, RoleTier>

export interface Member {
  id: string
  name: string
  nickname?: string
  elo: number
  roles: RoleMap
  mainRole: GameRole
  stats: { wins: number; losses: number }
  tags?: string[]
}

/** @deprecated 移行用。新規は Member を使用 */
export interface LegacyPlayer {
  id: string
  name: string
  nickname?: string
  mainRole: GameRole
  mainRate: number
  subRate: number
  stats: { wins: number; losses: number }
  tags?: string[]
  unwantedRoles?: GameRole[]
}
