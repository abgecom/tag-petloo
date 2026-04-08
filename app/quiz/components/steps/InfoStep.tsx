"use client"

import type { QuizStep } from "../../data/quiz-steps"

interface InfoStepProps {
  config: QuizStep
  onNext: () => void
}

function renderBoldText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-bold">{part}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

export default function InfoStep({ config, onNext }: InfoStepProps) {
  const isWarning = config.variant === "warning"

  return (
    <div className="space-y-6">
      <div className={`text-center p-6 rounded-2xl ${isWarning ? "bg-red-50" : "bg-green-50"}`}>
        <h2 className={`text-2xl font-bold mb-4 ${isWarning ? "text-red-800" : "text-green-800"}`}>
          {isWarning ? "⚠️ " : "✅ "}{config.title}
        </h2>

        <div className="space-y-4">
          {config.content?.map((paragraph, i) => (
            <p
              key={i}
              className={`text-base leading-relaxed ${isWarning ? "text-red-900/80" : "text-green-900/80"}`}
            >
              {renderBoldText(paragraph)}
            </p>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        className={`w-full py-4 text-white font-bold text-base rounded-full transition-colors ${
          isWarning
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {config.buttonText || "CONTINUAR"}
      </button>
    </div>
  )
}
