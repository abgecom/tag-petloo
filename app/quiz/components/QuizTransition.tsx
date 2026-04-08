"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { ReactNode } from "react"

interface QuizTransitionProps {
  stepKey: string
  children: ReactNode
}

export default function QuizTransition({ stepKey, children }: QuizTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
