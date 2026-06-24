const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

export function validateUsername(username: string): string | null {
  const raw = username.trim()
  if (!USERNAME_RE.test(raw)) {
    return 'ユーザー名は英数字と _ のみ、3〜20文字です'
  }
  return null
}

export function validatePassword(password: string): string | null {
  if (!password || password.length < 6) {
    return 'パスワードは6文字以上にしてください'
  }
  return null
}
