"use client"

import { useCallback, useMemo } from "react"
import { useQuiz } from "../hooks/useQuiz"
import { quizSteps, totalQuestionSteps } from "../data/quiz-steps"
import QuizHeader from "./QuizHeader"
import QuizProgress from "./QuizProgress"
import QuizTransition from "./QuizTransition"
import TextInputStep from "./steps/TextInputStep"
import SingleSelectStep from "./steps/SingleSelectStep"
import MultiSelectStep from "./steps/MultiSelectStep"
import ColorSelectStep from "./steps/ColorSelectStep"
import InfoStep from "./steps/InfoStep"
import LoadingStep from "./steps/LoadingStep"
import ResultStep from "./steps/ResultStep"
import type { QuizStep } from "../data/quiz-steps"

export default function QuizEngine() {
  const { quizData, goToStep, goBack } = useQuiz()
  const currentIndex = quizData.currentStep
  const stepConfig = quizSteps[currentIndex]

  // Interpolar variáveis dinâmicas em qualquer texto
  const interpolate = useCallback(
    (step: QuizStep): QuizStep => {
      const vars: Record<string, string> = {
        petName: quizData.petName || "seu pet",
        tutorName: quizData.tutorName || "você",
        petType: quizData.petType || "pet",
        petGender: quizData.petGender || "",
        petSize: quizData.petSize || "",
        location: quizData.location || "",
        tagColor: quizData.tagColor || "",
      }
      const replace = (text: string) =>
        text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "")

      return {
        ...step,
        title: replace(step.title),
        subtitle: step.subtitle ? replace(step.subtitle) : step.subtitle,
        content: step.content?.map(replace),
        highlight: step.highlight ? replace(step.highlight) : step.highlight,
        buttonText: step.buttonText ? replace(step.buttonText) : step.buttonText,
        nextStepTeaser: step.nextStepTeaser ? replace(step.nextStepTeaser) : step.nextStepTeaser,
        steps: step.steps?.map((s) => ({ ...s, text: replace(s.text) })),
      }
    },
    [quizData]
  )

  const interpolatedConfig = useMemo(() => interpolate(stepConfig), [stepConfig, interpolate])

  // Calcular progresso baseado em steps que são perguntas
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
      goToStep(-1)
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
      case "multi-select":
        return <MultiSelectStep config={interpolatedConfig} onNext={handleNext} />
      case "color-select":
        return <ColorSelectStep config={interpolatedConfig} onNext={handleNext} />
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

  const isResult = stepConfig.type === "result"
  const isLoading = stepConfig.type === "loading"

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <QuizHeader onBack={handleBack} showBack={!isResult && !isLoading} />
      {!isResult && <QuizProgress current={questionIndex} total={totalQuestionSteps} />}
      <div className="max-w-lg mx-auto px-4 py-8">
        <QuizTransition stepKey={stepConfig.id}>
          {renderStep()}
          {interpolatedConfig.nextStepTeaser && !isResult && !isLoading && (
            <p className="text-xs text-gray-400 text-center mt-4 italic">
              {interpolatedConfig.nextStepTeaser}
            </p>
          )}
        </QuizTransition>
      </div>
    </div>
  )
}
