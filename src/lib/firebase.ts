import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const hasFirebaseEnv = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)
const effectiveConfig = hasFirebaseEnv
  ? firebaseConfig
  : {
      apiKey: 'local-dev-placeholder',
      authDomain: 'local-dev-placeholder.firebaseapp.com',
      projectId: 'local-dev-placeholder',
      storageBucket: 'local-dev-placeholder.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:localdevplaceholder',
      measurementId: undefined,
    }

if (!hasFirebaseEnv && typeof window !== 'undefined') {
  // Keep UI accessible in local design mode.
  console.warn('Firebase env is missing. Running in local placeholder mode.')
}

const app = getApps().length ? getApp() : initializeApp(effectiveConfig)
export const db = getFirestore(app)

// クライアントサイドかつサポート環境でのみAnalyticsを初期化
export let analytics: ReturnType<typeof getAnalytics> | null = null
if (hasFirebaseEnv && typeof window !== 'undefined') {
  isSupported().then((ok) => {
    if (ok) analytics = getAnalytics(app)
  })
}