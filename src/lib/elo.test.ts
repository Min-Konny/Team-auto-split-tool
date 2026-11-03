import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { computeEloUpdates } from './elo'

describe('computeEloUpdates', () => {
  it('同一チーム内で ELO が高いほど勝利時の Δ が小さい', () => {
    const members = [
      { memberId: 'a', elo: 2000, team: 'BLUE' as const },
      { memberId: 'b', elo: 1500, team: 'BLUE' as const },
      { memberId: 'c', elo: 1500, team: 'BLUE' as const },
      { memberId: 'd', elo: 1500, team: 'BLUE' as const },
      { memberId: 'e', elo: 1500, team: 'BLUE' as const },
      { memberId: 'f', elo: 1500, team: 'RED' as const },
      { memberId: 'g', elo: 1500, team: 'RED' as const },
      { memberId: 'h', elo: 1500, team: 'RED' as const },
      { memberId: 'i', elo: 1500, team: 'RED' as const },
      { memberId: 'j', elo: 1500, team: 'RED' as const },
    ]
    const updates = computeEloUpdates(members, 'BLUE')
    const carry = updates.find((u) => u.memberId === 'a')!
    const avg = updates.find((u) => u.memberId === 'b')!
    assert.ok(carry.delta > 0)
    assert.ok(avg.delta > 0)
    assert.ok(carry.delta < avg.delta)
  })

  it('10人それぞれ異なる Δ になりうる（全員同値ではない）', () => {
    const members = [
      { memberId: '1', elo: 1800, team: 'BLUE' as const },
      { memberId: '2', elo: 1600, team: 'BLUE' as const },
      { memberId: '3', elo: 1500, team: 'BLUE' as const },
      { memberId: '4', elo: 1400, team: 'BLUE' as const },
      { memberId: '5', elo: 1300, team: 'BLUE' as const },
      { memberId: '6', elo: 1500, team: 'RED' as const },
      { memberId: '7', elo: 1500, team: 'RED' as const },
      { memberId: '8', elo: 1500, team: 'RED' as const },
      { memberId: '9', elo: 1500, team: 'RED' as const },
      { memberId: '10', elo: 1500, team: 'RED' as const },
    ]
    const updates = computeEloUpdates(members, 'BLUE')
    const blueDeltas = new Set(updates.filter((u) => members.find((m) => m.memberId === u.memberId)?.team === 'BLUE').map((u) => u.delta))
    assert.ok(blueDeltas.size > 1)
  })
})

it('adds one optional MVP bonus and one penalty on top of the match result', () => {
  const players = [
    { memberId: 'blue', elo: 1500, team: 'BLUE' as const },
    { memberId: 'red', elo: 1500, team: 'RED' as const },
    { memberId: 'other', elo: 1500, team: 'RED' as const },
  ]
  const changes = computeEloUpdates(players, 'BLUE', { mvpId: 'red', penaltyId: 'blue' })
  assert.deepEqual(changes.map(({ delta, after }) => [delta, after]), [[8, 1508], [-8, 1492], [-16, 1484]])
  assert.deepEqual(changes.map(({ performanceDelta }) => performanceDelta), [-8, 8, undefined])
})
