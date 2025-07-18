import { Suspense } from "react"
import PixPaymentClient from "./PixPaymentClient" // Caminho de importação corrigido
import PixPaymentLoading from "./loading"

interface PixPaymentPageProps {
  searchParams: {
    orderId?: string
    amount?: string
  }
}

export default function PixPaymentPage({ searchParams }: PixPaymentPageProps) {
  const { orderId, amount } = searchParams

  if (!orderId || !amount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Parâmetros Inválidos</h2>
          <p className="text-gray-600 mb-6">
            O ID do pedido ou o valor não foram encontrados. Por favor, tente refazer o pedido desde o checkout.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<PixPaymentLoading />}>
      <PixPaymentClient orderId={orderId} amount={Number(amount)} />
    </Suspense>
  )
}
