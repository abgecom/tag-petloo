"use client"

import { Check } from "lucide-react"

export default function GiftsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 text-center">Você também vai ganhar um presente </h2>
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <img
              src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/imglivro%2Bapp-gN8BH9qlfyUtbsEnqZgmjWWHN1pL2e.png"
              alt="Ultimate Guide Book"
              className="w-16 h-20 rounded"
            />
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-gray-600 line-through">R$79.90</span>
                <span
                  className="px-2 py-1 rounded text-white text-sm font-bold"
                  style={{ backgroundColor: "#24B14C" }}
                >
                  grátis
                </span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">
                Acesso ao Loobook, o mais completo e certeiro guia de adestramento{" "}
              </h4>
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4" style={{ color: "#24B14C" }} />
                <span className="text-sm font-medium" style={{ color: "#24B14C" }}>
                  você ganhou
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
