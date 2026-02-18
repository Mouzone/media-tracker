
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

interface MarqueeProps {
  text: string
  className?: string
  duration?: number
  delay?: number
}

export function Marquee({ text, className, duration = 10, delay = 1 }: MarqueeProps) {
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
    <div ref={containerRef} className={clsx("overflow-hidden flex mask-gradient", className)}>
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: "-50%" }}
        transition={{ 
            repeat: Infinity, 
            ease: "linear", 
            duration: duration || Math.max(text.length * 0.2, 5), // dynamic duration based on length if not provided
            delay: delay
        }}
      >
        <span className="mr-4">{text}</span>
        <span className="mr-4">{text}</span>
      </motion.div>
    </div>
  )
}
