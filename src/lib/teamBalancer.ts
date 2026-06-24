import { GameRole } from '@/types'
import { Member } from '@/types/member'
import { getEffectiveElo, roleAssignmentCost } from '@/lib/roleTier'
import { hungarian } from '@/lib/hungarian'

const ROLES: GameRole[] = [GameRole.TOP, GameRole.JUNGLE, GameRole.MID, GameRole.ADC, GameRole.SUP]

export type SplitMode = 'party_balance' | 'rate_equal' | 'random'

export interface TeamSlot {
  member: Member
  role: GameRole
}

export interface Teams {
  blue: TeamSlot[]
  red: TeamSlot[]
}

export interface SplitMetrics {
  totalDiff: number
  avgLaneDiff: number
  partySpread: number
  mainHits: number
  balanceScore: number
  blueWinChance: number
}

export interface SplitCandidate {
  mode: SplitMode
  teams: Teams
  metrics: SplitMetrics
  reasons: string[]
}

function variance(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
}

function assignRolesToTeam(teamMembers: Member[]): TeamSlot[] {
  if (teamMembers.length !== ROLES.length) {
    throw new Error('チームは5人である必要があります')
  }
  const cost: number[][] = teamMembers.map((m) => ROLES.map((r) => roleAssignmentCost(m, r)))
  const assign = hungarian(cost)
  return teamMembers.map((member, i) => ({
    member,
    role: ROLES[assign[i]],
  }))
}

function evaluateSplit(blueMembers: Member[], redMembers: Member[]): { teams: Teams; metrics: SplitMetrics } {
  const blue = assignRolesToTeam(blueMembers)
  const red = assignRolesToTeam(redMembers)

  const blueEff = blue.map((s) => getEffectiveElo(s.member, s.role))
  const redEff = red.map((s) => getEffectiveElo(s.member, s.role))
  const blueTotal = blueEff.reduce((a, b) => a + b, 0)
  const redTotal = redEff.reduce((a, b) => a + b, 0)
  const totalDiff = Math.abs(blueTotal - redTotal)

  const laneDiffs = ROLES.map((role) => {
    const b = blue.find((s) => s.role === role)
    const r = red.find((s) => s.role === role)
    if (!b || !r) return 0
    return Math.abs(getEffectiveElo(b.member, role) - getEffectiveElo(r.member, role))
  })
  const avgLaneDiff = laneDiffs.reduce((a, b) => a + b, 0) / ROLES.length

  const partySpread = Math.sqrt(variance(blueEff)) + Math.sqrt(variance(redEff))
  const mainHits = [...blue, ...red].filter((s) => s.member.roles[s.role] === 'MAIN').length

  const balanceScore = Math.max(
    0,
    Math.min(100, Math.round(100 - totalDiff / 15 - avgLaneDiff / 8 - partySpread / 12))
  )

  const blueWinChance = Math.round(
    (1 / (1 + Math.pow(10, (redTotal - blueTotal) / 400))) * 100
  )

  return {
    teams: { blue, red },
    metrics: {
      totalDiff,
      avgLaneDiff,
      partySpread,
      mainHits,
      balanceScore,
      blueWinChance,
    },
  }
}

/** index 0 を必ず Blue に含む 126 通り */
function generate126Splits(): [number[], number[]][] {
  const splits: [number[], number[]][] = []
  const combo: number[] = []

  const dfs = (start: number, depth: number) => {
    if (depth === 5) {
      const blue = [...combo]
      const red: number[] = []
      for (let i = 0; i < 10; i++) if (!blue.includes(i)) red.push(i)
      splits.push([blue, red])
      return
    }
    for (let i = start; i <= 9 - (5 - depth); i++) {
      combo.push(i)
      dfs(i + 1, depth + 1)
      combo.pop()
    }
  }

  combo.push(0)
  dfs(1, 1)
  return splits
}

interface ScoredSplit {
  teams: Teams
  metrics: SplitMetrics
}

function buildReasons(metrics: SplitMetrics, mode: SplitMode): string[] {
  const lines = [
    `チーム合計差 ${metrics.totalDiff} pt`,
    `レーン平均差 ${Math.round(metrics.avgLaneDiff)} pt`,
    `◎ロール ${metrics.mainHits}/10`,
    `バランス ${metrics.balanceScore}/100`,
  ]
  if (mode === 'rate_equal') lines.unshift('レート均等優先')
  if (mode === 'party_balance') lines.unshift('パーティーバランス優先')
  if (mode === 'random') lines.unshift('ランダム（上位候補から抽選）')
  return lines
}

export function generateThreeCandidates(members: Member[]): SplitCandidate[] {
  if (members.length !== 10) {
    throw new Error('10人が必要です')
  }

  const splits = generate126Splits()
  const scored: ScoredSplit[] = []

  for (const [blueIdx, redIdx] of splits) {
    const blueMembers = blueIdx.map((i) => members[i])
    const redMembers = redIdx.map((i) => members[i])
    scored.push(evaluateSplit(blueMembers, redMembers))
  }

  const splitKey = (s: ScoredSplit) =>
    [...s.teams.blue, ...s.teams.red]
      .map((t) => `${t.member.id}:${t.role}`)
      .sort()
      .join('|')

  const pickBest = (sorted: ScoredSplit[], used: Set<string>, index = 0): ScoredSplit => {
    const candidate = sorted[index]
    if (!candidate) return sorted[0]
    const key = splitKey(candidate)
    if (!used.has(key)) return candidate
    return pickBest(sorted, used, index + 1)
  }

  const byRate = [...scored].sort((a, b) => a.metrics.totalDiff - b.metrics.totalDiff)
  const byParty = [...scored].sort((a, b) => a.metrics.partySpread - b.metrics.partySpread)
  const byScore = [...scored].sort((a, b) => b.metrics.balanceScore - a.metrics.balanceScore)

  const used = new Set<string>()
  const pickRateEqual = pickBest(byRate, used)
  used.add(splitKey(pickRateEqual))

  const pickParty = pickBest(byParty, used)
  used.add(splitKey(pickParty))

  const topByScore = byScore.slice(0, 12)
  let pickRandom = topByScore[Math.floor(Math.random() * topByScore.length)] ?? byScore[0]
  if (used.has(splitKey(pickRandom))) {
    pickRandom = topByScore.find((s) => !used.has(splitKey(s))) ?? pickRandom
  }

  const modes: { mode: SplitMode; pick: ScoredSplit }[] = [
    { mode: 'party_balance', pick: pickParty },
    { mode: 'rate_equal', pick: pickRateEqual },
    { mode: 'random', pick: pickRandom },
  ]

  return modes.map(({ mode, pick }) => ({
    mode,
    teams: pick.teams,
    metrics: pick.metrics,
    reasons: buildReasons(pick.metrics, mode),
  }))
}

export function getTotalRate(team: TeamSlot[]): number {
  return Math.round(team.reduce((s, t) => s + getEffectiveElo(t.member, t.role), 0))
}

export function getAvgRate(team: TeamSlot[]): number {
  return team.length ? Math.round(getTotalRate(team) / team.length) : 0
}
