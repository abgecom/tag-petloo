"use client"

import { Award, Truck, RotateCcw, Shield } from "lucide-react"

export default function PaymentSection() {
  return (
    <div className="text-center space-y-6">
      <div className="flex items-center justify-center gap-2">
        <input type="checkbox" id="terms" className="rounded" defaultChecked />
        <label htmlFor="terms" className="text-sm text-gray-700">
          Concordo com os <span className="underline">termos de compra</span> e{" "}
          <span className="underline">privacidade</span>
        </label>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Pagamento seguro </h3>
        <div className="flex justify-center items-center gap-4">
          <img
            src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/visa-BRBd7AI7oDhyBwzy47g6H1kt5cjCOs.svg"
            alt="Visa"
            className="h-8"
          />
          <img
            src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/mastercard-RHKlJLfpzUysKGBW778wrPcURdL1Vs.svg"
            alt="Mastercard"
            className="h-8"
          />
          <img
            src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/dinersclub-tq3yQnCJ6s2ItWpeEolHVKr0sOIMXZ.svg"
            alt="Diners Club"
            className="h-8"
          />
          <img
            src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/amex-Pg3sjSq06QovPei03PSTS9ZvqcHM3m.svg"
            alt="American Express"
            className="h-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 text-sm">
          <Award className="w-5 h-5" style={{ color: "#24B14C" }} />
          <span className="text-gray-700">Selo de qualidade </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Truck className="w-5 h-5" style={{ color: "#24B14C" }} />
          <span className="text-gray-700">Frete expresso </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <RotateCcw className="w-5 h-5" style={{ color: "#24B14C" }} />
          <span className="text-gray-700">Garantia da loja </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Shield className="w-5 h-5" style={{ color: "#24B14C" }} />
          <span className="text-gray-700">Feito no Brasil </span>
        </div>
      </div>
    </div>
  )
}
