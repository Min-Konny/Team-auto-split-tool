import { App, cert, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app'
import { Firestore, getFirestore } from 'firebase-admin/firestore'

let adminApp: App | null = null

function parseServiceAccount(): Record<string, unknown> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) return null
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON が不正な JSON です')
  }
}

export function isAdminConfigured(): boolean {
  return !!parseServiceAccount()
}

export function getAdminApp(): App {
  if (adminApp) return adminApp
  const existing = getApps()
  if (existing.length) {
    adminApp = existing[0]!
    return adminApp
  }
  const sa = parseServiceAccount()
  if (!sa) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON が未設定です。Firebase コンソールのサービスアカウント JSON を設定してください。'
    )
  }
  adminApp = initializeApp({ credential: cert(sa as ServiceAccount) })
  return adminApp
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp())
}
