
import { useMemo } from 'react'
import { useImagePreloader } from './useImagePreloader'
import { InfiniteData } from '@tanstack/react-query'
import { MediaItem } from '../types'

interface UseSmartPreloaderProps {
    data: InfiniteData<MediaItem[]> | undefined
    isLoading: boolean
}

export const useSmartPreloader = ({ data, isLoading }: UseSmartPreloaderProps) => {
     // 1. Initial images (Page 1) -> Block UI until loaded to prevent flash
    const initialImages = useMemo(() => {
        if (!data?.pages[0]) return []
        return data.pages[0]
            .map(item => item.signed_url || item.cover_url || '')
            .filter(url => !!url)
    }, [data?.pages])

    const { imagesPreloaded: initialImagesLoaded } = useImagePreloader(initialImages)

    // 2. All images -> Preload in background for smooth scrolling (don't block UI)
    const allImages = useMemo(() => {
        if (!data?.pages) return []
        return data.pages.flatMap(page => page)
            .map(item => item.signed_url || item.cover_url || '')
            .filter(url => !!url)
    }, [data?.pages])

    // Just call hook to trigger preloading side-effect (background)
    useImagePreloader(allImages)

    // Should we show the skeleton/loading state?
    // YES if React Query is hard loading (first fetch)
    // YES if we have data for page 1 but images aren't ready yet
    const shouldShowSkeleton = isLoading || (!initialImagesLoaded && initialImages.length > 0)

    return { shouldShowSkeleton }
}
