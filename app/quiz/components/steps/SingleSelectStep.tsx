"use client"

import { useState } from "react"
import type { QuizStep } from "../../data/quiz-steps"
import { useQuiz } from "../../hooks/useQuiz"

interface SingleSelectStepProps {
  config: QuizStep
  onNext: () => void
}

export default function SingleSelectStep({ config, onNext }: SingleSelectStepProps) {
  const { quizData, updateQuizData } = useQuiz()
  const [selected, setSelected] = useState<string>(
    config.saveKey ? (quizData as Record<string, string>)[config.saveKey] || "" : ""
  )

  const handleSelect = (value: string) => {
    setSelected(value)
    if (config.saveKey) {
      updateQuizData({ [config.saveKey]: value } as Record<string, string>)
    }
    if (config.autoAdvance) {
      setTimeout(() => onNext(), 400)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1A1A1A]">{config.title}</h2>
        {config.subtitle && (
          <p className="text-base text-gray-600 mt-2">{config.subtitle}</p>
        )}
      </div>

      <div className="space-y-3">
        {config.options?.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
              selected === option.value
                ? "border-[#2563EB] bg-[#EFF6FF] shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              {option.icon && <span className="text-2xl">{option.icon}</span>}
              <span className="text-base font-medium text-[#1A1A1A]">{option.label}</span>
            </div>
          </button>
        ))}
      </div>

      {!config.autoAdvance && (
        <button
          onClick={onNext}
          disabled={!selected}
          className="w-full py-4 bg-[#2563EB] text-white font-bold text-base rounded-full hover:bg-[#1D4ED8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          CONTINUAR
        </button>
      )}
    </div>
  )
}
