/**
 * Client-side cover processing.
 *
 * Covers render at roughly 180–260 px wide in the grid, but the library had
 * accumulated originals averaging 552 KB — with a 90th percentile of 2 MB and a
 * worst case of 10.7 MB. Downloading those to fill a thumbnail was the single
 * largest cost in the app.
 *
 * Every cover is now normalised to the same budget before it is uploaded, which
 * keeps a full grid page around 1 MB instead of 10–40 MB. `scripts/optimize-covers.mjs`
 * applies the identical transform to the images that were already stored.
 */

/** Covers are stored at most this large; 2:3 is the standard poster ratio. */
export const COVER_WIDTH = 600
export const COVER_HEIGHT = 900
export const COVER_ASPECT = 2 / 3
export const COVER_QUALITY = 0.82

/** Guard against decoding something absurd; applied before any image work. */
const MAX_SOURCE_BYTES = 25 * 1024 * 1024

export interface ProcessedCover {
  blob: Blob
  extension: string
  /** Size of the file the user picked, for reporting the saving. */
  originalBytes: number
}

export class CoverProcessingError extends Error {}

/**
 * Resizes and compresses a user-selected image into a 2:3 WebP cover.
 *
 * Images that aren't already 2:3 are centre-cropped to fit rather than rejected.
 * The previous implementation refused anything outside a 0.05 tolerance of 2:3
 * and anything under 300×450, which meant perfectly good artwork was simply
 * turned away.
 */
export async function processCoverImage(file: File): Promise<ProcessedCover> {
  if (!file.type.startsWith('image/')) {
    throw new CoverProcessingError('That file is not an image.')
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new CoverProcessingError('Image must be smaller than 25 MB.')
  }

  const bitmap = await decode(file)

  try {
    // Centre-crop the source to 2:3 before scaling, so nothing is squashed.
    const sourceAspect = bitmap.width / bitmap.height
    let sx = 0
    let sy = 0
    let sw = bitmap.width
    let sh = bitmap.height

    if (sourceAspect > COVER_ASPECT) {
      sw = Math.round(bitmap.height * COVER_ASPECT)
      sx = Math.round((bitmap.width - sw) / 2)
    } else if (sourceAspect < COVER_ASPECT) {
      sh = Math.round(bitmap.width / COVER_ASPECT)
      sy = Math.round((bitmap.height - sh) / 2)
    }

    // Never upscale: a small source stays small rather than being blown up.
    const scale = Math.min(1, COVER_WIDTH / sw, COVER_HEIGHT / sh)
    const width = Math.max(1, Math.round(sw * scale))
    const height = Math.max(1, Math.round(sh * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new CoverProcessingError('Could not process the image in this browser.')

    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height)

    const { blob, extension } = await encode(canvas)
    return { blob, extension, originalBytes: file.size }
  } finally {
    bitmap.close()
  }
}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file)
  } catch {
    throw new CoverProcessingError('That image could not be read. Try a different file.')
  }
}

async function encode(canvas: HTMLCanvasElement): Promise<{ blob: Blob; extension: string }> {
  const webp = await toBlob(canvas, 'image/webp', COVER_QUALITY)
  if (webp) return { blob: webp, extension: 'webp' }

  // Safari <14 and a few older engines can't encode WebP.
  const jpeg = await toBlob(canvas, 'image/jpeg', COVER_QUALITY)
  if (jpeg) return { blob: jpeg, extension: 'jpg' }

  throw new CoverProcessingError('Could not compress the image.')
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob && blob.type === type ? blob : null),
      type,
      quality,
    )
  })
}
