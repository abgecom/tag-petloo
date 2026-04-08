"use client"

import { createContext, useState, useCallback, type ReactNode } from "react"

export type QuizData = {
  tutorName: string
  petName: string
  petType: "cachorro" | "gato" | ""
  location: string
  alreadyLost: string
  petRoutine: string
  currentProtection: string
  biggestFear: string
  awareness: string
  riskScore: number
  currentStep: number
  started: boolean
  startedAt: string
  completedAt: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  sessionId: string
}

type QuizContextType = {
  quizData: QuizData
  updateQuizData: (partial: Partial<QuizData>) => void
  goToStep: (step: number) => void
  goBack: () => void
  resetQuiz: () => void
}

const initialData: QuizData = {
  tutorName: "",
  petName: "",
  petType: "",
  location: "",
  alreadyLost: "",
  petRoutine: "",
  currentProtection: "",
  biggestFear: "",
  awareness: "",
  riskScore: 0,
  currentStep: 0,
  started: false,
  startedAt: "",
  completedAt: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  sessionId: "",
}

export const QuizContext = createContext<QuizContextType>({
  quizData: initialData,
  updateQuizData: () => {},
  goToStep: () => {},
  goBack: () => {},
  resetQuiz: () => {},
})

export function QuizProvider({ children }: { children: ReactNode }) {
  const [quizData, setQuizData] = useState<QuizData>(() => {
    // Tentar restaurar do sessionStorage como fallback
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("quiz_tagloo_data")
      if (saved) {
        try {
          return { ...initialData, ...JSON.parse(saved) }
        } catch {}
      }
    }
    return initialData
  })

  const updateQuizData = useCallback((partial: Partial<QuizData>) => {
    setQuizData((prev) => {
      const updated = { ...prev, ...partial }
      // Backup no sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem("quiz_tagloo_data", JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const goToStep = useCallback((step: number) => {
    updateQuizData({ currentStep: step })
  }, [updateQuizData])

  const goBack = useCallback(() => {
    setQuizData((prev) => {
      const newStep = Math.max(0, prev.currentStep - 1)
      const updated = { ...prev, currentStep: newStep }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("quiz_tagloo_data", JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const resetQuiz = useCallback(() => {
    setQuizData(initialData)
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("quiz_tagloo_data")
    }
  }, [])

  return (
    <QuizContext.Provider value={{ quizData, updateQuizData, goToStep, goBack, resetQuiz }}>
      {children}
    </QuizContext.Provider>
  )
}
