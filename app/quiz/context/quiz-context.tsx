"use client"

import { createContext, useState, useCallback, type ReactNode } from "react"

export type QuizData = {
  // Situacional
  tutorName: string
  petName: string
  petType: "cachorro" | "gato" | ""
  petGender: "macho" | "femea" | ""
  petSize: "pequeno" | "medio" | "grande" | ""
  location: string

  // Problema
  petRoutine: string
  alreadyLost: string
  riskSituations: string[]
  currentProtection: string
  biggestFear: string
  timeToNotice: string

  // Desejo
  desiredFeeling: string
  wouldInvest: string
  priorities: string[]

  // Mecanismo
  awareness: string

  // Personalização
  tagColor: "laranja" | "roxo" | ""

  // Cálculos
  riskScore: number
  riskLevel: "moderate" | "low" | "critical" | ""

  // Controle
  currentStep: number
  started: boolean
  startedAt: string
  completedAt: string

  // UTM + sessão
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
  petGender: "",
  petSize: "",
  location: "",
  petRoutine: "",
  alreadyLost: "",
  riskSituations: [],
  currentProtection: "",
  biggestFear: "",
  timeToNotice: "",
  desiredFeeling: "",
  wouldInvest: "",
  priorities: [],
  awareness: "",
  tagColor: "",
  riskScore: 0,
  riskLevel: "",
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
      if (typeof window !== "undefined") {
        sessionStorage.setItem("quiz_tagloo_data", JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const goToStep = useCallback(
    (step: number) => {
      updateQuizData({ currentStep: step })
      // Registrar progresso no Supabase (fire-and-forget, não bloqueia UX)
      if (typeof window !== "undefined" && step >= 0) {
        // Import dinâmico para evitar ciclo — usa fetch direto
        import("../data/quiz-steps").then(({ quizSteps }) => {
          const stepConfig = quizSteps[step]
          if (!stepConfig) return
          setQuizData((prev) => {
            if (!prev.sessionId) return prev
            fetch("/api/quiz-result", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "progress",
                session_id: prev.sessionId,
                last_step_id: stepConfig.id,
                last_step_index: step,
              }),
            }).catch(() => {})
            return prev
          })
        })
      }
    },
    [updateQuizData]
  )

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
