"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Copy, ArrowLeft, RotateCcw, CheckCircle } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

// Adicionar import no topo do arquivo
import PaymentStatusChecker from "@/components/PaymentStatusChecker"

// Importar o tracker dinamicamente
const PixPurchaseTracker = dynamic(() => import("@/components/PixPurchaseTracker"), {
  ssr: false,
})

export default function PixPaymentPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [pixData, setPixData] = useState<{
    orderId: string
    qrcode: string
    copiacola: string
    amount: number
    pix_payment_link?: string
  } | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copyFeedback, setCopyFeedback] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [fetchAttempted, setFetchAttempted] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || fetchAttempted) {
      return
    }
    setFetchAttempted(true)

    const orderId = searchParams.get("orderId")
    const amount = searchParams.get("amount")

    console.log("=== PIX PAYMENT PAGE INICIADA ===")
    console.log("Order ID:", orderId)
    console.log("Amount:", amount)

    // Primeiro, verificar se temos dados no sessionStorage
    if (typeof window !== "undefined") {
      const savedPixData = sessionStorage.getItem("pixPaymentData")
      if (savedPixData) {
        try {
          const parsedData = JSON.parse(savedPixData)
          console.log("✅ DADOS PIX ENCONTRADOS NO SESSION STORAGE!")

          setPixData({
            orderId: parsedData.orderId,
            qrcode: parsedData.qrcode,
            copiacola: parsedData.copiacola,
            amount: parsedData.amount,
            pix_payment_link: null,
          })
          setIsLoading(false)

          // Limpar dados do sessionStorage após usar
          sessionStorage.removeItem("pixPaymentData")
          return
        } catch (error) {
          console.error("Erro ao parsear dados PIX do sessionStorage:", error)
        }
      }
    }

    // Se não temos dados salvos, buscar via API (fluxo antigo)
    if (orderId && amount) {
      fetchPixData(orderId, Number(amount))
    } else {
      setError("Dados do pedido não encontrados. Tente fazer um novo pedido.")
      setIsLoading(false)
    }
  }, [mounted, fetchAttempted, searchParams])

  const fetchPixData = async (orderId: string, amount: number) => {
    try {
      setIsLoading(true)
      setError(null)

      console.log(`=== BUSCANDO DADOS PIX - Tentativa ${retryCount + 1} ===`)
      console.log("Order ID:", orderId)

      const response = await fetch(`/api/pix-status?orderId=${orderId}`)
      const result = await response.json()

      console.log("=== RESPOSTA PIX-STATUS ===")
      console.log("Status:", response.status)
      console.log("Result:", JSON.stringify(result, null, 2))

      if (response.ok && result.success && result.qrcode && result.copiacola) {
        console.log("✅ DADOS PIX RECEBIDOS COM SUCESSO!")
        setPixData({
          orderId,
          qrcode: result.qrcode,
          copiacola: result.copiacola,
          amount: result.amount || amount,
          pix_payment_link: result.pix_payment_link,
        })
        setIsLoading(false)
      } else if (response.status === 202) {
        // PIX ainda sendo gerado, tentar novamente
        console.log("⏳ PIX ainda sendo gerado, tentando novamente...")
        if (retryCount < 5) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1)
            fetchPixData(orderId, amount)
          }, 3000)
        } else {
          setError("O PIX está demorando para ser gerado. Tente recarregar a página ou fazer um novo pedido.")
          setIsLoading(false)
        }
      } else {
        // Erro na API ou dados não disponíveis
        console.error("❌ ERRO AO BUSCAR DADOS PIX")
        console.error("Response:", result)

        if (!result.success && (result.error?.includes("PIX ainda está sendo gerado") || response.status === 202)) {
          // Ainda está sendo gerado
          if (retryCount < 5) {
            setTimeout(() => {
              setRetryCount((prev) => prev + 1)
              fetchPixData(orderId, amount)
            }, 3000)
          } else {
            setError("Erro ao gerar PIX. Tente novamente ou volte ao checkout.")
            setIsLoading(false)
          }
        } else {
          setError("Erro ao gerar PIX. Tente novamente ou volte ao checkout.")
          setIsLoading(false)
        }
      }
    } catch (error) {
      console.error("=== ERRO NA REQUISIÇÃO PIX-STATUS ===")
      console.error("Error:", error)
      setError("Erro ao carregar dados do PIX. Tente novamente.")
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        setCopyFeedback("Código copiado!")
        setTimeout(() => setCopyFeedback(""), 3000)
      }
    } catch (err) {
      console.error("Erro ao copiar:", err)
      setCopyFeedback("Erro ao copiar")
      setTimeout(() => setCopyFeedback(""), 3000)
    }
  }

  const handleRetry = () => {
    if (pixData?.orderId) {
      setRetryCount(0)
      fetchPixData(pixData.orderId, pixData.amount)
    } else {
      // Se não temos orderId, tentar pegar dos parâmetros novamente
      const orderId = searchParams.get("orderId")
      const amount = searchParams.get("amount")
      if (orderId && amount) {
        setRetryCount(0)
        fetchPixData(orderId, Number(amount))
      }
    }
  }

  const handleBackToCheckout = () => {
    router.push("/checkout")
  }

  // Não renderizar até estar montado
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Carregando...</h2>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Gerando PIX</h2>
          <p className="text-gray-600">⏳ Gerando QR Code PIX, aguarde...</p>
          {retryCount > 0 && <p className="text-sm text-gray-500 mt-2">Tentativa {retryCount + 1} de 6</p>}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Erro ao gerar PIX</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <Button onClick={handleRetry} className="flex-1 bg-green-500 hover:bg-green-600 text-white">
              <RotateCcw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
            <Button onClick={handleBackToCheckout} variant="outline" className="flex-1 bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao checkout
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Success state with PIX data
  if (!pixData) {
    return null
  }

  const totalDisplay = (pixData.amount / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* PIX Purchase Tracker - Dispara evento de compra quando PIX é exibido */}
      <PixPurchaseTracker />

      {/* Payment Status Checker - Verifica automaticamente o status do pagamento */}
      {pixData && (
        <PaymentStatusChecker
          orderId={pixData.orderId}
          amount={pixData.amount}
          onPaymentConfirmed={() => {
            console.log("🎉 Pagamento confirmado via verificação automática!")
          }}
        />
      )}

      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
            alt="Petloo Logo"
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-800">Pagamento via PIX</h1>
          <p className="text-gray-600">Escaneie o QR Code ou copie o código abaixo</p>
        </div>

        {/* PIX Payment Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* QR Code */}
          <div className="text-center mb-6">
            <img
              src={`data:image/png;base64,${pixData.qrcode}`}
              alt="QR Code PIX"
              className="max-w-[280px] w-full h-auto mx-auto border rounded-lg"
            />
          </div>

          {/* PIX Code */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Código PIX (Copia e Cola)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pixData.copiacola}
                readOnly
                className="flex-1 p-3 border rounded-lg bg-gray-50 text-sm font-mono"
              />
              <Button
                onClick={() => copyToClipboard(pixData.copiacola)}
                className="bg-green-500 hover:bg-green-600 text-white px-4"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            {copyFeedback && (
              <p className={`text-sm mt-1 ${copyFeedback.includes("copiado") ? "text-green-600" : "text-red-600"}`}>
                {copyFeedback}
              </p>
            )}
          </div>

          {/* Payment Link (if available) */}
          {pixData.pix_payment_link && (
            <div className="mb-6">
              <Button
                onClick={() => window.open(pixData.pix_payment_link, "_blank")}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                Abrir no app do banco
              </Button>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700">Produto:</span>
              <span className="text-sm text-gray-600">Tag rastreamento Petloo + App</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700">Valor:</span>
              <span className="font-bold text-green-600 text-lg">{totalDisplay}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">ID do pedido:</span>
              <span className="text-sm text-gray-600 font-mono">{pixData.orderId}</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-blue-800 mb-3">Como pagar:</h4>
            <ol className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Abra o app do seu banco ou carteira digital</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Escaneie o QR Code ou cole o código PIX</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Confirme o pagamento no valor de {totalDisplay}</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Aguarde a confirmação por email</span>
              </li>
            </ol>
          </div>

          {/* Expiration Warning */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-6">
            <p className="text-yellow-800 text-sm">
              ⏰ <strong>Importante:</strong> O PIX tem prazo de até 30 minutos para compensar. Após o pagamento, você
              receberá a confirmação por email.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          {/* Botão principal - Já efetuei o pagamento */}
          <Link href="/obrigado" className="block">
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-4 text-lg font-semibold">
              <CheckCircle className="w-5 h-5 mr-2" />
              Já efetuei o pagamento
            </Button>
          </Link>

          {/* Botões secundários */}
          <div className="flex gap-3">
            <Button onClick={handleBackToCheckout} variant="outline" className="flex-1 bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao checkout
            </Button>
            <Button onClick={() => router.push("/")} variant="outline" className="flex-1 bg-transparent">
              <RotateCcw className="w-4 h-4 mr-2" />
              Novo pedido
            </Button>
          </div>
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
