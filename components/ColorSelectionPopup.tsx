"use client"

import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ColorSelectionPopupProps {
  isOpen: boolean
  onClose: () => void
  onFinalizePurchase: (color: "orange" | "purple", petName: string) => void
}

export default function ColorSelectionPopup({ isOpen, onClose, onFinalizePurchase }: ColorSelectionPopupProps) {
  const [petName, setPetName] = useState("")

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleFinalize = () => {
    if (petName.trim()) {
      onFinalizePurchase("purple", petName.trim())
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Content */}
        <div className="space-y-6">
          {/* Title */}
          <div className="text-center pr-8">
            <h2 className="text-2xl md:text-3xl font-bold text-black leading-tight">Qual o nome do seu pet?</h2>
            <p className="text-sm text-gray-600 mt-2">Vamos gravar na sua tag com muito carinho</p>
          </div>

          {/* Pet Name Input */}
          <div className="space-y-2">
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="Digite aqui o nome do pet"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400 shadow-sm"
              maxLength={20}
              autoFocus
            />
            {petName.length > 15 && (
              <p className="text-sm text-amber-600">⚠️ Nomes muito longos podem não caber na tag</p>
            )}
          </div>

          {/* Finalize Button */}
          <Button
            onClick={handleFinalize}
            disabled={!petName.trim()}
            className="w-full rounded-xl px-6 py-3 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#F1542E" }}
          >
            {!petName.trim() ? "Digite o nome do pet" : "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
