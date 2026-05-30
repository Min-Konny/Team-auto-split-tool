import { Member } from '@/types/member'

export type PasteMatchStatus = 'matched' | 'ambiguous' | 'unmatched'

export interface PasteLineResult {
  raw: string
  normalized: string
  status: PasteMatchStatus
  player?: Member
  candidates?: Member[]
}

/** Discord のメンション・記号を除いて1行1名に分解 */
export function parseDiscordLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      let s = line.replace(/^@+/, '').trim()
      s = s.replace(/<@!?\d+>/g, '').trim()
      s = s.replace(/^[@#]+/, '').trim()
      const dash = s.split(/\s*[—–-]\s+/)
      if (dash.length > 1) s = dash[0].trim()
      return s
    })
    .filter(Boolean)
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[#\uFF03]/g, '')
}

function displayKey(p: Member): string[] {
  const keys = [p.nickname, p.name].filter(Boolean) as string[]
  return keys.map(normalize)
}

function scoreMatch(line: string, p: Member): number {
  const n = normalize(line)
  if (!n) return 0
  const keys = displayKey(p)
  if (keys.some((k) => k === n)) return 100
  if (keys.some((k) => k.includes(n) || n.includes(k))) return 50
  return 0
}

export function matchPasteLines(lines: string[], players: Member[]): PasteLineResult[] {
  return lines.map((raw) => {
    const normalized = raw.trim()
    const scored = players
      .map((p) => ({ p, score: scoreMatch(normalized, p) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)

    if (scored.length === 0) {
      return { raw, normalized, status: 'unmatched' as const }
    }
    if (scored.length === 1 || scored[0].score === 100) {
      return { raw, normalized, status: 'matched' as const, player: scored[0].p }
    }
    const top = scored[0].score
    const tied = scored.filter((x) => x.score === top)
    if (tied.length === 1) {
      return { raw, normalized, status: 'matched' as const, player: tied[0].p }
    }
    return {
      raw,
      normalized,
      status: 'ambiguous' as const,
      candidates: tied.map((x) => x.p),
    }
  })
}

export function resolvedPlayerIds(results: PasteLineResult[], picks: Record<number, string>): string[] {
  const ids: string[] = []
  results.forEach((r, i) => {
    if (r.status === 'matched' && r.player?.id) {
      ids.push(r.player.id)
      return
    }
    if (r.status === 'ambiguous' && picks[i]) {
      ids.push(picks[i])
    }
  })
  return Array.from(new Set(ids))
}
