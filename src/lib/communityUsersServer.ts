import bcrypt from 'bcryptjs'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebaseAdmin'
import { normalizeUsername, validatePassword, validateUsername } from '@/lib/communityAuth'
import { CommunityUserPublic } from '@/types/communityUser'

export async function findUserByUsername(
  communityId: string,
  username: string
): Promise<{ id: string; passwordHash: string; username: string; displayName: string | null } | null> {
  const db = getAdminFirestore()
  const lower = normalizeUsername(username)
  const snap = await db
    .collection('communities')
    .doc(communityId)
    .collection('users')
    .where('usernameLower', '==', lower)
    .limit(1)
    .get()
  if (snap.empty) return null
  const d = snap.docs[0]!
  const data = d.data()
  return {
    id: d.id,
    passwordHash: data.passwordHash as string,
    username: data.username as string,
    displayName: (data.displayName as string | null) ?? null,
  }
}

export async function createCommunityUser(
  communityId: string,
  username: string,
  password: string,
  displayName?: string
): Promise<CommunityUserPublic> {
  const nameErr = validateUsername(username)
  if (nameErr) throw new Error(nameErr)
  const passErr = validatePassword(password)
  if (passErr) throw new Error(passErr)

  const existing = await findUserByUsername(communityId, username)
  if (existing) throw new Error('このユーザー名は既に使われています')

  const db = getAdminFirestore()
  const lower = normalizeUsername(username)
  const passwordHash = await bcrypt.hash(password, 10)
  const ref = db.collection('communities').doc(communityId).collection('users').doc()

  await ref.set({
    username: username.trim(),
    usernameLower: lower,
    displayName: displayName?.trim() || null,
    passwordHash,
    createdAt: FieldValue.serverTimestamp(),
  })

  return {
    id: ref.id,
    username: username.trim(),
    displayName: displayName?.trim() || null,
  }
}

export async function verifyCommunityPasscode(
  communityId: string,
  passcode: string
): Promise<boolean> {
  const db = getAdminFirestore()
  const snap = await db.collection('communities').doc(communityId).get()
  if (!snap.exists) return false
  const hash = snap.data()?.passcodeHash as string | undefined
  if (!hash) return true
  return bcrypt.compare(passcode, hash)
}

export function assertAdminForUsers(): void {
  if (!isAdminConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('本番では FIREBASE_SERVICE_ACCOUNT_JSON が必須です')
    }
  }
}
