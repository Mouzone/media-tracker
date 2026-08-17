export type MediaType = 'movie' | 'tv' | 'book'

/**
 * Every status the app understands.
 *
 * Adding or removing a value here requires updating, in lockstep:
 *   - `STATUS_LABELS` below
 *   - the status `<select>` in `src/components/MediaModal.tsx`
 *   - the status `<select>` in `src/routes/_layout/bulk-upload.tsx`
 *   - `statusOptions` in `src/components/FilterBar.tsx`
 *
 * They previously drifted apart: the modal offered `backlog` and `in_progress`
 * while the type and the filter bar knew only `finished` and `dropped`, so items
 * saved with those statuses became unreachable in the UI.
 */
export type StatusType = 'backlog' | 'in_progress' | 'finished' | 'dropped'

export const STATUS_VALUES: StatusType[] = ['backlog', 'in_progress', 'finished', 'dropped']

export const STATUS_LABELS: Record<StatusType, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  finished: 'Finished',
  dropped: 'Dropped',
}

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  movie: 'Movies',
  tv: 'TV Series',
  book: 'Books',
}

export type Rating = 'like' | 'ok' | 'dislike'

/**
 * Ratings sort by this rank, never by their string value.
 *
 * Firestore's `orderBy('rating', 'desc')` sorted them lexicographically —
 * `ok` > `like` > `dislike` — and silently dropped every document missing the
 * field entirely. Sorting happens in memory now; see `src/data/selectors.ts`.
 */
export const RATING_RANK: Record<Rating, number> = { like: 3, ok: 2, dislike: 1 }

export interface MediaItem {
  id: string
  title: string
  type: MediaType
  status: StatusType
  seasons: number | null
  /**
   * Full, directly-usable Firebase Storage download URL.
   *
   * Legacy rows stored a bare storage path (e.g. `1770860313421.jpg`) which had
   * to be resolved with a `getDownloadURL()` call per image, per page — 20 network
   * round trips before a single cover could render. `scripts/optimize-covers.mjs`
   * rewrote these to full URLs. `resolveCoverUrl()` in `src/services/storage.ts`
   * still handles stragglers, but nothing in a render path should depend on it.
   */
  cover_url: string | null
  /** Storage path of the cover, kept so covers can be re-processed later. */
  cover_path?: string | null
  date_finished: string | null
  review: string | null
  tags: string[]
  rating: Rating | null
  created_at: string
}

/** Shape written to Firestore — everything except the document id. */
export type MediaItemData = Omit<MediaItem, 'id'>
