import bcrypt from 'bcryptjs'
import { presetPasswordFor } from '@/constants/community'
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebaseAdmin'

export async function verifyCommunityPassword(
  communityId: string,
  password: string
): Promise<boolean> {
  const preset = presetPasswordFor(communityId)
  if (preset) return password === preset

  const db = getAdminFirestore()
  const snap = await db.collection('communities').doc(communityId).get()
  if (!snap.exists) return false
  const hash = snap.data()?.passcodeHash as string | undefined
  if (!hash) return false
  return bcrypt.compare(password, hash)
}

export function assertAdminForUsers(): void {
  if (!isAdminConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('本番では FIREBASE_SERVICE_ACCOUNT_JSON が必須です')
    }
  }
}
