
interface SearchResult {
  id: string
  title: string
  year?: string
  cover_url?: string
  type: 'movie' | 'tv' | 'book'
}

const searchMedia = async (query: string, type: 'movie' | 'tv' | 'book'): Promise<SearchResult[]> => {
  if (!query) return []

  try {
    if (type === 'book') {
      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`)
      const data = await response.json()
      // console.log("Book Data:", JSON.stringify(data.docs[0], null, 2))
      return data.docs.map((doc: any) => ({
        id: doc.key,
        title: doc.title,
        year: doc.first_publish_year?.toString(),
        cover_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
        type: 'book'
      }))
    } else {
      const entity = type === 'movie' ? 'movie' : 'tvSeason'
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=${type === 'movie' ? 'movie' : 'tvShow'}&entity=${entity}&limit=5`
      console.log(`Fetching: ${url}`)
      const response = await fetch(url)
      const data = await response.json()
      // console.log("Media Data:", JSON.stringify(data.results[0], null, 2))
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

async function runTests() {
    console.log("Testing Movie Search (Inception)...")
    const movies = await searchMedia("Inception", "movie")
    console.log(`Found ${movies.length} movies`)
    if(movies.length > 0) console.log(movies[0])

    console.log("\nTesting TV Search (Breaking Bad)...")
    const tv = await searchMedia("Breaking Bad", "tv")
    console.log(`Found ${tv.length} TV shows`)
    if(tv.length > 0) console.log(tv[0])

    console.log("\nTesting Book Search (Harry Potter)...")
    const books = await searchMedia("Harry Potter", "book")
    console.log(`Found ${books.length} books`)
    if(books.length > 0) console.log(books[0])
}

runTests()
