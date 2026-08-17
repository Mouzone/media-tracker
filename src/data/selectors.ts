import { useMemo } from 'react'
import { RATING_RANK } from '../types'
import type { MediaItem, MediaType, StatusType } from '../types'

export type SortOption = 'date_added' | 'date_finished' | 'title' | 'rating'
export type StatusFilter = StatusType | 'all'

export interface LibraryFilter {
  type: MediaType | null
  status: StatusFilter
  /** An item must carry *every* selected tag to match. */
  tags: string[]
  search: string
  sort: SortOption
}

export const DEFAULT_FILTER: LibraryFilter = {
  type: null,
  status: 'all',
  tags: [],
  search: '',
  sort: 'date_added',
}

export function isDefaultFilter(filter: LibraryFilter): boolean {
  return (
    filter.type === null &&
    filter.status === 'all' &&
    filter.tags.length === 0 &&
    filter.search.trim() === '' &&
    filter.sort === DEFAULT_FILTER.sort
  )
}

/** Case-insensitive match against title and tags. */
function matchesSearch(item: MediaItem, needle: string): boolean {
  if (item.title.toLowerCase().includes(needle)) return true
  return item.tags.some((tag) => tag.toLowerCase().includes(needle))
}

export function filterMedia(items: MediaItem[], filter: LibraryFilter): MediaItem[] {
  const needle = filter.search.trim().toLowerCase()

  return items.filter((item) => {
    if (filter.type && item.type !== filter.type) return false
    if (filter.status !== 'all' && item.status !== filter.status) return false
    if (filter.tags.length > 0 && !filter.tags.every((tag) => item.tags.includes(tag))) return false
    if (needle && !matchesSearch(item, needle)) return false
    return true
  })
}

/**
 * Sorts in memory so that items missing a field still appear — Firestore's
 * `orderBy` drops those documents entirely, which is how unrated items used to
 * vanish whenever you sorted by rating.
 *
 * Empty values always sort last regardless of direction, so a missing date or
 * rating never pushes an item to the top of the list.
 */
export function sortMedia(items: MediaItem[], sort: SortOption): MediaItem[] {
  const sorted = [...items]

  switch (sort) {
    case 'title':
      return sorted.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true }),
      )

    case 'rating':
      return sorted.sort((a, b) => {
        const rank = (b.rating ? RATING_RANK[b.rating] : 0) - (a.rating ? RATING_RANK[a.rating] : 0)
        return rank !== 0 ? rank : b.created_at.localeCompare(a.created_at)
      })

    case 'date_finished':
      return sorted.sort((a, b) => {
        if (!a.date_finished && !b.date_finished) return b.created_at.localeCompare(a.created_at)
        if (!a.date_finished) return 1
        if (!b.date_finished) return -1
        return b.date_finished.localeCompare(a.date_finished)
      })

    case 'date_added':
    default:
      return sorted.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
}

/** Every distinct tag in the library, alphabetised. */
export function collectTags(items: MediaItem[]): string[] {
  const tags = new Set<string>()
  for (const item of items) {
    for (const tag of item.tags) tags.add(tag)
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b))
}

/**
 * Applies a filter to the in-memory library.
 *
 * Cheap enough to run on every keystroke at this library size — there is no
 * network involved, which is why search no longer needs debouncing.
 */
export function useFilteredMedia(items: MediaItem[], filter: LibraryFilter): MediaItem[] {
  return useMemo(() => sortMedia(filterMedia(items, filter), filter.sort), [items, filter])
}

/** Tag list for the filter bar and the modal's autocomplete. */
export function useAllTags(items: MediaItem[]): string[] {
  return useMemo(() => collectTags(items), [items])
}
