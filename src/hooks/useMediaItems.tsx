
import { useInfiniteQuery } from '@tanstack/react-query'
import { getMediaItems } from '../services/api'
import { MediaItem } from '../types'

interface UseMediaItemsProps {
  filter?: {
    type?: 'movie' | 'tv' | 'book'
    sort?: 'date' | 'title' | 'rating'
    search?: string
  }
}

export const useMediaItems = ({ filter }: UseMediaItemsProps = {}) => {
  return useInfiniteQuery({
    queryKey: ['mediaItems', filter],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 20
      const items = await getMediaItems({
        page: pageParam,
        limit,
        filter
      })
      return items as MediaItem[]
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than the limit, we've reached the end
      if (lastPage.length < 20) {
        return undefined
      }
      return allPages.length
    },
    initialPageParam: 0,
    staleTime: Infinity, // Keep data fresh forever (until manual invalidation)
    gcTime: Infinity,   // Keep unused data in garbage collection forever
  })
}
