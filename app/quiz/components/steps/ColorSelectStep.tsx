"use client"

import { useState } from "react"
import type { QuizStep } from "../../data/quiz-steps"
import { useQuiz } from "../../hooks/useQuiz"
import { Check } from "lucide-react"

interface ColorSelectStepProps {
  config: QuizStep
  onNext: () => void
}

export default function ColorSelectStep({ config, onNext }: ColorSelectStepProps) {
  const { quizData, updateQuizData } = useQuiz()
  const [selected, setSelected] = useState<string>(
    config.saveKey ? ((quizData as unknown as Record<string, string>)[config.saveKey] as string) || "" : ""
  )

  const handleSelect = (value: string) => {
    setSelected(value)
    if (config.saveKey) {
      updateQuizData({ [config.saveKey]: value } as unknown as Record<string, string>)
    }
    if (config.autoAdvance) {
      setTimeout(() => onNext(), 500)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1A1A1A]">{config.title}</h2>
        {config.subtitle && <p className="text-base text-gray-600 mt-2">{config.subtitle}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {config.options?.map((option) => {
          const isSelected = selected === option.value
          const color = option.color || "#6B7280"
          return (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`relative rounded-2xl p-5 border-2 transition-all duration-200 bg-white ${
                isSelected
                  ? "border-[#F1542E] shadow-lg scale-[1.02]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={isSelected ? { boxShadow: `0 0 0 3px ${color}33` } : undefined}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#F1542E] flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                {/* Círculo grande com a cor */}
                <div
                  className="w-20 h-20 rounded-full shadow-inner"
                  style={{
                    backgroundColor: color,
                    boxShadow: `inset 0 2px 8px rgba(0,0,0,0.15), 0 4px 12px ${color}55`,
                  }}
                />
                <div className="text-center">
                  <p className="text-base font-bold text-[#1A1A1A]">{option.label}</p>
                  {option.description && (
                    <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {!config.autoAdvance && (
        <button
          onClick={onNext}
          disabled={!selected}
          className="w-full py-4 bg-[#F1542E] text-white font-bold text-base rounded-full hover:bg-[#D93D17] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          CONTINUAR →
        </button>
      )}
    </div>
  )
}
