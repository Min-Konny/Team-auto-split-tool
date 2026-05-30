import type { NextApiRequest, NextApiResponse } from 'next'
import { registerMatchAtomic, MatchPlayerPayload } from '@/lib/registerMatch'
import { assertSessionSecretConfigured } from '@/lib/sessionSecret'
import { getSessionFromRequest } from '@/lib/apiAuth'
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

  const { winner, players, balanceScore, splitMode } = req.body as {
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
    if (!p.playerId || !validRoles.has(p.role) || (p.team !== 'BLUE' && p.team !== 'RED')) {
      return res.status(400).json({ error: 'players の形式が不正です' })
    }
  }

  try {
    const result = await registerMatchAtomic(session.communityId, winner, players, {
      balanceScore,
      splitMode,
    })
    return res.status(200).json(result)
  } catch (e) {
    console.error('register match:', e)
    return res.status(500).json({ error: e instanceof Error ? e.message : '登録に失敗しました' })
  }
}
