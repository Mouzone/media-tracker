import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

/**
 * Firebase web config is *not* a secret. These values identify the project to
 * Google's APIs; they are shipped in every Firebase web app's bundle by design.
 * Access control lives entirely in `firestore.rules` and `storage.rules`, which
 * restrict reads and writes to the owner's account.
 *
 * They're read from `import.meta.env` so a different project can be swapped in
 * via `.env` without touching source, but the working values are committed as
 * defaults so a fresh clone runs with no setup.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyB4gt3kN-1QSXcUFaaOUYJjbG5La-5iA64',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'media-tracker-94a70.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'media-tracker-94a70',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'media-tracker-94a70.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '753329770698',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:753329770698:web:2fb091751e1de2696ce433',
}

export const app = initializeApp(firebaseConfig)

/**
 * Firestore is initialized with a persistent (IndexedDB) local cache rather than
 * the default in-memory one. This is what makes the app feel instant:
 *
 *  - On load, `onSnapshot` fires immediately from disk before any network round
 *    trip, so the library paints from the previous session's data right away.
 *  - Writes are applied to the local cache first (latency compensation), so
 *    listeners see saves and deletes before the server acknowledges them — we get
 *    optimistic updates for free, with no manual cache reconciliation.
 *  - The app keeps working offline.
 *
 * `persistentMultipleTabManager` keeps the cache coherent across browser tabs.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

export const storage = getStorage(app)
export const auth = getAuth(app)

/** Firestore collection holding every tracked item. */
export const MEDIA_COLLECTION = 'media_items'
