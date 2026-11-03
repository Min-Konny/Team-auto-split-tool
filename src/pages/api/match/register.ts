import type { NextApiRequest, NextApiResponse } from 'next'
import { registerMatchAtomic, MatchPlayerPayload } from '@/lib/registerMatch'
import { assertSessionSecretConfigured } from '@/lib/sessionSecret'
import { getSessionFromRequest } from '@/lib/apiAuth'
import type { MatchPerformance } from '@/lib/elo'
import { GameRole } from '@/types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    assertSessionSecretConfigured()
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Server misconfigured' })
  }

  const session = getSessionFromRequest(req)
  if (!session) {
    return res.status(401).json({ error: 'コミュニティに参加してください' })
  }

  const { winner, players, balanceScore, splitMode, performance, registrationId } = (req.body ?? {}) as {
    performance?: MatchPerformance
    registrationId?: string
    winner?: 'BLUE' | 'RED'
    players?: MatchPlayerPayload[]
    balanceScore?: number
    splitMode?: string
  }

  if (winner !== 'BLUE' && winner !== 'RED') {
    return res.status(400).json({ error: 'winner が不正です' })
  }
  if (!Array.isArray(players) || players.length !== 10) {
    return res.status(400).json({ error: 'players は10人必要です' })
  }

  const validRoles = new Set(Object.values(GameRole))
  for (const p of players) {
    if (!p || typeof p.playerId !== 'string' || !p.playerId || p.playerId.includes('/') || !validRoles.has(p.role) || (p.team !== 'BLUE' && p.team !== 'RED')) {
      return res.status(400).json({ error: 'players の形式が不正です' })
    }
  }

  const ids = new Set(players.map((p) => p.playerId))
  if (ids.size !== 10 || players.filter((p) => p.team === 'BLUE').length !== 5) {
    return res.status(400).json({ error: '異なる10人を5人ずつに分けてください' })
  }
  if (performance !== undefined && (!performance || typeof performance !== 'object' || Array.isArray(performance) ||
    (performance.mvpId !== undefined && !ids.has(performance.mvpId)) ||
    (performance.penaltyId !== undefined && !ids.has(performance.penaltyId)) ||
    (performance.mvpId !== undefined && performance.mvpId === performance.penaltyId))) {
    return res.status(400).json({ error: '個人補正は異なる試合参加者から選んでください' })
  }
  if (registrationId !== undefined && (typeof registrationId !== 'string' ||
    !/^[a-f0-9-]{36}$/.test(registrationId))) {
    return res.status(400).json({ error: '登録IDが不正です' })
  }

  try {
    const result = await registerMatchAtomic(session.communityId, winner, players, {
      balanceScore,
      splitMode,
      performance,
      registrationId,
    })
    return res.status(200).json(result)
  } catch (e) {
    console.error('register match:', e)
    return res.status(500).json({ error: e instanceof Error ? e.message : '登録に失敗しました' })
  }
}
