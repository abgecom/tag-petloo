"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
}

export default function PersonalizedTagManager({
  isOpen,
  onClose,
  tagIndex,
  existingTag,
  onSaveTag,
}: PersonalizedTagManagerProps) {
  const [selectedColor, setSelectedColor] = useState<"orange" | "purple">("orange")
  const [petName, setPetName] = useState("")

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      if (existingTag) {
        setSelectedColor(existingTag.color)
        setPetName(existingTag.petName)
      } else {
        setSelectedColor("orange")
        setPetName("")
      }
    }
  }, [isOpen, existingTag])

  const handleSave = () => {
    if (!petName.trim()) {
      alert("Por favor, digite o nome do seu pet")
      return
    }

    // 🚨 CORREÇÃO: Primeira tag R$ 49,90, demais R$ 9,90
    const price = tagIndex === 0 ? 4990 : 990 // Primeira tag 4990 centavos, demais 990 centavos

    const tag: PersonalizedTag = {
      id: existingTag?.id || `tag-${tagIndex}`,
      color: selectedColor,
      petName: petName.trim(),
      price: price,
    }

    onSaveTag(tag)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{existingTag ? "Editar Tag" : `Configurar Tag ${tagIndex + 1}`}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Color Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Escolha a cor da tag:</Label>
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedColor("orange")}
                className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                  selectedColor === "orange"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-orange-500 rounded-full"></div>
                  <div className="text-left">
                    <p className="font-medium">Tag Laranja</p>
                    <p className="text-sm text-gray-600">Cor vibrante</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedColor("purple")}
                className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                  selectedColor === "purple"
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                  <div className="text-left">
                    <p className="font-medium">Tag Roxa</p>
                    <p className="text-sm text-gray-600">Cor elegante</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Pet Name Input */}
          <div>
            <Label htmlFor="petName" className="text-sm font-medium">
              Nome do seu pet
            </Label>
            <Input
              id="petName"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="Ex: Rex, Luna, Buddy..."
              className="mt-1"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">Máximo 20 caracteres</p>
          </div>

          {/* Price Display */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Preço desta tag:</span>
              <span className="font-bold text-lg">{tagIndex === 0 ? "R$ 49,90" : "R$ 9,90"}</span>
            </div>
            {tagIndex === 0 && <p className="text-xs text-gray-500 mt-1">Primeira tag - preço completo</p>}
            {tagIndex > 0 && <p className="text-xs text-gray-500 mt-1">Tag adicional - preço promocional</p>}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
            {existingTag ? "Salvar Alterações" : "Adicionar Tag"}
          </Button>
        </div>
      </div>
    </div>
  )
}
