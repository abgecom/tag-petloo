"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

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
}

export default function PersonalizedTagManager({
  isOpen,
  onClose,
  tagIndex,
  existingTag,
  onSaveTag,
}: PersonalizedTagManagerProps) {
  const [selectedColor, setSelectedColor] = useState<"orange" | "purple" | null>(existingTag?.color || null)
  const [petName, setPetName] = useState(() => {
    // Se existingTag existe, usar o nome dele (editando tag existente)
    // Se não existe, começar com string vazia (nova tag)
    return existingTag?.petName || ""
  })

  useEffect(() => {
    if (existingTag) {
      // Editando tag existente - preencher com dados existentes
      setSelectedColor(existingTag.color)
      setPetName(existingTag.petName)
    } else {
      // Nova tag - limpar campos
      setSelectedColor(null)
      setPetName("")
    }
  }, [existingTag, isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSave = () => {
    if (selectedColor && petName.trim()) {
      // CORREÇÃO: Primeira tag R$ 49,90, demais R$ 9,90
      const price = tagIndex === 0 ? 4990 : 990 // Primeira tag R$ 49,90, demais R$ 9,90

      onSaveTag({
        id: `tag-${tagIndex}`,
        color: selectedColor,
        petName: petName.trim(),
        price: price,
      })
      onClose()
    }
  }

  const isFirstTag = tagIndex === 0
  const tagPrice = isFirstTag ? "R$ 49,90" : "R$ 9,90"

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
            <h2 className="text-2xl md:text-3xl font-bold text-black leading-tight">
              {isFirstTag ? "Configure sua primeira tag" : `Configure a tag ${tagIndex + 1}`}
            </h2>
            <p className="text-gray-700 text-base mt-2">
              {isFirstTag ? `Primeira tag por ${tagPrice}` : `Tag adicional por ${tagPrice}`}
            </p>
          </div>

          {/* Color Options */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">Escolha a cor da tag:</h3>

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
            <label className="block text-sm font-medium text-gray-700">Nome do pet para esta tag</label>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="Digite o nome do pet"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400 shadow-sm"
              maxLength={20}
            />
            {petName.length > 15 && (
              <p className="text-sm text-amber-600">⚠️ Nomes muito longos podem não caber na tag</p>
            )}
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!selectedColor || !petName.trim()}
            className="w-full rounded-xl px-6 py-3 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#F1542E" }}
          >
            {!selectedColor
              ? "Escolha uma cor"
              : !petName.trim()
                ? "Digite o nome do pet"
                : isFirstTag
                  ? "Salvar primeira tag"
                  : `Salvar tag ${tagIndex + 1}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
