import type { MatchEloChange } from '@/types'
import type { Teams } from '@/lib/teamBalancer'

export async function createResultCard(
  teams: Teams,
  winner: 'BLUE' | 'RED',
  changes: MatchEloChange[]
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 1000
  canvas.height = 540
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('画像を作成できませんでした')

  const background = ctx.createLinearGradient(0, 0, 1000, 540)
  background.addColorStop(0, '#12283e')
  background.addColorStop(.55, '#101522')
  background.addColorStop(1, '#381e2c')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, 1000, 540)

  const text = (value: string, x: number, y: number, color: string, size: number, bold = false) => {
    ctx.fillStyle = color
    ctx.font = (bold ? '700 ' : '400 ') + size + 'px system-ui, sans-serif'
    ctx.fillText(value, x, y)
  }
  text('LOL TEAM MAKER  /  MATCH RESULT', 42, 49, '#ead29b', 16, true)
  text(winner + ' WIN', 42, 109, '#f8f5ec', 49, true)
  text('CUSTOM 5V5', 808, 106, '#bcc5d9', 18, true)

  const byId = new Map(changes.map((change) => [change.memberId, change]))
  for (const side of ['blue', 'red'] as const) {
    const x = side === 'blue' ? 42 : 516
    const accent = side === 'blue' ? '#99dfff' : '#ffa4ae'
    ctx.fillStyle = '#0e1523'
    ctx.fillRect(x, 144, 442, 341)
    ctx.fillStyle = accent
    ctx.fillRect(x, 144, 442, 3)
    text(side.toUpperCase() + ' SIDE', x + 20, 186, accent, 20, true)
    teams[side].forEach(({ member, role }, i) => {
      const y = 235 + i * 50
      const change = byId.get(member.id)
      const isMvp = change?.performance === 'MVP'
      ctx.fillStyle = '#29364a'
      ctx.fillRect(x + 20, y + 13, 402, 1)
      text(role, x + 20, y, '#a7b6cb', 14, true)
      ctx.font = '700 19px system-ui, sans-serif'
      let name = member.nickname || member.name
      if (ctx.measureText(name).width > 195) {
        const characters = Array.from(name)
        while (characters.length && ctx.measureText(characters.join('') + '…').width > 195) characters.pop()
        name = characters.join('') + '…'
      }
      text(name, x + 105, y, '#f5f7ff', 19, true)
      if (isMvp) text('MVP', x + 309, y, '#ead29b', 14, true)
      if (change) {
        ctx.textAlign = 'right'
        text((change.delta > 0 ? '+' : '') + change.delta, x + 419, y, change.delta < 0 ? '#ffadb7' : '#9ce2ba', 20, true)
        ctx.textAlign = 'left'
      }
    })
  }
  text('RIFT TEAM MAKER', 42, 515, '#a7b6cb', 13, true)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNGを作成できませんでした')), 'image/png')
  })
}
