export interface SearchResult {
  id: string
  title: string
  year?: string
  cover_url?: string
  type: 'movie' | 'tv' | 'book'
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
