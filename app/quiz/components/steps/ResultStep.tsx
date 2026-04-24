"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useQuiz } from "../../hooks/useQuiz"
import { calculateRiskScore } from "../../utils/calculate-risk-score"
import { saveQuizComplete } from "../../utils/save-quiz-result"

const sizeLabels: Record<string, string> = {
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
}

const locationLabels: Record<string, string> = {
  capital: "Capital",
  "cidade-media": "Cidade de médio porte",
  "cidade-pequena": "Cidade pequena",
  "zona-rural": "Zona rural",
}

// Counter animado 0 → target
function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      setValue(Math.floor(progress * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return <>{value.toLocaleString("pt-BR")}</>
}

export default function ResultStep() {
  const router = useRouter()
  const { quizData, updateQuizData } = useQuiz()
  const hasSaved = useRef(false)
  const [timeLeft, setTimeLeft] = useState(15 * 60)

  const result = calculateRiskScore({
    location: quizData.location,
    alreadyLost: quizData.alreadyLost,
    petRoutine: quizData.petRoutine,
    riskSituations: quizData.riskSituations,
    currentProtection: quizData.currentProtection,
    timeToNotice: quizData.timeToNotice,
  })

  const petName = quizData.petName || "seu pet"
  const tutorName = quizData.tutorName || "Tutor"

  // Salvar + tracking
  useEffect(() => {
    if (hasSaved.current) return
    hasSaved.current = true

    updateQuizData({
      riskScore: result.score,
      riskLevel: result.level,
      completedAt: new Date().toISOString(),
    })

    saveQuizComplete({
      ...quizData,
      riskScore: result.score,
      riskLevel: result.level,
      completedAt: new Date().toISOString(),
    })

    // Meta Pixel
    if (typeof window !== "undefined" && typeof (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq === "function") {
      ;(window as unknown as { fbq: (...args: unknown[]) => void }).fbq("track", "Lead", {
        content_name: "quiz-tagloo-complete",
        risk_score: result.score,
        risk_level: result.level,
        pet_type: quizData.petType,
        pet_size: quizData.petSize,
        tag_color: quizData.tagColor,
      })
    }

    // dataLayer
    if (typeof window !== "undefined") {
      ;((window as unknown as { dataLayer?: unknown[] }).dataLayer ||= []).push({
        event: "quiz_complete",
        risk_score: result.score,
        risk_level: result.level,
        pet_type: quizData.petType,
        pet_size: quizData.petSize,
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown
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
      text: `Embora existam alguns cuidados, identificamos vulnerabilidades que podem colocar o ${petName} em risco em situações inesperadas.`,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-800",
      borderColor: "border-yellow-400",
      gaugeColor: "#EAB308",
    },
    low: {
      label: "BAIXO",
      title: `${tutorName}, o ${petName} precisa de MAIS PROTEÇÃO`,
      text: `Com base nas suas respostas, o ${petName} está exposto a riscos reais que poderiam ser evitados com rastreamento GPS em tempo real.`,
      bgColor: "bg-orange-50",
      textColor: "text-orange-800",
      borderColor: "border-orange-400",
      gaugeColor: "#F97316",
    },
    critical: {
      label: "CRÍTICO",
      title: `${tutorName}, o ${petName} está em situação CRÍTICA`,
      text: `As suas respostas indicam que o ${petName} está muito vulnerável. Sem rastreamento, em caso de fuga, as chances de reencontro são muito baixas.`,
      bgColor: "bg-red-50",
      textColor: "text-red-800",
      borderColor: "border-red-400",
      gaugeColor: "#EF4444",
    },
  }

  const config = levelConfig[result.level]

  const handleCTA = () => {
    // Tracking de clique no CTA
    if (typeof window !== "undefined" && typeof (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq === "function") {
      ;(window as unknown as { fbq: (...args: unknown[]) => void }).fbq("track", "ViewContent", {
        content_name: "quiz-to-v3",
        value: 89.87,
        currency: "BRL",
      })
    }

    const params = new URLSearchParams({
      petName: quizData.petName,
      tutorName: quizData.tutorName,
      petType: quizData.petType,
      petSize: quizData.petSize,
      petGender: quizData.petGender,
      tagColor: quizData.tagColor,
      riskScore: String(result.score),
      riskLevel: result.level,
    })
    router.push(`/v3?${params.toString()}`)
  }

  const petTypeLabel = quizData.petType === "gato" ? "Gato" : "Cachorro"
  const genderLabel = quizData.petGender === "femea" ? "fêmea" : "macho"
  const sizeLabel = sizeLabels[quizData.petSize] || "—"
  const locationLabel = locationLabels[quizData.location] || "—"
  const colorLabel = quizData.tagColor === "laranja" ? "Laranja" : quizData.tagColor === "roxo" ? "Roxa" : "—"
  const petEmoji = quizData.petType === "gato" ? "🐈" : "🐕"

  return (
    <div className="space-y-6 pb-28">
      {/* ========== 1. Score visual (gauge) ========== */}
      <div className={`text-center p-6 rounded-2xl ${config.bgColor} border-2 ${config.borderColor}`}>
        <div className="flex justify-center mb-4">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
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
                style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Risco</span>
              <span className={`text-lg font-bold ${config.textColor}`}>{config.label}</span>
              <span className="text-xs text-gray-500 mt-0.5">{result.score} pts</span>
            </div>
          </div>
        </div>

        <h2 className={`text-xl font-bold ${config.textColor} mb-2`}>{config.title}</h2>
        <p className={`text-sm ${config.textColor} opacity-80`}>{config.text}</p>
      </div>

      {/* ========== 2. Gráfico 1 — pets que fogem sem rastreamento ========== */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-4">
        <h3 className="font-bold text-[#1A1A1A] text-sm">
          O que acontece com pets que fogem <span className="text-red-600">sem rastreamento</span>:
        </h3>
        {[
          { label: "Nunca são encontrados", pct: 60, color: "#EF4444" },
          { label: "Encontrados depois de dias/semanas", pct: 25, color: "#F97316" },
          { label: "Encontrados rapidamente (sorte)", pct: 15, color: "#EAB308" },
        ].map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between text-xs text-gray-700 mb-1">
              <span>{bar.label}</span>
              <span className="font-bold">{bar.pct}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${bar.pct}%`, backgroundColor: bar.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ========== 3. Gráfico 2 — pets encontrados com Lootag ========== */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200 text-center">
        <p className="text-sm text-gray-700 mb-2">Pets encontrados com rastreamento Lootag:</p>
        <p className="text-5xl font-bold text-green-600 mb-1">
          +<AnimatedCounter target={2000} />
        </p>
        <p className="text-xs text-gray-600 mb-4">tutores reencontrando seus pets</p>
        <div className="bg-white rounded-lg p-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-700 font-medium">95% encontrados em menos de 1 hora</span>
            <span className="font-bold text-green-600">95%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-1500"
              style={{ width: "95%" }}
            />
          </div>
        </div>
      </div>

      {/* ========== 4. Perfil do pet ========== */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-2">
        <h3 className="font-bold text-[#1A1A1A] text-sm mb-2">Perfil do {petName}:</h3>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-lg">{petEmoji}</span>
          <span className="text-gray-700">
            <strong>{petName}</strong> — {petTypeLabel} {genderLabel}, porte {sizeLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-lg">📍</span>
          <span className="text-gray-700">{locationLabel}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-lg">🎨</span>
          <span className="text-gray-700">Tag {colorLabel} selecionada</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-lg">⚠️</span>
          <span className="text-gray-700">
            Nível: <strong className={config.textColor}>{config.label}</strong>
          </span>
        </div>
      </div>

      {/* ========== 5. Antes e Depois ========== */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-bold text-red-700 mb-3 uppercase">Hoje — sem rastreamento</p>
          {[
            `Sem saber onde o ${petName} está`,
            "Sem alerta se ele fugir",
            "Dependendo da sorte",
            "Sem histórico",
          ].map((txt) => (
            <p key={txt} className="text-xs text-red-900/70 mb-2 leading-snug">
              ❌ {txt}
            </p>
          ))}
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs font-bold text-green-700 mb-3 uppercase">Com Lootag</p>
          {[
            "Localização em tempo real",
            "Alerta instantâneo de fuga",
            "+2.000 pets encontrados",
            "Histórico completo",
          ].map((txt) => (
            <p key={txt} className="text-xs text-green-900/70 mb-2 leading-snug">
              ✅ {txt}
            </p>
          ))}
        </div>
      </div>

      {/* ========== 6. Oferta rápida ========== */}
      <div className="bg-white rounded-2xl border-2 border-[#10B981] p-5 text-center">
        <p className="text-sm text-gray-600">A solução completa para proteger o {petName} a partir de</p>
        <p className="text-4xl font-bold text-[#1A1A1A] my-1">R$ 89,87</p>
        <p className="text-xs text-gray-500">(ou 3x de R$ 29,96)</p>
        <p className="text-xs text-gray-500 mt-2">Frete grátis • 7 dias de garantia</p>
      </div>

      {/* ========== 7. CTA inline (com botão sticky no bottom também) ========== */}
      <button
        onClick={handleCTA}
        className="w-full py-4 bg-[#10B981] text-white font-bold text-lg rounded-full hover:bg-[#059669] transition-colors shadow-lg shadow-green-200"
      >
        PROTEGER O {petName.toUpperCase()} AGORA →
      </button>

      {/* ========== 8. Timer ========== */}
      <div className="text-center">
        <p className="text-sm text-red-600 font-medium">
          {timeLeft > 0 ? (
            <>
              ⏰ Diagnóstico válido por {minutes}:{seconds.toString().padStart(2, "0")} — aproveite as
              condições especiais
            </>
          ) : (
            <>⏰ Diagnóstico expirado — clique no botão para aproveitar mesmo assim</>
          )}
        </p>
      </div>

      {/* ========== 9. Trust ========== */}
      <div className="flex justify-center gap-3 text-xs text-gray-500 flex-wrap">
        <span>🔒 Pagamento seguro</span>
        <span>📦 Frete grátis</span>
        <span>✅ 7 dias de garantia</span>
      </div>

      {/* ========== CTA fixo no bottom (sticky) ========== */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleCTA}
            className="w-full py-3.5 bg-[#10B981] text-white font-bold text-base rounded-full hover:bg-[#059669] transition-colors shadow-lg shadow-green-200"
          >
            PROTEGER O {petName.toUpperCase()} AGORA →
          </button>
        </div>
      </div>
    </div>
  )
}
