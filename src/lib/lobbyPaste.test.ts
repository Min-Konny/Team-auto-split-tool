import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { extractSummonerNameFromLobbyLine, parseLobbyJoinLines } from './lobbyPaste'

const SAMPLE =
  '\u2066\u2066こにー\u2069 #\u20660329\u2069\u2069がロビーに参加しました。'

describe('lobbyPaste', () => {
  it('extracts summoner name from LoL lobby join message', () => {
    assert.equal(extractSummonerNameFromLobbyLine(SAMPLE), 'こにー')
  })

  it('parses multiple join lines', () => {
    const text = [
      SAMPLE,
      '\u2066たろう\u2069 #\u20661234\u2069がロビーに参加しました。',
      'さんかく',
    ].join('\n')
    assert.deepEqual(parseLobbyJoinLines(text), ['こにー', 'たろう', 'さんかく'])
  })

  it('ignores empty lines', () => {
    assert.deepEqual(parseLobbyJoinLines('\n\n'), [])
  })
})
