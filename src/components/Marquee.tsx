import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'

interface MarqueeProps {
  text: string
  className?: string
  duration?: number
  delay?: number
  isHovered?: boolean
}

export function Marquee({ text, className, duration, delay = 0 }: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth)
      }
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [text])

  if (!isOverflowing) {
    return (
      <div ref={containerRef} className={clsx("truncate", className)}>
        <span ref={textRef}>{text}</span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={clsx("overflow-hidden flex mask-gradient group/marquee", className)}>
      <div
        className="flex whitespace-nowrap animate-marquee [animation-play-state:paused] group-hover:[animation-play-state:running] group-hover/marquee:[animation-play-state:running]"
        style={{ 
          '--marquee-duration': `${duration || Math.max(text.length * 0.2, 5)}s`,
          animationDelay: `${delay}s`
        } as React.CSSProperties}
      >
        <span className="mr-4">{text}</span>
        <span className="mr-4">{text}</span>
      </div>
    </div>
  )
}
