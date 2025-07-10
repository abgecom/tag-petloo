"use client"
import dynamic from "next/dynamic"

// Importar o componente dinamicamente sem SSR
const PixPaymentClient = dynamic(() => import("./PixPaymentClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Carregando...</h2>
        <p className="text-gray-600">Preparando página de pagamento PIX</p>
      </div>
    </div>
  ),
})

export default function PixPaymentPage() {
  return <PixPaymentClient />
}
