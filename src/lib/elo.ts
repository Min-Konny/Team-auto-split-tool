import { Member } from '@/types/member'

const K = 32

export function expectedScore(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400))
}

export interface EloUpdate {
  memberId: string
  before: number
  after: number
  delta: number
}

/** 5v5: 個人 ELO vs 相手チーム平均で期待勝率を出し、勝敗に応じて個別に Δ を付与 */
export function computeEloUpdates(
  members: { memberId: string; elo: number; team: 'BLUE' | 'RED' }[],
  winner: 'BLUE' | 'RED'
): EloUpdate[] {
  const blue = members.filter((m) => m.team === 'BLUE')
  const red = members.filter((m) => m.team === 'RED')
  const blueAvg = blue.reduce((s, m) => s + m.elo, 0) / Math.max(blue.length, 1)
  const redAvg = red.reduce((s, m) => s + m.elo, 0) / Math.max(red.length, 1)

  return members.map((m) => {
    const won = m.team === winner
    const oppAvg = m.team === 'BLUE' ? redAvg : blueAvg
    const exp = expectedScore(m.elo, oppAvg)
    const score = won ? 1 : 0
    const delta = Math.round(K * (score - exp))
    return {
      memberId: m.memberId,
      before: m.elo,
      after: m.elo + delta,
      delta,
    }
  })
}

export function applyEloToMember(member: Member, after: number): Member {
  return { ...member, elo: after }
}
