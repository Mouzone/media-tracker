/**
 * Shared Firebase bootstrap for the Node-side scripts (backup, cover migration).
 *
 * Uses the Firebase Admin SDK with a service account key — the standard approach
 * for privileged scripts. The service account bypasses security rules, so no
 * email/password or Google sign-in is needed.
 *
 * Setup (one time):
 *   1. Firebase Console > Project Settings > Service Accounts > Generate new private key
 *   2. Save the JSON file as `service-account.json` in the project root
 *      (already gitignored — it's a secret)
 *
 * In CI, set GOOGLE_APPLICATION_CREDENTIALS to point at the key file, or base64-
 * encode it and write it out in the workflow.
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const KEY_PATH = path.resolve(__dirname, '..', 'service-account.json')

export const MEDIA_COLLECTION = 'media_items'
export const COVERS_PREFIX = 'covers'

let app = null

function resolveCredentials() {
  // Explicit path takes priority.
  if (fs.existsSync(KEY_PATH)) {
    return cert(JSON.parse(fs.readFileSync(KEY_PATH, 'utf8')))
  }

  // CI: GOOGLE_APPLICATION_CREDENTIALS points at the key file.
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return cert(JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')))
  }

  // Fall back to application default credentials (gcloud auth application-default login).
  // Returns undefined, which tells the Admin SDK to use ADC.
  return undefined
}

/**
 * Initializes the Admin app and returns Firestore + Storage handles.
 */
export async function connect() {
  if (!app) {
    const credentials = resolveCredentials()
    app = initializeApp({
      projectId: 'media-tracker-94a70',
      storageBucket: 'media-tracker-94a70.firebasestorage.app',
      credential: credentials,
    })
  }

  return {
    app,
    db: getFirestore(app),
    storage: getStorage(app),
  }
}

/**
 * Extracts the Storage object path from whatever a `cover_url` happens to hold.
 *
 * Returns `null` for URLs that aren't in this project's bucket.
 */
export function storagePathFromCover(coverUrl) {
  if (!coverUrl) return null

  if (!coverUrl.startsWith('http')) {
    return coverUrl.includes('/') ? coverUrl : `${COVERS_PREFIX}/${coverUrl}`
  }

  if (!coverUrl.includes('firebasestorage.googleapis.com')) return null

  const match = coverUrl.match(/\/o\/([^?]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
