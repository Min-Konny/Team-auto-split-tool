export function assertSessionSecretConfigured(): void {
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET?.trim()) {
    throw new Error('SESSION_SECRET is required in production')
  }
}
