import { db } from '../utils/firebase'
import { collection, query, where, orderBy, getDocs, limit, startAt, QueryConstraint } from 'firebase/firestore'
import { MediaItem } from '../types'
import { getSignedUrls } from './storage'

export interface SearchResult {
  id: string
  title: string
  year?: string
  cover_url?: string
  type: 'movie' | 'tv' | 'book'
}

export interface GetMediaItemsOptions {
  page: number
  limit: number
  filter?: {
    type?: 'movie' | 'tv' | 'book'
    sort?: 'date' | 'title' | 'rating'
    search?: string
    tags?: string[]
    status?: 'finished' | 'dropped' | 'all'
  }
}

export const getMediaItems = async ({ page, limit: pageLimit, filter }: GetMediaItemsOptions): Promise<MediaItem[]> => {
  const mediaRef = collection(db, 'media_items')
  let constraints: QueryConstraint[] = []

  if (filter?.type) {
    constraints.push(where('type', '==', filter.type))
  }

  if (filter?.status && filter.status !== 'all') {
    constraints.push(where('status', '==', filter.status))
  }

  if (filter?.tags && filter.tags.length > 0) {
    // Firestore supports array-contains-any for overlapping tags (max 10 elements)
    constraints.push(where('tags', 'array-contains-any', filter.tags.slice(0, 10)))
  }

  // Sorting
  if (filter?.sort === 'title') {
    constraints.push(orderBy('title', 'asc'))
  } else if (filter?.sort === 'rating') {
    constraints.push(orderBy('rating', 'desc'))
  } else {
    constraints.push(orderBy('created_at', 'desc'))
  }

  // We can't do native ilike substring search in Firestore easily. 
  // For simplicity, we'll fetch more data if there's a search, or just fetch and filter.
  // We'll apply the limit after client-side filtering if search is active.
  if (!filter?.search) {
      // Pagination offset approximation (Firestore requires cursors normally, 
      // but for simple offset, this is tricky. We'll fetch up to page * limit and slice)
      // A proper implementation would use startAfter with the last document.
      constraints.push(limit((page + 1) * pageLimit))
  }

  const q = query(mediaRef, ...constraints)
  const snapshot = await getDocs(q)
  
  let items: MediaItem[] = []
  snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() } as MediaItem)
  })

  // Client-side search filter
  if (filter?.search) {
      const searchLower = filter.search.toLowerCase()
      items = items.filter(item => item.title.toLowerCase().includes(searchLower))
  }

  // Client-side pagination (since we fetched up to page*limit or all if searching)
  const from = page * pageLimit
  items = items.slice(from, from + pageLimit)

  if (items.length === 0) {
    return []
  }

  // Resolve signed URLs
  const urlToPathMap: Record<string, string> = {}
  const pathsToSign: string[] = []

  items.forEach(item => {
      if (!item.cover_url) return

      if (!item.cover_url.startsWith('http')) {
          urlToPathMap[item.cover_url] = item.cover_url
          pathsToSign.push(item.cover_url)
      } else if (item.cover_url.includes('/covers/')) {
          const parts = item.cover_url.split('/covers/')
          if (parts.length > 1) {
              const path = parts[1] // "userId/filename"
              urlToPathMap[item.cover_url] = path
              pathsToSign.push(path)
          }
      }
  })

  if (pathsToSign.length > 0) {
      const signedUrls = await getSignedUrls(pathsToSign)
      
      return items.map(item => {
          if (item.cover_url) {
              const path = urlToPathMap[item.cover_url]
              if (path && signedUrls[path]) {
                  return { ...item, signed_url: signedUrls[path] }
              }
          }
          return item
      })
  } else {
      return items
  }
}

export const searchMedia = async (query: string, type: 'movie' | 'tv' | 'book'): Promise<SearchResult[]> => {
  if (!query) return []

  try {
    if (type === 'book') {
      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`)
      const data = await response.json()
      return data.docs.map((doc: any) => ({
        id: doc.key,
        title: doc.title,
        year: doc.first_publish_year?.toString(),
        cover_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
        type: 'book'
      }))
    } else {
      const entity = type === 'movie' ? 'movie' : 'tvSeason'
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=${type === 'movie' ? 'movie' : 'tvShow'}&entity=${entity}&limit=5`)
      const data = await response.json()
      return data.results.map((item: any) => ({
        id: item.trackId?.toString() || item.collectionId?.toString(),
        title: item.trackName || item.collectionName,
        year: (item.releaseDate || item.collectionPrice)?.substring(0, 4),
        cover_url: item.artworkUrl100?.replace('100x100', '600x600'),
        type: type
      }))
    }
  } catch (error) {
    console.error("Search failed", error)
    return []
  }
}
