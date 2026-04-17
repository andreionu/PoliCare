"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"

interface AnimatedCounterProps {
  value: number
  suffix?: string
  duration?: number
}

export function AnimatedCounter({ value, suffix = "", duration = 2 }: AnimatedCounterProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const controls = animate(count, value, { 
      duration, 
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest))
      }
    })
    return controls.stop
  }, [value, duration, count])

  return (
    <motion.span>
      {displayValue}{suffix}
    </motion.span>
  )
}
