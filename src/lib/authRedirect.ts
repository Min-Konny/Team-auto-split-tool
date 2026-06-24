import type { NextApiRequest, NextApiResponse } from 'next'

export function isFormLogin(req: NextApiRequest): boolean {
  const ct = req.headers['content-type'] || ''
  return ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')
}

export function safeRedirectPath(path: unknown, fallback = '/team-maker'): string {
  if (typeof path !== 'string') return fallback
  const trimmed = path.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback
  return trimmed
}

export function redirectWithCookie(
  res: NextApiResponse,
  location: string,
  setCookie: string
): void {
  res.setHeader('Set-Cookie', setCookie)
  res.writeHead(302, { Location: location })
  res.end()
}

export function redirectLoginError(
  res: NextApiResponse,
  message: string,
  communityId?: string
): void {
  const q = new URLSearchParams({ error: message })
  if (communityId) q.set('id', communityId)
  res.writeHead(302, { Location: `/community/join?${q.toString()}` })
  res.end()
}
