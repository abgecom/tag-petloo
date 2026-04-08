"use client"

import { useContext } from "react"
import { QuizContext } from "../context/quiz-context"

export function useQuiz() {
  const context = useContext(QuizContext)
  if (!context) {
    throw new Error("useQuiz must be used within a QuizProvider")
  }
  return context
}
