
import { supabase } from '../utils/supabase'
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
  }
}

export const getMediaItems = async ({ page, limit, filter }: GetMediaItemsOptions): Promise<MediaItem[]> => {
  const from = page * limit
  const to = from + limit - 1

  let query = supabase
    .from('media_items')
    .select('*')
    .range(from, to)

  if (filter?.type) {
    query = query.eq('type', filter.type)
  }

  if (filter?.search) {
     // rudimentary search
     query = query.ilike('title', `%${filter.search}%`)
  }

  // Sort handling
  if (filter?.sort === 'title') {
    query = query.order('title', { ascending: true })
  } else if (filter?.sort === 'rating') {
     // 'rating' in db is 'like' | 'dislike', might not sort well alphabetically. 
     // For now let's just stick to default or created_at if not specified.
     // If the user wants to sort by 'like'/'dislike', we can do that, but usually 'rating' means 1-5 stars.
     // Given the types, let's just order by rating column.
    query = query.order('rating', { ascending: false, nullsFirst: false })
  } else {
     // Default to date_finished or created_at
     // If date_finished is populated, use that, else created_at
     // Supabase sort doesn't easily do coalesce without a view or rpc. 
     // For now, let's default to created_at descending as per original code.
     query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  if (!data || data.length === 0) {
    return []
  }

  // Resolve signed URLs
  const urlToPathMap: Record<string, string> = {}
  const pathsToSign: string[] = []
  const items = data as MediaItem[]

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
      // Use iTunes API for Movies and TV Shows as a free no-key alternative
      const entity = type === 'movie' ? 'movie' : 'tvSeason'
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=${type === 'movie' ? 'movie' : 'tvShow'}&entity=${entity}&limit=5`)
      const data = await response.json()
      return data.results.map((item: any) => ({
        id: item.trackId?.toString() || item.collectionId?.toString(),
        title: item.trackName || item.collectionName,
        year: (item.releaseDate || item.collectionPrice)?.substring(0, 4),
        cover_url: item.artworkUrl100?.replace('100x100', '600x600'), // Get higher res image
        type: type
      }))
    }
  } catch (error) {
    console.error("Search failed", error)
    return []
  }
}
