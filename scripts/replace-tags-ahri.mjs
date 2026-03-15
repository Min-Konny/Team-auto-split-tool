import { initializeApp } from 'firebase/app'
import { collection, doc, getDocs, getFirestore, updateDoc } from 'firebase/firestore'
import { existsSync, readFileSync } from 'node:fs'

// Load .env.local without extra dependencies
if (existsSync('.env.local')) {
  const raw = readFileSync('.env.local', 'utf8')
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const index = trimmed.indexOf('=')
    if (index <= 0) return
    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = value
    }
  })
}

const requiredKeys = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
]

const missingKeys = requiredKeys.filter((key) => !process.env[key])
if (missingKeys.length > 0) {
  console.error('[ERROR] Missing Firebase env vars:')
  missingKeys.forEach((key) => console.error(`- ${key}`))
  process.exit(1)
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const TARGET_TAG = 'アーリ組'

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function run() {
  console.log('[INFO] Start replacing tags to アーリ組')
  const snapshot = await getDocs(collection(db, 'players'))
  let updatedCount = 0

  for (const playerDoc of snapshot.docs) {
    const player = playerDoc.data()
    const tags = Array.isArray(player.tags) ? player.tags : []
    const shouldUpdate = tags.length !== 1 || tags[0] !== TARGET_TAG
    if (!shouldUpdate) continue

    await updateDoc(doc(db, 'players', playerDoc.id), {
      tags: [TARGET_TAG],
    })
    updatedCount++
  }

  console.log(`[INFO] Done. Updated players: ${updatedCount}`)
}

run().catch((error) => {
  console.error('[ERROR] Tag migration failed:', error)
  process.exit(1)
})
