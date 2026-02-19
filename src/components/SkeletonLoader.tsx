

export const SkeletonCard = () => {
    return (
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-150%] animate-shimmer" />
        </div>
    )
}

interface SkeletonGridProps {
    count?: number
}

export const SkeletonGrid = ({ count = 20 }: SkeletonGridProps) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    )
}
