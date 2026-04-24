"use client"

import { useState } from "react"
import type { QuizStep } from "../../data/quiz-steps"
import { useQuiz } from "../../hooks/useQuiz"

interface TextInputStepProps {
  config: QuizStep
  onNext: () => void
}

export default function TextInputStep({ config, onNext }: TextInputStepProps) {
  const { quizData, updateQuizData } = useQuiz()
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    config.fields?.forEach((f) => {
      initial[f.key] = ((quizData as unknown as Record<string, string>)[f.key] as string) || ""
    })
    return initial
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {}
    config.fields?.forEach((field) => {
      if (field.required && !values[field.key]?.trim()) {
        newErrors[field.key] = field.errorMessage
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    updateQuizData(values as unknown as Record<string, string>)
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1A1A1A]">{config.title}</h2>
        {config.subtitle && (
          <p className="text-base text-gray-600 mt-2">{config.subtitle}</p>
        )}
      </div>

      <div className="space-y-4">
        {config.fields?.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="text"
              value={values[field.key] || ""}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                setErrors((prev) => ({ ...prev, [field.key]: "" }))
              }}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#F1542E] focus:outline-none text-base transition-colors"
              maxLength={40}
            />
            {errors[field.key] && (
              <p className="text-red-500 text-sm mt-1">{errors[field.key]}</p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full py-4 bg-[#F1542E] text-white font-bold text-base rounded-full hover:bg-[#D93D17] transition-colors"
      >
        {config.buttonText || "CONTINUAR"}
      </button>
    </div>
  )
}
