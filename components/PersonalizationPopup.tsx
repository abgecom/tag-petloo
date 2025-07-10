"use client"

import type React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PersonalizationPopupProps {
  isOpen: boolean
  onClose: () => void
  onPersonalize: () => void
  onSkipPersonalization: () => void
}

export default function PersonalizationPopup({
  isOpen,
  onClose,
  onPersonalize,
  onSkipPersonalization,
}: PersonalizationPopupProps) {
  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
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
          <div className="text-center space-y-2 pr-8">
            <h2 className="text-2xl md:text-3xl font-bold text-black leading-tight">
              Que tal personalizar a sua tag com o nome do seu pet? ✨
            </h2>
            <p className="text-gray-700 text-base">
              Escrevemos com o maior carinho o nome do seu pet e você recebe em casa uma tag personalizada.
            </p>
          </div>

          {/* Image Placeholder */}
          <div className="rounded-xl w-full flex items-center justify-center">
            <img
              src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/20250710_1929_Diferen%C3%A7a%20de%20Identidade_simple_compose_01jzv7958kfqbr5e4b5pza0kmv.png"
              alt="Tag personalizada com nome do pet"
              className="rounded-xl max-w-full h-auto object-contain"
            />
          </div>

          {/* Price */}
          <div className="text-center">
            <p className="text-xl font-bold text-black">
              Tudo isso por apenas <span className="text-green-600">R$ 39,90</span> com frete grátis.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onPersonalize}
              className="flex-1 rounded-xl px-6 py-3 text-white font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#F1542E" }}
            >
              Quero personalizar a tag
            </Button>
            <Button
              onClick={onSkipPersonalization}
              className="flex-1 rounded-xl px-6 py-3 bg-gray-300 text-gray-800 font-medium hover:bg-gray-400 transition-colors"
            >
              Não quero personalizar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
