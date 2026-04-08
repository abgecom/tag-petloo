"use client"

import { useCallback, useMemo } from "react"
import { useQuiz } from "../hooks/useQuiz"
import { quizSteps, totalQuestionSteps } from "../data/quiz-steps"
import QuizHeader from "./QuizHeader"
import QuizProgress from "./QuizProgress"
import QuizTransition from "./QuizTransition"
import TextInputStep from "./steps/TextInputStep"
import SingleSelectStep from "./steps/SingleSelectStep"
import InfoStep from "./steps/InfoStep"
import LoadingStep from "./steps/LoadingStep"
import ResultStep from "./steps/ResultStep"
import type { QuizStep } from "../data/quiz-steps"

export default function QuizEngine() {
  const { quizData, goToStep, goBack } = useQuiz()
  const currentIndex = quizData.currentStep
  const stepConfig = quizSteps[currentIndex]

  // Interpolar {{petName}} e {{tutorName}} nos textos
  const interpolate = useCallback(
    (step: QuizStep): QuizStep => {
      const pet = quizData.petName || "seu pet"
      const tutor = quizData.tutorName || "você"
      const replace = (text: string) =>
        text.replace(/\{\{petName\}\}/g, pet).replace(/\{\{tutorName\}\}/g, tutor)

      return {
        ...step,
        title: replace(step.title),
        subtitle: step.subtitle ? replace(step.subtitle) : step.subtitle,
        content: step.content?.map(replace),
      }
    },
    [quizData.petName, quizData.tutorName]
  )

  const interpolatedConfig = useMemo(() => interpolate(stepConfig), [stepConfig, interpolate])

  // Calcular progresso baseado apenas em steps que são perguntas
  const questionIndex = useMemo(() => {
    let count = 0
    for (let i = 0; i < currentIndex; i++) {
      if (quizSteps[i].isQuestion) count++
    }
    return count
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex < quizSteps.length - 1) {
      goToStep(currentIndex + 1)
    }
  }, [currentIndex, goToStep])

  const handleBack = useCallback(() => {
    if (currentIndex === 0) {
      // Voltar para welcome
      goToStep(-1) // O context vai para step -1, o page.tsx verifica
      return
    }
    goBack()
  }, [currentIndex, goBack, goToStep])

  const renderStep = () => {
    switch (interpolatedConfig.type) {
      case "text-input":
        return <TextInputStep config={interpolatedConfig} onNext={handleNext} />
      case "single-select":
        return <SingleSelectStep config={interpolatedConfig} onNext={handleNext} />
      case "info":
        return <InfoStep config={interpolatedConfig} onNext={handleNext} />
      case "loading":
        return <LoadingStep config={interpolatedConfig} onNext={handleNext} />
      case "result":
        return <ResultStep />
      default:
        return null
    }
  }

  // Não mostrar progress na tela de resultado
  const showProgress = stepConfig.type !== "result"

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <QuizHeader onBack={handleBack} showBack={stepConfig.type !== "result"} />
      {showProgress && <QuizProgress current={questionIndex} total={totalQuestionSteps} />}
      <div className="max-w-lg mx-auto px-4 py-8">
        <QuizTransition stepKey={stepConfig.id}>
          {renderStep()}
        </QuizTransition>
      </div>
    </div>
  )
}
