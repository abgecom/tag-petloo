"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail, Smartphone, Home } from "lucide-react"
import Link from "next/link"
import PurchaseTracker from "@/components/PurchaseTracker"

interface OrderSummary {
  orderId?: string
  customerName?: string
  customerEmail?: string
  amount?: number
  paymentMethod?: string
}

export default function ObrigadoPage() {
  const searchParams = useSearchParams()
  const [orderData, setOrderData] = useState<OrderSummary>({})

  useEffect(() => {
    // Capturar dados da URL ou sessionStorage
    const orderId = searchParams.get("orderId")
    const customerName = searchParams.get("name")
    const customerEmail = searchParams.get("email")
    const amount = searchParams.get("amount")
    const paymentMethod = searchParams.get("method")

    // Tentar recuperar dados do sessionStorage se não estiverem na URL
    const savedOrderData = sessionStorage.getItem("orderSummary")
    if (savedOrderData) {
      try {
        const parsedData = JSON.parse(savedOrderData)
        setOrderData(parsedData)
        // NÃO limpar dados aqui - deixar para o PurchaseTracker usar
        return
      } catch (error) {
        console.error("Erro ao parsear dados do pedido:", error)
      }
    }

    // Usar dados da URL se não houver dados no sessionStorage
    setOrderData({
      orderId: orderId || undefined,
      customerName: customerName || undefined,
      customerEmail: customerEmail || undefined,
      amount: amount ? Number(amount) : 4990, // Alterado de 1887 para 4990 (R$ 49,90)
      paymentMethod: paymentMethod || "PIX",
    })
  }, []) // Empty dependency array - run only once on mount

  const formatCurrency = (amount: number) => {
    // Se o valor for muito pequeno (menor que 10), provavelmente já está em reais
    // Se for maior que 100, provavelmente está em centavos e precisa ser convertido
    const valueInReais = amount > 100 ? amount / 100 : amount

    return valueInReais.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Purchase Tracker - Dispara eventos de compra concluída */}
      <PurchaseTracker />

      <div className="max-w-2xl mx-auto">
        {/* Header com Logo */}
        <div className="text-center mb-8">
          <img
            src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
            alt="Petloo Logo"
            className="h-12 mx-auto mb-4"
          />
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Obrigado pela sua compra!</h1>
            <p className="text-gray-600 text-lg">
              Você receberá um comprovante via e-mail cadastrado e instruções de acesso ao aplicativo
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumo do Pedido</h2>

            <div className="space-y-3">
              {/* Product */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img
                    src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Fotos%20da%20LP/image%20594-rIMxV2I0SZADJI938HxomgyWIUjTGg.png"
                    alt="Tag rastreamento Petloo"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-800">Tag rastreamento Petloo + App</p>
                    <p className="text-sm text-gray-600">Quantidade: 1</p>
                  </div>
                </div>
                <span className="font-semibold text-gray-800">{formatCurrency(orderData.amount || 4990)}</span>
              </div>

              {/* Divider */}
              <hr className="border-gray-200" />

              {/* Order Details */}
              {orderData.orderId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID do Pedido:</span>
                  <span className="font-mono text-sm text-gray-800">{orderData.orderId}</span>
                </div>
              )}

              {orderData.customerName && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="text-gray-800">{orderData.customerName}</span>
                </div>
              )}

              {orderData.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-gray-600">E-mail:</span>
                  <span className="text-gray-800">{orderData.customerEmail}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Método de Pagamento:</span>
                <span className="text-gray-800">{orderData.paymentMethod || "PIX"}</span>
              </div>

              {/* Total */}
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-800">Total:</span>
                <span className="text-green-600">{formatCurrency(orderData.amount || 4990)}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Próximos Passos:</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">Confirmação por E-mail</p>
                  <p className="text-sm text-gray-600">
                    Você receberá um e-mail com o comprovante de compra e código de rastreamento
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">Download do App Petloo</p>
                  <p className="text-sm text-gray-600">
                    Instruções para baixar e configurar o aplicativo serão enviadas por e-mail
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">Entrega da Tag</p>
                  <p className="text-sm text-gray-600">Sua tag personalizada será enviada em até 72 horas úteis</p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-yellow-800 mb-2">📦 Informações de Entrega</h4>
            <p className="text-yellow-700 text-sm">
              <strong>Atenção:</strong> O prazo de entrega dos produtos personalizados inclui o tempo de frete + o prazo
              de produção (2 a 3 semanas).
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link href="/" className="flex-1">
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-3">
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </Link>

          <Button variant="outline" className="flex-1 py-3 bg-transparent" onClick={() => window.print()}>
            Imprimir Comprovante
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>Petloo - Todos os direitos reservados</p>
          <div className="flex justify-center mt-2">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-KSAVnVrLk1AvbhF07h55u42sGHYCX4.png"
              alt="Site Seguro"
              className="h-8"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
