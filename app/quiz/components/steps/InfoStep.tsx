"use client"

import type { QuizStep } from "../../data/quiz-steps"
import { useQuiz } from "../../hooks/useQuiz"

interface InfoStepProps {
  config: QuizStep
  onNext: () => void
}

function renderBoldText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-bold">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

const locationLabels: Record<string, string> = {
  capital: "Capital ou região metropolitana",
  "cidade-media": "Cidade de médio porte",
  "cidade-pequena": "Cidade pequena ou interior",
  "zona-rural": "Zona rural",
}

const sizeLabels: Record<string, string> = {
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
}

function ProfileSummary() {
  const { quizData } = useQuiz()
  const petEmoji = quizData.petType === "gato" ? "🐈" : "🐕"
  const genderLabel = quizData.petGender === "femea" ? "fêmea" : "macho"
  const sizeLabel = sizeLabels[quizData.petSize] || "—"
  const locationLabel = locationLabels[quizData.location] || "—"
  const colorEmoji = quizData.tagColor === "laranja" ? "🟠" : quizData.tagColor === "roxo" ? "🟣" : "🎨"
  const colorLabel =
    quizData.tagColor === "laranja" ? "Laranja" : quizData.tagColor === "roxo" ? "Roxa" : "—"

  const items = [
    {
      emoji: petEmoji,
      text: `${quizData.petName} — ${quizData.petType === "gato" ? "Gato" : "Cachorro"} ${genderLabel}, porte ${sizeLabel}`,
    },
    { emoji: "📍", text: `Mora em ${locationLabel}` },
    { emoji: colorEmoji, text: `Tag escolhida: ${colorLabel}` },
    { emoji: "🔒", text: "Nível de proteção atual: precisa de atenção" },
  ]

  return (
    <div className="space-y-3 bg-white rounded-xl p-4 border border-gray-200">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xl">{item.emoji}</span>
          <span className="text-sm text-gray-800">{item.text}</span>
        </div>
      ))}
    </div>
  )
}

// Estilos por variant com paleta Petloo
const variantStyles = {
  warning: {
    // Bordô Petloo
    bg: "bg-[#75004A]/5",
    text: "text-[#75004A]",
    btn: "bg-[#75004A] hover:bg-[#5A0038]",
    prefix: "⚠️ ",
  },
  positive: {
    // Laranja Petloo
    bg: "bg-[#F1542E]/10",
    text: "text-[#7A2A15]",
    btn: "bg-[#F1542E] hover:bg-[#D93D17]",
    prefix: "✅ ",
  },
  neutral: {
    // Roxo escuro Petloo
    bg: "bg-[#461947]/5",
    text: "text-[#461947]",
    btn: "bg-[#F1542E] hover:bg-[#D93D17]",
    prefix: "",
  },
} as const

export default function InfoStep({ config, onNext }: InfoStepProps) {
  const variant = (config.variant || "neutral") as keyof typeof variantStyles
  const s = variantStyles[variant]

  return (
    <div className="space-y-6">
      <div className={`text-center p-6 rounded-2xl ${s.bg}`}>
        <h2 className={`text-2xl font-bold mb-4 ${s.text}`}>
          {s.prefix}
          {config.title}
        </h2>

        {/* Imagem ilustrativa (se configurada) */}
        {config.imageUrl && (
          <div className="mb-5 -mx-2 rounded-xl overflow-hidden">
            <img
              src={config.imageUrl}
              alt={config.imageAlt || ""}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {config.dynamicContent ? (
          <ProfileSummary />
        ) : (
          <>
            <div className="space-y-4">
              {config.content?.map((paragraph, i) => (
                <p key={i} className={`text-base leading-relaxed ${s.text} opacity-90`}>
                  {renderBoldText(paragraph)}
                </p>
              ))}
            </div>

            {config.highlight && (
              <div className="mt-5 pt-5 border-t border-current/10">
                <p className={`text-sm font-semibold ${s.text}`}>
                  {renderBoldText(config.highlight)}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <button
        onClick={onNext}
        className={`w-full py-4 text-white font-bold text-base rounded-full transition-colors ${s.btn}`}
      >
        {config.buttonText || "CONTINUAR"}
      </button>
    </div>
  )
}
