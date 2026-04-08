"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface PersonalizedTag {
  id: string
  color: "orange" | "purple"
  petName: string
  price: number
}

interface PersonalizedTagManagerProps {
  isOpen: boolean
  onClose: () => void
  tagIndex: number
  existingTag?: PersonalizedTag
  onSaveTag: (tag: PersonalizedTag) => void
  basePrice: number // Preço base da oferta em centavos (ex: 8987, 9987, 14987)
}

export default function PersonalizedTagManager({
  isOpen,
  onClose,
  tagIndex,
  existingTag,
  onSaveTag,
  basePrice,
}: PersonalizedTagManagerProps) {
  const [petName, setPetName] = useState("")

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setPetName(existingTag?.petName || "")
    }
  }, [isOpen, existingTag])

  const handleSave = () => {
    if (!petName.trim()) return

    // Primeira tag = preço cheio do plano, tags adicionais = METADE
    const price = tagIndex === 0 ? basePrice : Math.round(basePrice / 2)

    const tag: PersonalizedTag = {
      id: existingTag?.id || `tag-${tagIndex}`,
      color: "purple",
      petName: petName.trim(),
      price: price,
    }

    onSaveTag(tag)
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

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
            onClick={handleSave}
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
