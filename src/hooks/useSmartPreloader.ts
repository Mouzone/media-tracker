import { InfiniteData } from '@tanstack/react-query'
import { MediaItem } from '../types'

interface UseSmartPreloaderProps {
    data: InfiniteData<MediaItem[], unknown> | undefined
    isLoading: boolean
}

export const useSmartPreloader = ({ isLoading }: UseSmartPreloaderProps) => {
    // We intentionally removed the image preloading block here because it caused massive
    // performance issues on the initial load. By returning just isLoading, the UI handles 
    // the layout immediately, and the MediaCards manage their own individual image loading skeletons gracefully.

    const shouldShowSkeleton = isLoading

    return { shouldShowSkeleton }
}
