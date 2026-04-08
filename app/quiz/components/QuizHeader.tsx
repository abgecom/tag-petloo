"use client"

import { ChevronLeft } from "lucide-react"

interface QuizHeaderProps {
  onBack: () => void
  showBack: boolean
}

export default function QuizHeader({ onBack, showBack }: QuizHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        {showBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
        ) : (
          <div className="w-16" />
        )}
        <img
          src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
          alt="Petloo"
          className="h-7"
        />
        <div className="w-16" />
      </div>
    </header>
  )
}
