import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../lib/firebase'
import { processCoverImage } from '../lib/image'

const COVERS_PREFIX = 'covers'

export interface UploadedCover {
  /** Storage path, stored on the document as `cover_path`. */
  path: string
  /** Full download URL, stored on the document as `cover_url`. */
  url: string
  originalBytes: number
  uploadedBytes: number
}

/**
 * Compresses and uploads a cover, returning a directly-usable download URL.
 *
 * The URL is persisted on the document so nothing has to resolve it later. The
 * old flow stored a bare filename and called `getDownloadURL()` for every image
 * on every page render — 20 sequential round trips before the first cover could
 * even start downloading.
 */
export async function uploadCoverImage(file: File): Promise<UploadedCover> {
  const { blob, extension, originalBytes } = await processCoverImage(file)

  const path = `${COVERS_PREFIX}/${Date.now()}-${randomSuffix()}.${extension}`
  const storageRef = ref(storage, path)

  await uploadBytes(storageRef, blob, {
    contentType: blob.type,
    // Covers are immutable once written — each upload gets a unique name — so
    // they can be cached aggressively by the browser and any CDN in front.
    cacheControl: 'public, max-age=31536000, immutable',
  })

  return {
    path,
    url: await getDownloadURL(storageRef),
    originalBytes,
    uploadedBytes: blob.size,
  }
}

/**
 * Resolves a cover value that might still be a legacy bare storage path.
 *
 * `scripts/optimize-covers.mjs` rewrote every document to hold a full URL, so
 * this should never do network work in practice. It exists so a stray or
 * hand-edited row degrades gracefully instead of rendering a broken image.
 *
 * Do not call this from a render path — resolutions are memoised per session,
 * but the first one still costs a round trip.
 */
const resolutionCache = new Map<string, Promise<string | null>>()

export function resolveCoverUrl(coverUrl: string | null): Promise<string | null> {
  if (!coverUrl) return Promise.resolve(null)
  if (coverUrl.startsWith('http')) return Promise.resolve(coverUrl)

  const cached = resolutionCache.get(coverUrl)
  if (cached) return cached

  const path = coverUrl.includes('/') ? coverUrl : `${COVERS_PREFIX}/${coverUrl}`
  const pending = getDownloadURL(ref(storage, path)).catch((error) => {
    console.error(`Could not resolve cover "${coverUrl}":`, error)
    return null
  })

  resolutionCache.set(coverUrl, pending)
  return pending
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}
