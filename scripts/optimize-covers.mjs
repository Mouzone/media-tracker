/**
 * One-time (and safely re-runnable) cover optimisation.
 *
 * Re-encodes every cover to 2:3, max 600x900, WebP q82 (~40–60 KB each, ~90%
 * smaller) and points each document at the result.
 *
 * Nothing is destroyed:
 *   - the compressed image is uploaded as a NEW object (.webp), so the original
 *     Storage object is left untouched;
 *   - `backup_images/` is preferred as the source, avoiding re-downloading 370 MB
 *     and doubling as a local rollback.
 *
 * Usage:
 *   npm run optimize-covers -- --dry-run
 *   npm run optimize-covers
 *
 * Flags:
 *   --dry-run   Report what would change; make no writes at all.
 *   --force     Re-process covers that already look optimised.
 *   --limit N   Only handle the first N candidates.
 *
 * Requires a service account key at `service-account.json` (see scripts/firebase-node.mjs).
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import {
  connect,
  MEDIA_COLLECTION,
  COVERS_PREFIX,
  storagePathFromCover,
  formatBytes,
} from './firebase-node.mjs'

const COVER_WIDTH = 600
const COVER_HEIGHT = 900
const COVER_QUALITY = 82
const BACKUP_DIR = 'backup_images'
const REPORT_FILE = 'migration-report.json'
const CONCURRENCY = 6

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const isForce = args.includes('--force')
const limitArg = args.indexOf('--limit')
const limit = limitArg !== -1 ? Number(args[limitArg + 1]) : Infinity

function localCachePath(storagePath) {
  const withoutPrefix = storagePath.replace(new RegExp(`^${COVERS_PREFIX}/`), '')
  return path.join(BACKUP_DIR, withoutPrefix.replace(/[\\/]/g, '_'))
}

async function readSource(storage, storagePath) {
  const cached = localCachePath(storagePath)
  try {
    const buffer = await fs.readFile(cached)
    return { buffer, from: 'local' }
  } catch {
    // Not cached locally — pull it from Storage via the Admin SDK.
  }

  const fileRef = storage.bucket().file(storagePath)
  const [buffer] = await fileRef.download()

  await fs.mkdir(BACKUP_DIR, { recursive: true })
  await fs.writeFile(cached, buffer)
  return { buffer, from: 'remote' }
}

async function compress(buffer) {
  return sharp(buffer)
    .rotate()
    .resize({
      width: COVER_WIDTH,
      height: COVER_HEIGHT,
      fit: 'cover',
      position: 'attention',
      withoutEnlargement: true,
    })
    .webp({ quality: COVER_QUALITY })
    .toBuffer()
}

function alreadyOptimised(data) {
  return (
    typeof data.cover_path === 'string' &&
    data.cover_path.endsWith('.webp') &&
    typeof data.cover_url === 'string' &&
    data.cover_url.startsWith('http')
  )
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = []
  let cursor = 0

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index], index)
    }
  })

  await Promise.all(runners)
  return results
}

async function main() {
  console.log(isDryRun ? '— DRY RUN: no writes will be made —\n' : '— LIVE RUN —\n')

  const { db, storage } = await connect()
  console.log('Connected to Firebase (Admin SDK)\n')

  const snapshot = await db.collection(MEDIA_COLLECTION).get()
  const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  console.log(`Loaded ${docs.length} documents.`)

  const census = { status: {}, type: {}, rating: {} }
  for (const item of docs) {
    for (const field of Object.keys(census)) {
      const key = String(item[field] ?? '(missing)')
      census[field][key] = (census[field][key] ?? 0) + 1
    }
  }
  console.log('\nField census:')
  for (const [field, counts] of Object.entries(census)) {
    console.log(`  ${field}: ${JSON.stringify(counts)}`)
  }

  const skipped = { noCover: 0, alreadyOptimised: 0, external: 0 }
  const candidates = []

  for (const item of docs) {
    if (!item.cover_url) {
      skipped.noCover++
      continue
    }
    if (!isForce && alreadyOptimised(item)) {
      skipped.alreadyOptimised++
      continue
    }

    const storagePath = storagePathFromCover(item.cover_url)
    if (!storagePath) {
      skipped.external++
      continue
    }
    candidates.push({ item, storagePath })
  }

  const queue = candidates.slice(0, limit)
  console.log(
    `\nCandidates: ${candidates.length} (processing ${queue.length})` +
      `\nSkipped: ${skipped.noCover} without covers, ${skipped.alreadyOptimised} already optimised, ` +
      `${skipped.external} external URLs\n`,
  )

  let done = 0
  const results = await mapWithConcurrency(queue, CONCURRENCY, async ({ item, storagePath }) => {
    const label = item.title ?? item.id

    try {
      const { buffer, from } = await readSource(storage, storagePath)
      const optimised = await compress(buffer)

      const base = path.basename(storagePath).replace(/\.[^.]+$/, '')
      const newPath = `${COVERS_PREFIX}/${base}.webp`

      let newUrl = null
      if (!isDryRun) {
        const fileRef = storage.bucket().file(newPath)
        await fileRef.save(optimised, {
          contentType: 'image/webp',
          metadata: { cacheControl: 'public, max-age=31536000, immutable' },
        })

        // Signed URL valid for ~100 years — covers are immutable and content-addressed.
        const [url] = await fileRef.getSignedUrl({
          action: 'read',
          expires: '03-09-2491',
        })
        newUrl = url

        await db.collection(MEDIA_COLLECTION).doc(item.id).update({
          cover_url: newUrl,
          cover_path: newPath,
        })
      }

      done++
      const saved = Math.round((1 - optimised.length / buffer.length) * 100)
      console.log(
        `  [${done}/${queue.length}] ${label}: ${formatBytes(buffer.length)} → ` +
          `${formatBytes(optimised.length)} (−${saved}%, source: ${from})`,
      )

      return {
        id: item.id,
        title: item.title,
        ok: true,
        from,
        oldPath: storagePath,
        oldCoverUrl: item.cover_url,
        newPath,
        newUrl,
        beforeBytes: buffer.length,
        afterBytes: optimised.length,
      }
    } catch (error) {
      done++
      console.error(`  [${done}/${queue.length}] ${label}: FAILED — ${error.message}`)
      return { id: item.id, title: item.title, ok: false, error: error.message, oldPath: storagePath }
    }
  })

  const succeeded = results.filter((r) => r.ok)
  const failed = results.filter((r) => !r.ok)
  const before = succeeded.reduce((sum, r) => sum + r.beforeBytes, 0)
  const after = succeeded.reduce((sum, r) => sum + r.afterBytes, 0)

  console.log('\n─────────────────────────────────────')
  console.log(`Processed: ${succeeded.length}   Failed: ${failed.length}`)
  console.log(`Total size: ${formatBytes(before)} → ${formatBytes(after)}`)
  if (before > 0) {
    console.log(`Reduction: ${Math.round((1 - after / before) * 100)}%`)
  }
  if (isDryRun) console.log('\nDry run — nothing was written. Re-run without --dry-run to apply.')

  await fs.writeFile(
    REPORT_FILE,
    JSON.stringify(
      { ranAt: new Date().toISOString(), dryRun: isDryRun, census, skipped, results },
      null,
      2,
    ),
  )
  console.log(`\nReport written to ${REPORT_FILE}`)

  if (failed.length > 0) process.exitCode = 1
}

main().then(
  () => process.exit(process.exitCode ?? 0),
  (error) => {
    console.error('\nMigration failed:', error)
    process.exit(1)
  },
)
