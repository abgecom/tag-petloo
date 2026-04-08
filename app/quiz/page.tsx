"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useQuiz } from "./hooks/useQuiz"
import { saveQuizStart } from "./utils/save-quiz-result"
import QuizEngine from "./components/QuizEngine"

export default function QuizPage() {
  const searchParams = useSearchParams()
  const { quizData, updateQuizData } = useQuiz()

  // Capturar UTM params na entrada
  useEffect(() => {
    if (quizData.sessionId) return // Já inicializado
    const sessionId = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    updateQuizData({
      sessionId,
      utmSource: searchParams.get("utm_source") || "",
      utmMedium: searchParams.get("utm_medium") || "",
      utmCampaign: searchParams.get("utm_campaign") || "",
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Se o quiz já foi iniciado (step >= 0 e started), mostrar o engine
  if (quizData.started) {
    return <QuizEngine />
  }

  // Welcome screen
  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-center">
          <img
            src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
            alt="Petloo"
            className="h-7"
          />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Hero image */}
        <div className="rounded-2xl overflow-hidden mb-8">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_sp1jwfsp1jwfsp1j.png-mWfJvbDukdwhtbQveewIYC6X8CzGRW.jpeg"
            alt="Pet com coleira e tag de rastreamento"
            className="w-full h-auto object-cover rounded-2xl"
          />
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-[#1A1A1A] leading-tight">
            Seu pet está realmente protegido?
          </h1>

          <p className="text-base text-gray-600 leading-relaxed">
            Responda 7 perguntas rápidas e descubra o nível de proteção do seu melhor amigo.
            Leva menos de 2 minutos.
          </p>

          <p className="text-sm text-gray-500">
            Mais de 3.000 tutores já fizeram o teste e descobriram como proteger seus pets de verdade.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-8 space-y-3">
          <button
            onClick={() => {
              const startedAt = new Date().toISOString()
              updateQuizData({
                started: true,
                currentStep: 0,
                startedAt,
              })
              // Salvar início no Supabase
              saveQuizStart({
                ...quizData,
                started: true,
                startedAt,
              })
            }}
            className="w-full py-4 bg-[#2563EB] text-white font-bold text-lg rounded-full hover:bg-[#1D4ED8] transition-colors shadow-lg shadow-blue-200"
          >
            COMEÇAR O TESTE GRÁTIS
          </button>

          <p className="text-xs text-gray-400 text-center">
            🔒 Suas respostas são 100% confidenciais
          </p>
        </div>
      </div>
    </div>
  )
}
