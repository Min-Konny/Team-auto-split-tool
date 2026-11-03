import assert from 'node:assert/strict'
import { it } from 'node:test'
import { appendDraftChoice, champions, draftOrder, normalizeChampionSearch } from './draft'

it('follows the four tournament draft phases with five bans and picks per side', () => {
  assert.deepEqual(draftOrder.map(({ kind, side }) => kind[0] + side[0]).join(' '),
    'BB BR BB BR BB BR PB PR PR PB PB PR BR BB BR BB PR PB PB PR')
  for (const kind of ['BAN', 'PICK']) {
    for (const side of ['BLUE', 'RED']) {
      assert.equal(draftOrder.filter((turn) => turn.kind === kind && turn.side === side).length, 5)
    }
  }
})

it('enforces side, turn, unique champions, and allows passing bans only', () => {
  const champion = champions[0].id
  assert.equal(appendDraftChoice([], 0, 'RED', champion), null)
  assert.equal(appendDraftChoice([], 1, 'HOST', champion), null)
  assert.equal(appendDraftChoice([], 0, 'BLUE', 'unknown'), null)
  assert.deepEqual(appendDraftChoice([], 0, 'BLUE', null), [null])
  assert.equal(appendDraftChoice([champion], 1, 'RED', champion), null)
  assert.equal(appendDraftChoice(Array(6).fill(null), 6, 'BLUE', null), null)
  let picks: (string | null)[] = []
  draftOrder.forEach(({ side }, turn) => {
    const next = appendDraftChoice(picks, turn, side, champions[turn].id)
    assert(next)
    picks = next
  })
  assert.equal(appendDraftChoice(picks, 20, 'HOST', champion), null)
})

it('matches hiragana, full-width and half-width katakana, and English IDs', () => {
  assert.equal(normalizeChampionSearch('あーり'), normalizeChampionSearch('アーリ'))
  assert.equal(normalizeChampionSearch('ｳﾞｪｲﾝ'), normalizeChampionSearch('ゔぇいん'))
  assert.equal(normalizeChampionSearch('Ａｈｒｉ'), 'ahri')
  assert.equal(normalizeChampionSearch('りーしん'), normalizeChampionSearch('リー・シン'))
  assert.equal(normalizeChampionSearch('かいさ'), normalizeChampionSearch('カイ＝サ'))
})
