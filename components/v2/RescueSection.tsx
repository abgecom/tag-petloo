"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RescueSectionProps {
  onOpenPersonalizationPopup: () => void
}

export default function RescueSection({ onOpenPersonalizationPopup }: RescueSectionProps) {
  return (
    <>
      <div className="text-center py-8">
        <h2 className="text-3xl md:text-4xl font-bold text-black">Resgate agora a sua Tag</h2>
      </div>

      <div className="text-center">
        <img
          src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Fotos%20da%20LP/Frame%208940560-EIvm6iJOyX4PH5iRHdP9ouPNNnFr7D.png"
          alt="Cachorro com tag no pescoço e mão segurando celular com mapa"
          className="w-full max-w-lg rounded-2xl mx-auto shadow-md"
        />
      </div>

      <div className="text-center">
        <Button
          onClick={onOpenPersonalizationPopup}
          className="text-white px-20 py-8 text-2xl font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#24B14C" }}
        >
          <ShoppingCart className="w-8 h-8 mr-4" />
          Pedir agora
        </Button>
        <p className="text-gray-600 text-sm mt-3">Cancele a qualquer momento </p>
      </div>
    </>
  )
}
