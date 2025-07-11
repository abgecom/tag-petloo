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
  const [selectedColor, setSelectedColor] = useState<"orange" | "purple" | null>(null)
  const [petName, setPetName] = useState("")

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleFinalize = () => {
    if (selectedColor && petName.trim()) {
      onFinalizePurchase(selectedColor, petName.trim())
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
            <h2 className="text-2xl md:text-3xl font-bold text-black leading-tight">Escolha a cor da sua tag</h2>
          </div>

          {/* Color Options */}
          <div className="space-y-4">
            {/* Orange Tag */}
            <div
              className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                selectedColor === "orange"
                  ? "border-orange-500 bg-orange-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedColor("orange")}
            >
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  {selectedColor === "orange" && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                </div>
                <div className="flex-1">
                  <img
                    src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/ChatGPT%20Image%2010%20de%20jul.%20de%202025%2C%2019_05_16.png"
                    alt="Tag laranja personalizada"
                    className="w-full h-20 object-contain rounded-lg"
                  />
                  <p className="text-center mt-2 font-medium text-gray-800">Tag Laranja</p>
                </div>
              </div>
            </div>

            {/* Purple Tag */}
            <div
              className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                selectedColor === "purple"
                  ? "border-purple-500 bg-purple-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedColor("purple")}
            >
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  {selectedColor === "purple" && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                </div>
                <div className="flex-1">
                  <img
                    src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/ChatGPT%20Image%2010%20de%20jul.%20de%202025%2C%2019_05_18.png"
                    alt="Tag roxa personalizada"
                    className="w-full h-20 object-contain rounded-lg"
                  />
                  <p className="text-center mt-2 font-medium text-gray-800">Tag Roxa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pet Name Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Diga-nos o nome do seu pet para personalização
            </label>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="Digite aqui o nome do pet"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 shadow-sm"
              maxLength={20}
            />
            {petName.length > 15 && (
              <p className="text-sm text-amber-600">⚠️ Nomes muito longos podem não caber na tag</p>
            )}
          </div>

          {/* Finalize Button */}
          <Button
            onClick={handleFinalize}
            disabled={!selectedColor || !petName.trim()}
            className="w-full rounded-xl px-6 py-3 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#F1542E" }}
          >
            {!selectedColor ? "Escolha uma cor" : !petName.trim() ? "Digite o nome do pet" : "Finalizar compra"}
          </Button>
        </div>
      </div>
    </div>
  )
}
