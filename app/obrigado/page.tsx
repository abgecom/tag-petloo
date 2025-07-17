"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail, Smartphone, Home } from "lucide-react"
import Link from "next/link"
import PurchaseTracker from "@/components/PurchaseTracker"

// Interfaces atualizadas para incluir detalhes do produto
interface PersonalizedTag {
  id: string
  color: "orange" | "purple"
  petName: string
  price: number
}

interface OrderSummary {
  orderId?: string
  customerName?: string
  customerEmail?: string
  amount?: number
  paymentMethod?: string
  personalizedTags?: PersonalizedTag[]
  quantity?: number
}

function ObrigadoContent() {
  const searchParams = useSearchParams()
  const [orderData, setOrderData] = useState<OrderSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // A lógica agora prioriza os dados detalhados do sessionStorage
    const savedOrderData = sessionStorage.getItem("orderSummary")
    if (savedOrderData) {
      try {
        const parsedData = JSON.parse(savedOrderData)
        console.log("✅ Dados do pedido encontrados no sessionStorage:", parsedData)
        setOrderData(parsedData)
      } catch (error) {
        console.error("Erro ao parsear dados do pedido:", error)
        // Se falhar, tenta o fallback
        setOrderData(getFallbackData())
      }
    } else {
      // Fallback para dados da URL (fluxo antigo ou de segurança)
      console.log("⚠️ Nenhum dado no sessionStorage, usando fallback da URL.")
      setOrderData(getFallbackData())
    }
    setIsLoading(false)
  }, [])

  const getFallbackData = (): OrderSummary => {
    return {
      orderId: searchParams.get("orderId") || undefined,
      customerName: searchParams.get("name") || undefined,
      customerEmail: searchParams.get("email") || undefined,
      amount: searchParams.get("amount") ? Number(searchParams.get("amount")) : 4990,
      paymentMethod: searchParams.get("method") || "PIX",
      quantity: 1,
      personalizedTags: [],
    }
  }

  const formatCurrency = (amountInCents: number) => {
    if (typeof amountInCents !== "number") return "R$ 0,00"
    const valueInReais = amountInCents / 100
    return valueInReais.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Não foi possível carregar os detalhes do pedido.</p>
        <Link href="/" className="mt-4 inline-block">
          <Button>Voltar ao Início</Button>
        </Link>
      </div>
    )
  }

  const isPersonalized = orderData.personalizedTags && orderData.personalizedTags.length > 0
  const displayQuantity = isPersonalized ? orderData.personalizedTags.length : orderData.quantity || 1

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <PurchaseTracker />

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <img
            src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
            alt="Petloo Logo"
            className="h-12 mx-auto mb-4"
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Obrigado pela sua compra!</h1>
            <p className="text-gray-600 text-lg">
              Você receberá um comprovante via e-mail cadastrado e instruções de acesso ao aplicativo.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumo do Pedido</h2>

            <div className="space-y-3">
              {/* Lógica de exibição condicional para os produtos */}
              {isPersonalized ? (
                orderData.personalizedTags?.map((tag, index) => (
                  <div key={tag.id || index} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          tag.color === "orange"
                            ? "https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/ChatGPT%20Image%2010%20de%20jul.%20de%202025%2C%2019_05_16.png"
                            : "https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/ChatGPT%20Image%2010%20de%20jul.%20de%202025%2C%2019_05_18.png"
                        }
                        alt={`Tag ${tag.color === "orange" ? "Laranja" : "Roxa"}`}
                        className="w-12 h-12 rounded-lg object-contain bg-gray-100"
                      />
                      <div>
                        <p className="font-medium text-gray-800">Tag Personalizada - {tag.petName}</p>
                        <p className="text-sm text-gray-600">Cor: {tag.color === "orange" ? "Laranja" : "Roxa"}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-800">{formatCurrency(tag.price)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Fotos%20da%20LP/image%20594-rIMxV2I0SZADJI938HxomgyWIUjTGg.png"
                      alt="Tag rastreamento Petloo"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-800">Tag rastreamento Petloo + App</p>
                      <p className="text-sm text-gray-600">Quantidade: {displayQuantity}</p>
                    </div>
                  </div>
                  {/* Para produto genérico, o valor total já inclui o frete, então não mostramos preço aqui */}
                </div>
              )}

              <hr className="border-gray-200" />

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
                <span className="text-gray-800">{orderData.paymentMethod || "Não informado"}</span>
              </div>

              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-800">Total:</span>
                <span className="text-green-600">{formatCurrency(orderData.amount || 0)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Próximos Passos:</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">Confirmação por E-mail</p>
                  <p className="text-sm text-gray-600">
                    Você receberá um e-mail com o comprovante de compra e código de rastreamento.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">Download do App Petloo</p>
                  <p className="text-sm text-gray-600">
                    Instruções para baixar e configurar o aplicativo serão enviadas por e-mail.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">Entrega da Tag</p>
                  <p className="text-sm text-gray-600">Sua tag será enviada em até 72 horas úteis.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-yellow-800 mb-2">📦 Informações de Entrega</h4>
            <p className="text-yellow-700 text-sm">
              <strong>Atenção:</strong> O prazo de entrega dos produtos personalizados inclui o tempo de frete + o prazo
              de produção (7 dias).
            </p>
          </div>
        </div>

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

export default function ObrigadoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <ObrigadoContent />
    </Suspense>
  )
}
