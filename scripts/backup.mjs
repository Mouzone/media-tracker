/**
 * Scheduled backup: exports every document to JSON (locally and to Storage) and
 * mirrors each cover image into `backup_images/`.
 *
 * Uses the Admin SDK with a service account key (see scripts/firebase-node.mjs).
 *
 * Usage:
 *   npm run backup
 *   npm run backup -- --skip-images
 *
 * `--skip-images` exports documents only. CI uses it to avoid re-downloading
 * ~370 MB into an ephemeral runner. Run without the flag locally to maintain
 * the image mirror that scripts/optimize-covers.mjs uses as its source.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  connect,
  MEDIA_COLLECTION,
  COVERS_PREFIX,
  storagePathFromCover,
  formatBytes,
} from './firebase-node.mjs'

const BACKUP_DIR = 'backup_images'
const BACKUP_FILE = 'backup.json'
const skipImages = process.argv.includes('--skip-images')

function localCachePath(storagePath) {
  const withoutPrefix = storagePath.replace(new RegExp(`^${COVERS_PREFIX}/`), '')
  return path.join(BACKUP_DIR, withoutPrefix.replace(/[\\/]/g, '_'))
}

async function backupImage(storage, storagePath) {
  const localPath = localCachePath(storagePath)

  try {
    await fs.access(localPath)
    return 'cached'
  } catch {
    // Not held locally yet — fetch it.
  }

  const fileRef = storage.bucket().file(storagePath)
  const [buffer] = await fileRef.download()
  await fs.writeFile(localPath, buffer)
  return 'downloaded'
}

async function main() {
  const { db, storage } = await connect()
  console.log('Connected to Firebase (Admin SDK)')

  const snapshot = await db.collection(MEDIA_COLLECTION).get()
  const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))

  if (items.length === 0) {
    throw new Error('Read 0 documents — refusing to overwrite the backup with an empty export.')
  }

  const json = JSON.stringify(items, null, 2)
  await fs.writeFile(BACKUP_FILE, json)
  console.log(`Exported ${items.length} documents (${formatBytes(Buffer.byteLength(json))}) to ${BACKUP_FILE}`)

  const counts = { cached: 0, downloaded: 0, failed: 0 }

  if (skipImages) {
    console.log('Skipping the image mirror (--skip-images).')
  } else {
    await fs.mkdir(BACKUP_DIR, { recursive: true })

    for (const item of items) {
      const storagePath = storagePathFromCover(item.cover_url)
      if (!storagePath) continue

      try {
        counts[await backupImage(storage, storagePath)]++
      } catch (error) {
        counts.failed++
        console.error(`  Could not back up ${storagePath}: ${error.message}`)
      }
    }

    console.log(
      `Images: ${counts.downloaded} newly downloaded, ${counts.cached} already held, ${counts.failed} failed`,
    )
  }

  // Keep a timestamped copy in Storage.
  const timestamp = new Date().toISOString()
  const backupRef = storage.bucket().file(`backups/backup-${timestamp.replace(/:/g, '-')}.json`)
  await backupRef.save(json, { contentType: 'application/json' })
  console.log(`Uploaded a copy to gs://${backupRef.bucket.name}/${backupRef.name}`)

  if (counts.failed > 0) process.exitCode = 1
}

main().then(
  () => process.exit(process.exitCode ?? 0),
  (error) => {
    console.error('Backup failed:', error)
    process.exit(1)
  },
)
