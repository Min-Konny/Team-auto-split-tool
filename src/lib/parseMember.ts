import { GameRole } from '@/types'
import { Member, RoleMap, RoleTier } from '@/types/member'
import { getMainRoleFromMap } from '@/lib/roleTier'

const ROLES = [GameRole.TOP, GameRole.JUNGLE, GameRole.MID, GameRole.ADC, GameRole.SUP]
const TIERS: RoleTier[] = ['MAIN', 'SUB', 'OK', 'NG']

function isRoleMap(v: unknown): v is RoleMap {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return ROLES.every((r) => TIERS.includes(o[r] as RoleTier))
}

export function parseMemberDoc(id: string, raw: Record<string, unknown>): Member | null {
  const name = typeof raw.name === 'string' ? raw.name : ''
  if (!name) return null

  let roles: RoleMap
  if (isRoleMap(raw.roles)) {
    roles = raw.roles
  } else {
    const legacyMain = (raw.mainRole as GameRole) || GameRole.MID
    roles = {
      TOP: GameRole.TOP === legacyMain ? 'MAIN' : 'OK',
      JUNGLE: GameRole.JUNGLE === legacyMain ? 'MAIN' : 'OK',
      MID: GameRole.MID === legacyMain ? 'MAIN' : 'OK',
      ADC: GameRole.ADC === legacyMain ? 'MAIN' : 'OK',
      SUP: GameRole.SUP === legacyMain ? 'MAIN' : 'OK',
    }
  }

  const mainRole = (raw.mainRole as GameRole) || getMainRoleFromMap(roles) || GameRole.MID
  const elo = typeof raw.elo === 'number' ? raw.elo : typeof raw.mainRate === 'number' ? raw.mainRate : 1500
  const stats = raw.stats as { wins: number; losses: number } | undefined

  return {
    id,
    name,
    nickname: typeof raw.nickname === 'string' ? raw.nickname : undefined,
    elo,
    roles,
    mainRole,
    stats: stats?.wins != null ? stats : { wins: 0, losses: 0 },
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
  }
}
