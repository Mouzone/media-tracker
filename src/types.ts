export type MediaType = 'movie' | 'tv' | 'book'

export interface MediaItem {
  id: string
  user_id: string
  title: string
  type: MediaType
  cover_url: string | null
  date_finished: string | null
  review: string | null
  tags: string[]
  rating: number | null
  created_at: string
}

export interface MediaItemInsert {
    title: string
    type: MediaType
    cover_url?: string
    date_finished?: string | Date
    review?: string
    tags?: string[]
    rating?: number
}
