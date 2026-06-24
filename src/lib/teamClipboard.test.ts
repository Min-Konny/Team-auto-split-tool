import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { GameRole } from '@/types'
import { Member } from '@/types/member'
import { Teams } from '@/lib/teamBalancer'
import { formatTeamsForChat } from './teamClipboard'

const m = (name: string, id: string): Member =>
  ({
    id,
    name,
    nickname: name,
    elo: 1500,
    mainRole: GameRole.MID,
    roles: {
      [GameRole.TOP]: 'C',
      [GameRole.JUNGLE]: 'C',
      [GameRole.MID]: 'A',
      [GameRole.ADC]: 'C',
      [GameRole.SUP]: 'C',
    },
  }) as Member

describe('formatTeamsForChat', () => {
  it('formats lane rows with RED on the left', () => {
    const teams: Teams = {
      red: [
        { member: m('赤TOP', '1'), role: GameRole.TOP },
        { member: m('赤JG', '2'), role: GameRole.JUNGLE },
        { member: m('赤MID', '3'), role: GameRole.MID },
        { member: m('赤ADC', '4'), role: GameRole.ADC },
        { member: m('赤SUP', '5'), role: GameRole.SUP },
      ],
      blue: [
        { member: m('青TOP', '6'), role: GameRole.TOP },
        { member: m('青JG', '7'), role: GameRole.JUNGLE },
        { member: m('青MID', '8'), role: GameRole.MID },
        { member: m('青ADC', '9'), role: GameRole.ADC },
        { member: m('青SUP', '10'), role: GameRole.SUP },
      ],
    }

    assert.equal(
      formatTeamsForChat(teams),
      [
        'TEAM RED - TEAM BLUE',
        '赤TOP TOP 青TOP',
        '赤JG JUNGLE 青JG',
        '赤MID MID 青MID',
        '赤ADC ADC 青ADC',
        '赤SUP SUP 青SUP',
      ].join('\n')
    )
  })
})
