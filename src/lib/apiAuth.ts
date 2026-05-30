import type { NextApiRequest } from 'next'
import { decodeSession, SESSION_COOKIE, SessionPayload } from '@/lib/sessionCookie'

export function getSessionFromRequest(req: NextApiRequest): SessionPayload | null {
  const token = req.cookies[SESSION_COOKIE]
  return token ? decodeSession(token) : null
}
