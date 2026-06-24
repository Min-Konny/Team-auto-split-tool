import { GameRole } from '@/types'
import { LegacyPlayer, Member, RoleMap, RoleTier } from '@/types/member'

export const ROLE_TIER_LABEL: Record<RoleTier, string> = {
  MAIN: '◎',
  SUB: '○',
  OK: '△',
  NG: '×',
}

export const ROLE_TIER_MULTIPLIER: Record<RoleTier, number> = {
  MAIN: 1,
  SUB: 0.95,
  OK: 0.9,
  NG: 0.7,
}

const ALL_ROLES: GameRole[] = [GameRole.TOP, GameRole.JUNGLE, GameRole.MID, GameRole.ADC, GameRole.SUP]

export function defaultRoleMap(mainRole: GameRole, unwanted: GameRole[] = []): RoleMap {
  const roles = {} as RoleMap
  for (const r of ALL_ROLES) {
    if (unwanted.includes(r)) roles[r] = 'NG'
    else if (r === mainRole) roles[r] = 'MAIN'
    else roles[r] = 'OK'
  }
  return roles
}

export function getMainRoleFromMap(roles: RoleMap): GameRole | null {
  const mains = ALL_ROLES.filter((r) => roles[r] === 'MAIN')
  return mains[0] ?? null
}

export function validateRoleMap(roles: RoleMap): string | null {
  const mains = ALL_ROLES.filter((r) => roles[r] === 'MAIN')
  if (mains.length !== 1) return '◎（メインロール）は1つだけ選んでください'
  return null
}

/** ◎ を1レーンに正規化 */
export function normalizeRoleMap(roles: RoleMap): { roles: RoleMap; mainRole: GameRole } {
  const mainRole = getMainRoleFromMap(roles)!
  const normalized = { ...roles }
  for (const r of ALL_ROLES) {
    if (r !== mainRole && normalized[r] === 'MAIN') normalized[r] = 'OK'
  }
  normalized[mainRole] = 'MAIN'
  return { roles: normalized, mainRole }
}

export function formatRate(value: number): number {
  return Math.round(value)
}

export function getEffectiveElo(member: Member, role: GameRole): number {
  const tier = member.roles[role]
  const mult = tier === 'NG' ? ROLE_TIER_MULTIPLIER.NG : ROLE_TIER_MULTIPLIER[tier]
  return formatRate(member.elo * mult)
}

export function roleAssignmentCost(member: Member, role: GameRole): number {
  const tier = member.roles[role]
  if (tier === 'NG') return 1_000_000
  const tierCost = { MAIN: 0, SUB: 12, OK: 28 }[tier]
  const eff = getEffectiveElo(member, role)
  return tierCost + Math.max(0, 2200 - eff) * 0.02
}

export function legacyToMember(id: string, p: LegacyPlayer): Member {
  const unwanted = p.unwantedRoles || []
  const roles = defaultRoleMap(p.mainRole, unwanted)
  roles[p.mainRole] = 'MAIN'
  return {
    id,
    name: p.name,
    nickname: p.nickname,
    elo: p.mainRate,
    roles,
    mainRole: p.mainRole,
    stats: p.stats || { wins: 0, losses: 0 },
  }
}
