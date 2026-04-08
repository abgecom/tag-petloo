"use client"

import { useState, useEffect } from "react"
import type { QuizStep } from "../../data/quiz-steps"

interface LoadingStepProps {
  config: QuizStep
  onNext: () => void
}

export default function LoadingStep({ config, onNext }: LoadingStepProps) {
  const [currentSubStep, setCurrentSubStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const subSteps = config.steps || []
  const totalDuration = config.totalDuration || 5000

  useEffect(() => {
    // Animar a barra de progresso
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 1
      })
    }, totalDuration / 100)

    return () => clearInterval(interval)
  }, [totalDuration])

  useEffect(() => {
    // Avançar sub-steps
    let elapsed = 0
    const timers: NodeJS.Timeout[] = []

    subSteps.forEach((step, i) => {
      elapsed += step.duration
      const timer = setTimeout(() => {
        setCurrentSubStep(i + 1)
      }, elapsed)
      timers.push(timer)
    })

    // Auto-avançar ao final
    const finalTimer = setTimeout(() => {
      onNext()
    }, totalDuration + 500)
    timers.push(finalTimer)

    return () => timers.forEach(clearTimeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8 text-center py-8">
      <h2 className="text-2xl font-bold text-[#1A1A1A]">{config.title}</h2>

      {/* Circular progress */}
      <div className="flex justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#E5E7EB" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#2563EB"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
              className="transition-all duration-100"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-[#2563EB]">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Sub-steps text */}
      <div className="space-y-2">
        {subSteps.map((step, i) => (
          <p
            key={i}
            className={`text-sm transition-all duration-300 ${
              i < currentSubStep
                ? "text-green-600"
                : i === currentSubStep
                  ? "text-[#1A1A1A] font-medium"
                  : "text-gray-300"
            }`}
          >
            {i < currentSubStep ? "✅ " : i === currentSubStep ? "⏳ " : "○ "}
            {step.text}
          </p>
        ))}
      </div>
    </div>
  )
}
