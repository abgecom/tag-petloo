"use client"

import { useState } from "react"
import type { QuizStep } from "../../data/quiz-steps"
import { useQuiz } from "../../hooks/useQuiz"
import { Check } from "lucide-react"

interface MultiSelectStepProps {
  config: QuizStep
  onNext: () => void
}

export default function MultiSelectStep({ config, onNext }: MultiSelectStepProps) {
  const { quizData, updateQuizData } = useQuiz()
  const [selected, setSelected] = useState<string[]>(() => {
    if (!config.saveKey) return []
    const existing = (quizData as unknown as Record<string, unknown>)[config.saveKey]
    return Array.isArray(existing) ? (existing as string[]) : []
  })

  const minSelections = config.minSelections ?? 1
  const maxSelections = config.maxSelections ?? config.options?.length ?? 99

  const toggle = (value: string) => {
    setSelected((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value)
      }
      if (prev.length >= maxSelections) return prev
      return [...prev, value]
    })
  }

  const handleSubmit = () => {
    if (selected.length < minSelections) return
    if (config.saveKey) {
      updateQuizData({ [config.saveKey]: selected } as unknown as Record<string, unknown>)
    }
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1A1A1A]">{config.title}</h2>
        {config.subtitle && <p className="text-base text-gray-600 mt-2">{config.subtitle}</p>}
      </div>

      <div className="space-y-3">
        {config.options?.map((option) => {
          const isSelected = selected.includes(option.value)
          return (
            <button
              key={option.value}
              onClick={() => toggle(option.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? "border-[#2563EB] bg-[#EFF6FF] shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                    isSelected ? "bg-[#2563EB] border-[#2563EB]" : "border-gray-300"
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </div>
                {option.icon && <span className="text-2xl">{option.icon}</span>}
                <span className="text-base font-medium text-[#1A1A1A] flex-1">{option.label}</span>
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={handleSubmit}
        disabled={selected.length < minSelections}
        className="w-full py-4 bg-[#2563EB] text-white font-bold text-base rounded-full hover:bg-[#1D4ED8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {config.buttonText || "CONTINUAR →"}
      </button>

      {selected.length < minSelections && (
        <p className="text-xs text-gray-500 text-center">
          Selecione ao menos {minSelections} {minSelections === 1 ? "opção" : "opções"} para continuar
        </p>
      )}
    </div>
  )
}
