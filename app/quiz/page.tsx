"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useQuiz } from "./hooks/useQuiz"
import { saveQuizStart } from "./utils/save-quiz-result"
import QuizEngine from "./components/QuizEngine"
import { MapPin, ArrowRight } from "lucide-react"

function QuizContent() {
  const searchParams = useSearchParams()
  const { quizData, updateQuizData } = useQuiz()

  useEffect(() => {
    if (quizData.sessionId) return
    const sessionId = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    updateQuizData({
      sessionId,
      utmSource: searchParams.get("utm_source") || "",
      utmMedium: searchParams.get("utm_medium") || "",
      utmCampaign: searchParams.get("utm_campaign") || "",
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (quizData.started) {
    return <QuizEngine />
  }

  const handleStart = () => {
    const startedAt = new Date().toISOString()
    updateQuizData({
      started: true,
      currentStep: 0,
      startedAt,
    })
    saveQuizStart({ ...quizData, started: true, startedAt })

    if (typeof window !== "undefined" && typeof (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq === "function") {
      ;(window as unknown as { fbq: (...args: unknown[]) => void }).fbq("track", "QuizStart", {
        content_name: "quiz-tagloo",
      })
    }
    if (typeof window !== "undefined") {
      ;((window as unknown as { dataLayer?: unknown[] }).dataLayer ||= []).push({
        event: "quiz_start",
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Hero com gradiente */}
      <div className="bg-gradient-to-b from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] text-white">
        <div className="max-w-lg mx-auto px-4 py-8 pb-12">
          {/* Logo pequeno */}
          <div className="flex justify-center mb-6">
            <img
              src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
              alt="Petloo"
              className="h-7 brightness-0 invert"
            />
          </div>

          {/* Ícone GPS pulsante */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
              <div className="relative w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/40">
                <MapPin className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Pré-título */}
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-white/80 mb-3">
            Teste gratuito de proteção pet • 2 minutos
          </p>

          {/* Título */}
          <h1 className="text-center text-3xl sm:text-4xl font-bold leading-tight mb-3">
            Descubra agora o nível de proteção do seu pet
          </h1>

          {/* Subtítulo */}
          <p className="text-center text-base text-white/90 leading-relaxed mb-6">
            Responda algumas perguntas rápidas e receba um diagnóstico personalizado com recomendações
            exclusivas para a segurança do seu melhor amigo.
          </p>
        </div>
      </div>

      {/* Estatísticas — cards */}
      <div className="max-w-lg mx-auto px-4 -mt-6 mb-6">
        <div className="grid grid-cols-3 gap-2">
          {[
            { number: "30M+", text: "animais em situação de rua no Brasil" },
            { number: "1 em 3", text: "pets foge de casa ao menos uma vez" },
            { number: "2.000+", text: "pets reencontrados com a Lootag" },
          ].map((stat) => (
            <div key={stat.number} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
              <p className="text-lg font-bold text-[#2563EB] leading-none">{stat.number}</p>
              <p className="text-[10px] text-gray-600 mt-1 leading-tight">{stat.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-lg mx-auto px-4 pb-8 space-y-3">
        <button
          onClick={handleStart}
          className="w-full py-4 bg-[#10B981] text-white font-bold text-lg rounded-full hover:bg-[#059669] transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 animate-pulse-slow"
        >
          COMEÇAR MEU DIAGNÓSTICO
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-xs text-gray-500 text-center">
          🔒 100% gratuito e confidencial • Resultado na hora
        </p>

        <p className="text-xs text-gray-400 text-center mt-4">
          Mais de 3.000 tutores já fizeram o teste
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F7F4]" />}>
      <QuizContent />
    </Suspense>
  )
}
