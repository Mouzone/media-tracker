import type { DocumentData } from 'firebase/firestore'
import type { MediaItem, MediaType, Rating, StatusType } from '../types'
import { STATUS_VALUES } from '../types'

const MEDIA_TYPES: MediaType[] = ['movie', 'tv', 'book']
const RATINGS: Rating[] = ['like', 'ok', 'dislike']

/**
 * Coerces a raw Firestore document into a fully-populated `MediaItem`.
 *
 * The collection accumulated inconsistencies over time: documents missing
 * `status`, `tags` stored as `null` rather than `[]`, statuses the UI no longer
 * offers. Normalizing once at the boundary means every component downstream can
 * assume the fields exist and are valid, instead of defending against it.
 */
export function normalizeMediaDoc(id: string, data: DocumentData): MediaItem {
  return {
    id,
    title: typeof data.title === 'string' ? data.title : 'Untitled',
    type: MEDIA_TYPES.includes(data.type) ? data.type : 'movie',
    status: STATUS_VALUES.includes(data.status) ? data.status : 'finished',
    seasons: typeof data.seasons === 'number' ? data.seasons : null,
    cover_url: typeof data.cover_url === 'string' && data.cover_url ? data.cover_url : null,
    cover_path: typeof data.cover_path === 'string' && data.cover_path ? data.cover_path : null,
    date_finished: typeof data.date_finished === 'string' ? data.date_finished : null,
    review: typeof data.review === 'string' ? data.review : null,
    tags: Array.isArray(data.tags) ? data.tags.filter((t): t is string => typeof t === 'string') : [],
    rating: RATINGS.includes(data.rating) ? data.rating : null,
    created_at: typeof data.created_at === 'string' ? data.created_at : '',
  }
}

/** Convenience for the many places that need a valid status from untrusted input. */
export function coerceStatus(value: unknown): StatusType {
  return STATUS_VALUES.includes(value as StatusType) ? (value as StatusType) : 'finished'
}
