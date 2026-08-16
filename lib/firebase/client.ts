import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Validar que existan las credenciales mínimas antes de inicializar
const isConfigured = !!firebaseConfig.projectId && !!firebaseConfig.appId

let app: any = null

if (isConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
  } catch (err) {
    console.error('Error inicializando Firebase:', err)
  }
} else {
  console.warn('Firebase no inicializado: Faltan variables de entorno NEXT_PUBLIC_FIREBASE_*')
}

export { app }
