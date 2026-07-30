

export const SkeletonCard = () => {
    return (
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent -translate-x-full animate-shimmer" />
            <div className="absolute inset-0 flex items-center justify-center opacity-20 dark:opacity-10">
                 <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
            </div>
        </div>
    )
}

interface SkeletonGridProps {
    count?: number
}

export const SkeletonGrid = ({ count = 20 }: SkeletonGridProps) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-4 lg:gap-5">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    )
}
