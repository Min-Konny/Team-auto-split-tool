import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { NextApiRequest, NextApiResponse } from 'next'
import { appendDraftChoice, type DraftRoom, type Side } from '@/lib/draft'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/apiAuth'
import { assertSessionSecretConfigured } from '@/lib/sessionSecret'

type Seat = Side | 'HOST'
type StoredRoom = Omit<DraftRoom, 'id'> & { keys: Record<Seat, string> }
const lifetime = 4 * 60 * 60 * 1000
const roomId = /^[a-f0-9-]{36}$/
const hash = (key: string) => createHash('sha256').update(key).digest('hex')
const accessKey = () => randomBytes(24).toString('base64url')
const publicRoom = (id: string, { choices, expiresAt }: StoredRoom): DraftRoom => ({ id, choices, expiresAt })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: '未対応の操作です' })
  }
  const id = req.query.id
  const { key, turn, champion } = (req.body ?? {}) as { key?: unknown; turn?: unknown; champion?: unknown }
  try {
    assertSessionSecretConfigured()
    if (req.method === 'POST' && id === undefined) {
      if (!getSessionFromRequest(req)) return res.status(401).json({ error: 'コミュニティに参加してから作成してください' })
      const keys = { BLUE: accessKey(), RED: accessKey(), HOST: accessKey() }
      const room: StoredRoom = {
        choices: [], expiresAt: Date.now() + lifetime,
        keys: { BLUE: hash(keys.BLUE), RED: hash(keys.RED), HOST: hash(keys.HOST) },
      }
      const ref = getAdminFirestore().collection('draftRooms').doc(randomUUID())
      await ref.create(room)
      return res.status(201).json({ room: publicRoom(ref.id, room), keys })
    }
    if (typeof id !== 'string' || !roomId.test(id)) return res.status(400).json({ error: 'ルームIDが不正です' })
    const db = getAdminFirestore()
    const ref = db.collection('draftRooms').doc(id)
    if (req.method === 'GET') {
      const room = (await ref.get()).data() as StoredRoom | undefined
      if (!room || room.expiresAt <= Date.now()) return res.status(404).json({ error: 'ルームが見つからないか、有効期限が切れました' })
      return res.status(200).json({ room: publicRoom(id, room) })
    }
    if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{32}$/.test(key) || typeof turn !== 'number' ||
      !Number.isInteger(turn) || !(typeof champion === 'string' || champion === null)) {
      return res.status(400).json({ error: '選択内容が不正です' })
    }
    const keyHash = hash(key)
    const reply = await db.runTransaction(async (tx) => {
      const room = (await tx.get(ref)).data() as StoredRoom | undefined
      if (!room || room.expiresAt <= Date.now()) return { status: 404, error: 'ルームが見つからないか、有効期限が切れました' }
      const seat = (['BLUE', 'RED', 'HOST'] as const).find((side) => room.keys[side] === keyHash)
      if (!seat) return { status: 403, error: 'このルームを操作できるリンクを開いてください' }
      const choices = appendDraftChoice(room.choices, turn, seat, champion)
      if (!choices) return { status: 409, error: '手番が進んだか、このチャンピオンは選択できません', room: publicRoom(id, room) }
      tx.update(ref, { choices })
      return { status: 200, room: publicRoom(id, { ...room, choices }) }
    })
    const { status, ...body } = reply
    return res.status(status).json(body)
  } catch (error) {
    console.error('draft room:', error)
    return res.status(500).json({ error: 'ドラフトに接続できませんでした。時間をおいて再試行してください' })
  }
}
