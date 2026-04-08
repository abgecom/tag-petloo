"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useQuiz } from "../../hooks/useQuiz"
import { calculateRiskScore } from "../../utils/calculate-risk-score"
import { saveQuizComplete } from "../../utils/save-quiz-result"
import { Check, Shield, MapPin, Smartphone } from "lucide-react"

export default function ResultStep() {
  const router = useRouter()
  const { quizData, updateQuizData } = useQuiz()
  const hasSaved = useRef(false)
  const [timeLeft, setTimeLeft] = useState(10 * 60)

  const result = calculateRiskScore({
    location: quizData.location,
    alreadyLost: quizData.alreadyLost,
    petRoutine: quizData.petRoutine,
    currentProtection: quizData.currentProtection,
  })

  const petName = quizData.petName || "seu pet"
  const tutorName = quizData.tutorName || "Tutor"

  // Salvar resultado no Supabase
  useEffect(() => {
    if (hasSaved.current) return
    hasSaved.current = true

    updateQuizData({
      riskScore: result.score,
      completedAt: new Date().toISOString(),
    })

    saveQuizComplete({
      ...quizData,
      riskScore: result.score,
      completedAt: new Date().toISOString(),
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const levelConfig = {
    moderate: {
      label: "MODERADO",
      title: `${tutorName}, o ${petName} tem um nível de proteção MODERADO`,
      text: `Apesar de alguns cuidados, ainda existem pontos vulneráveis que podem colocar o ${petName} em risco.`,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-800",
      borderColor: "border-yellow-400",
      gaugeColor: "#EAB308",
    },
    low: {
      label: "BAIXO",
      title: `${tutorName}, o ${petName} precisa de MAIS PROTEÇÃO`,
      text: `Com base nas suas respostas, identificamos que o ${petName} está exposto a riscos que poderiam ser evitados com uma solução simples.`,
      bgColor: "bg-orange-50",
      textColor: "text-orange-800",
      borderColor: "border-orange-400",
      gaugeColor: "#F97316",
    },
    critical: {
      label: "CRÍTICO",
      title: `${tutorName}, o ${petName} está em situação CRÍTICA de proteção`,
      text: `As suas respostas indicam que o ${petName} está muito vulnerável. Sem rastreamento, em caso de fuga, as chances de reencontro são muito baixas.`,
      bgColor: "bg-red-50",
      textColor: "text-red-800",
      borderColor: "border-red-400",
      gaugeColor: "#EF4444",
    },
  }

  const config = levelConfig[result.level]

  const handleCTA = () => {
    const params = new URLSearchParams({
      petName: quizData.petName,
      tutorName: quizData.tutorName,
      petType: quizData.petType,
    })
    router.push(`/v3?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Score gauge */}
      <div className={`text-center p-6 rounded-2xl ${config.bgColor} border-2 ${config.borderColor}`}>
        <div className="flex justify-center mb-4">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#E5E7EB" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={config.gaugeColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - result.percentage / 100)}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500">Risco</span>
              <span className={`text-lg font-bold ${config.textColor}`}>{config.label}</span>
            </div>
          </div>
        </div>

        <h2 className={`text-xl font-bold ${config.textColor} mb-2`}>{config.title}</h2>
        <p className={`text-sm ${config.textColor} opacity-80`}>{config.text}</p>
      </div>

      {/* Recomendações */}
      <div className="space-y-3">
        <h3 className="font-bold text-[#1A1A1A]">Recomendação para o {petName}:</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
            <MapPin className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
            <span className="text-sm text-gray-700">Rastreamento em tempo real via GPS</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
            <Smartphone className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
            <span className="text-sm text-gray-700">Identificação digital com QR Code + NFC</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
            <Shield className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
            <span className="text-sm text-gray-700">RG digital + cartão de vacinas no app</span>
          </div>
        </div>
      </div>

      {/* Oferta */}
      <div className="bg-white rounded-2xl border-2 border-[#10B981] p-5 text-center">
        <p className="text-sm text-gray-600">Solução completa a partir de</p>
        <p className="text-3xl font-bold text-[#1A1A1A] my-1">R$ 49,90</p>
        <p className="text-sm text-gray-500">Frete grátis a partir de 2 un. | Garantia de 30 dias</p>
      </div>

      {/* CTA */}
      <button
        onClick={handleCTA}
        className="w-full py-4 bg-[#10B981] text-white font-bold text-lg rounded-full hover:bg-[#059669] transition-colors shadow-lg shadow-green-200"
      >
        QUERO PROTEGER O {petName.toUpperCase()} AGORA
      </button>

      {/* Timer */}
      <div className="text-center">
        <p className="text-sm text-red-600 font-medium">
          ⏰ Oferta especial expira em {minutes}:{seconds.toString().padStart(2, "0")}
        </p>
      </div>

      {/* Trust badges */}
      <div className="flex justify-center gap-4 text-xs text-gray-500 flex-wrap">
        <span>🔒 Pagamento seguro</span>
        <span>📦 Frete grátis</span>
        <span>✅ Garantia 30 dias</span>
      </div>
    </div>
  )
}
