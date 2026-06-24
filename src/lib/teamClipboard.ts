import { GameRole } from '@/types'
import { TeamSlot, Teams } from '@/lib/teamBalancer'

const ROLE_ORDER: GameRole[] = [GameRole.TOP, GameRole.JUNGLE, GameRole.MID, GameRole.ADC, GameRole.SUP]

function slotName(slot: TeamSlot | undefined): string {
  if (!slot) return '—'
  return slot.member.nickname || slot.member.name
}

function slotByRole(team: TeamSlot[], role: GameRole): TeamSlot | undefined {
  return team.find((t) => t.role === role)
}

/** Discord / LoL チャット用のチーム表テキスト */
export function formatTeamsForChat(teams: Teams): string {
  const lines = ['TEAM RED - TEAM BLUE']
  for (const role of ROLE_ORDER) {
    const red = slotByRole(teams.red, role)
    const blue = slotByRole(teams.blue, role)
    lines.push(`${slotName(red)} ${role} ${slotName(blue)}`)
  }
  return lines.join('\n')
}
