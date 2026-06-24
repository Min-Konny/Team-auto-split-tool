import { createHmac, timingSafeEqual } from 'crypto'

export const SESSION_COOKIE = 'team_maker_community'
const MAX_AGE_SEC = 60 * 60 * 24 * 30

export interface SessionPayload {
  communityId: string
  userId: string
  username: string
  exp: number
}

function secret(): string {
  return process.env.SESSION_SECRET || 'dev-insecure-change-in-production'
}

function sign(body: string): string {
  return createHmac('sha256', secret()).update(body).digest('base64url')
}

export function encodeSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  return `${body}.${sign(body)}`
}

export function decodeSession(token: string): SessionPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = sign(body)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  try {
    const json = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload
    if (!json.communityId || !json.userId || !json.username || !json.exp) return null
    if (Date.now() > json.exp) return null
    return json
  } catch {
    return null
  }
}

export function newSessionPayload(
  communityId: string,
  userId: string,
  username: string
): SessionPayload {
  return {
    communityId,
    userId,
    username,
    exp: Date.now() + MAX_AGE_SEC * 1000,
  }
}

export function sessionCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}
