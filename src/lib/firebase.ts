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

const hasRequiredFirebaseEnv =
  !!firebaseConfig.apiKey && !!firebaseConfig.projectId && !!firebaseConfig.appId

/**
 * NOTE:
 * - Vercel build時は環境変数が未設定でもページ収集が走るため、
 *   ここで throw するとデプロイが失敗する。
 * - 実行時に env が揃っていれば通常構成、未設定時はビルド通過用の
 *   ダミー値で初期化して、クライアント側に警告を出す。
 */
const fallbackConfig = {
  apiKey: 'build-placeholder',
  authDomain: 'build-placeholder.local',
  projectId: 'build-placeholder',
  storageBucket: 'build-placeholder.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:buildplaceholder',
  measurementId: undefined,
}

const resolvedConfig = hasRequiredFirebaseEnv ? firebaseConfig : fallbackConfig
const app = getApps().length ? getApp() : initializeApp(resolvedConfig)
export const db = getFirestore(app)

// クライアントサイドかつサポート環境でのみAnalyticsを初期化
export let analytics: ReturnType<typeof getAnalytics> | null = null
if (typeof window !== 'undefined') {
  if (!hasRequiredFirebaseEnv) {
    // デプロイ時の誤設定に気付きやすくするための明示ログ
    console.error('Firebase env is missing. Check NEXT_PUBLIC_FIREBASE_* variables.')
  }

  if (!hasRequiredFirebaseEnv) {
    // env がない状態では analytics 初期化を行わない
    // （ダミー設定での初期化を避ける）
  } else {
  isSupported().then((ok) => {
    if (ok) analytics = getAnalytics(app)
  })
  }
}