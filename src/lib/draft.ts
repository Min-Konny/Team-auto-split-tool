import catalog from './draftChampions.json'

export type Side = 'BLUE' | 'RED'
export type DraftAction = { side: Side; kind: 'BAN' | 'PICK' }
export type DraftRoom = { id: string; choices: (string | null)[]; expiresAt: number }

export const champions = catalog.champions
export const patch = catalog.version
export const championsById = new Map(champions.map((champion) => [champion.id, champion]))
export const draftOrder: DraftAction[] = [
  ...phase('BAN', 'BRBRBR'),
  ...phase('PICK', 'BRRBBR'),
  ...phase('BAN', 'RBRB'),
  ...phase('PICK', 'RBBR'),
]

function phase(kind: DraftAction['kind'], sides: string): DraftAction[] {
  return Array.from(sides, (side) => ({ kind, side: side === 'B' ? 'BLUE' : 'RED' }))
}

export function appendDraftChoice(
  choices: DraftRoom['choices'], turn: number, side: Side | 'HOST', champion: string | null
): DraftRoom['choices'] | null {
  const action = draftOrder[turn]
  if (choices.length !== turn || !action || (side !== 'HOST' && side !== action.side)) return null
  if (champion === null ? action.kind !== 'BAN' : !championsById.has(champion) || choices.includes(champion)) return null
  return [...choices, champion]
}
