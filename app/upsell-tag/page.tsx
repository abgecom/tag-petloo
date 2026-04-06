"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CreditCard, Shield, Clock, Gift, AlertCircle, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

// ============================================
// PÁGINA UPSELL-TAG
// Exibida após pagamento PIX para cadastrar cartão
// e criar assinatura com 30 dias de trial grátis
// ============================================

interface OrderData {
  order_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_cpf: string
  customer_address: string
  customer_cep: string
  customer_city: string
  customer_state: string
}

function UpsellTagContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [isLoadingOrder, setIsLoadingOrder] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state para cartão
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Pegar parâmetros da URL
  const orderId = searchParams.get("orderId")

  // Buscar dados do pedido no Supabase via API
  useEffect(() => {
    if (!orderId) {
      console.log("[Upsell Tag] orderId não fornecido na URL")
      setIsLoadingOrder(false)
      return
    }

    console.log("[Upsell Tag] Buscando pedido:", orderId)

    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.order) {
          console.log("[Upsell Tag] Pedido encontrado:", data.order.customer_name)
          setOrderData({
            order_id: data.order.order_id,
            customer_name: data.order.customer_name,
            customer_email: data.order.customer_email,
            customer_phone: data.order.customer_phone,
            customer_cpf: data.order.customer_cpf,
            customer_address: data.order.customer_address,
            customer_cep: data.order.customer_cep,
            customer_city: data.order.customer_city,
            customer_state: data.order.customer_state,
          })
        } else {
          console.log("[Upsell Tag] Pedido não encontrado")
        }
        setIsLoadingOrder(false)
      })
      .catch((err) => {
        console.error("[Upsell Tag] Erro ao buscar pedido:", err)
        setIsLoadingOrder(false)
      })
  }, [orderId])

  // Formatadores de campos do cartão
  const formatCardNumber = (value: string) => {
    if (!value) return ""
    const cleaned = value.replace(/\D/g, "").substring(0, 16)
    const parts = []
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.substring(i, i + 4))
    }
    return parts.join(" ")
  }

  const formatExpiry = (value: string) => {
    if (!value) return ""
    const cleaned = value.replace(/\D/g, "").substring(0, 4)
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + "/" + cleaned.substring(2)
    }
    return cleaned
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let processedValue = value

    if (name === "cardNumber") {
      processedValue = formatCardNumber(value)
    } else if (name === "cardExpiry") {
      processedValue = formatExpiry(value)
    } else if (name === "cardName") {
      processedValue = value.toUpperCase()
    } else if (name === "cardCvv") {
      processedValue = value.replace(/\D/g, "").substring(0, 4)
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }))

    // Limpar erro do campo ao editar
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Validação do formulário
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, "").length < 13) {
      errors.cardNumber = "Número de cartão inválido"
    }
    if (!formData.cardName || formData.cardName.trim().length < 3) {
      errors.cardName = "Nome no cartão é obrigatório"
    }
    if (!formData.cardExpiry || !/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) {
      errors.cardExpiry = "Data de validade inválida"
    }
    if (!formData.cardCvv || formData.cardCvv.length < 3) {
      errors.cardCvv = "CVV inválido"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    if (!orderData) {
      setError("Dados do pedido não encontrados. Tente novamente.")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Extrair dados do cliente
      const telefone = (orderData.customer_phone || "").replace(/\D/g, "")
      const cpf = (orderData.customer_cpf || "").replace(/\D/g, "")
      const cep = (orderData.customer_cep || "").replace(/\D/g, "")

      // Montar dados do cliente para a API
      const customerPayload = {
        name: orderData.customer_name || "",
        email: orderData.customer_email || "",
        document: cpf,
        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: telefone.substring(0, 2) || "11",
            number: telefone.substring(2) || "999999999",
          },
        },
        address: {
          line_1: orderData.customer_address || "Endereço não informado",
          line_2: "",
          zip_code: cep || "00000000",
          city: orderData.customer_city || "São Paulo",
          state: orderData.customer_state || "SP",
          country: "BR",
        },
      }

      // Montar dados do cartão
      const [expMonth, expYear] = formData.cardExpiry.split("/")
      const cardPayload = {
        number: formData.cardNumber.replace(/\s/g, ""),
        holder_name: formData.cardName,
        exp_month: parseInt(expMonth, 10),
        exp_year: parseInt(`20${expYear}`, 10),
        cvv: formData.cardCvv,
        billing_address: {
          line_1: orderData.customer_address || "Endereço não informado",
          line_2: "",
          zip_code: cep || "00000000",
          city: orderData.customer_city || "São Paulo",
          state: orderData.customer_state || "SP",
          country: "BR",
        },
      }

      console.log("[Upsell Tag] Enviando dados para API...")

      // Chamar a rota única de upsell
      const response = await fetch("/api/upsell-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customerPayload,
          card: cardPayload,
          orderId: orderId,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erro ao processar cadastro do cartão")
      }

      console.log("[Upsell Tag] Assinatura criada com sucesso:", result.subscriptionId)
      setSuccess(true)

      // Redirecionar para página de obrigado após 2 segundos
      setTimeout(() => {
        // Salvar dados para a página de obrigado
        const orderSummary = {
          orderId: orderId,
          customerName: orderData.customer_name,
          customerEmail: orderData.customer_email,
          paymentMethod: "PIX",
          subscriptionId: result.subscriptionId,
        }
        sessionStorage.setItem("orderSummary", JSON.stringify(orderSummary))

        router.push("/obrigado")
      }, 2000)
    } catch (err) {
      console.error("[Upsell Tag] Erro:", err)
      setError(err instanceof Error ? err.message : "Erro ao processar. Tente novamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Recusar oferta — ir direto pro obrigado
  const handleDecline = () => {
    const orderSummary = {
      orderId: orderId,
      customerName: orderData?.customer_name || "",
      customerEmail: orderData?.customer_email || "",
      paymentMethod: "PIX",
    }
    sessionStorage.setItem("orderSummary", JSON.stringify(orderSummary))
    router.push("/obrigado")
  }

  // ============================================
  // ESTADOS DE LOADING / SUCESSO
  // ============================================

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cartão cadastrado com sucesso!</h2>
          <p className="text-gray-600 mb-4">
            Sua assinatura do App Petloo foi ativada com 30 dias grátis para testar!
          </p>
          <p className="text-sm text-gray-500">Redirecionando...</p>
        </div>
      </div>
    )
  }

  // ============================================
  // FORMULÁRIO PRINCIPAL
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8F6] to-white py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header com oferta especial */}
        <div className="bg-orange-500 text-white rounded-t-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Gift className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Oferta Exclusiva</span>
          </div>
          <h1 className="text-xl font-bold">Ative o App Petloo GRÁTIS por 30 dias!</h1>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-b-xl shadow-lg overflow-hidden">
          {/* Imagem do produto */}
          <div className="relative h-48 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_sp1jwfsp1jwfsp1j.png-mWfJvbDukdwhtbQveewIYC6X8CzGRW.jpeg"
              alt="Kit Petloo Completo"
              className="h-40 w-auto object-contain"
            />
          </div>

          {/* Copy persuasiva */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                Parabéns pela compra, {orderData?.customer_name?.split(" ")[0] || ""}!
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Para ativar o rastreamento da sua Tag Petloo, cadastre seu cartão abaixo.
                O app inclui rastreamento em tempo real, zona segura, RG digital, cartão de vacinas e seguro saúde.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium mb-1">
                      Nenhuma cobrança será feita agora!
                    </p>
                    <p className="text-xs text-amber-700">
                      Você terá <strong>30 dias grátis</strong> para testar. Se não gostar,
                      é só cancelar antes do término do período de teste e você não pagará nada.
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefícios */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-700">Rastreamento GPS <strong>em tempo real</strong></p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-700"><strong>30 dias grátis</strong> para testar</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-700">Cancele quando quiser, <strong>sem burocracia</strong></p>
                </div>
              </div>

              {/* Preço após trial */}
              <div className="bg-gray-50 rounded-lg p-4 text-center mb-6">
                <p className="text-xs text-gray-500 mb-1">Após o período de teste</p>
                <p className="text-lg font-bold text-gray-900">
                  R$ 30,90<span className="text-sm font-normal text-gray-500">/mês</span>
                </p>
              </div>
            </div>

            {/* Formulário do cartão */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Dados do Cartão</span>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Número do cartão */}
              <div>
                <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700 mb-1">
                  Número do Cartão
                </Label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className={`w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    formErrors.cardNumber ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {formErrors.cardNumber && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.cardNumber}</p>
                )}
              </div>

              {/* Nome no cartão */}
              <div>
                <Label htmlFor="cardName" className="text-sm font-medium text-gray-700 mb-1">
                  Nome no Cartão
                </Label>
                <input
                  type="text"
                  id="cardName"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  placeholder="NOME COMO ESTÁ NO CARTÃO"
                  className={`w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    formErrors.cardName ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {formErrors.cardName && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.cardName}</p>
                )}
              </div>

              {/* Validade e CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cardExpiry" className="text-sm font-medium text-gray-700 mb-1">
                    Validade
                  </Label>
                  <input
                    type="text"
                    id="cardExpiry"
                    name="cardExpiry"
                    value={formData.cardExpiry}
                    onChange={handleInputChange}
                    placeholder="MM/AA"
                    maxLength={5}
                    className={`w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      formErrors.cardExpiry ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {formErrors.cardExpiry && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.cardExpiry}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cardCvv" className="text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </Label>
                  <input
                    type="text"
                    id="cardCvv"
                    name="cardCvv"
                    value={formData.cardCvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength={4}
                    className={`w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      formErrors.cardCvv ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {formErrors.cardCvv && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.cardCvv}</p>
                  )}
                </div>
              </div>

              {/* Botão de submit */}
              <Button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-md"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    Ativar 30 dias grátis
                  </>
                )}
              </Button>

              {/* Segurança */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Pagamento 100% seguro — Dados criptografados</span>
              </div>
            </form>

            {/* Botão de recusa */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <button
                onClick={handleDecline}
                className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
              >
                Não quero ativar o rastreamento agora
              </button>
            </div>
          </div>
        </div>

        {/* Informação adicional */}
        <p className="text-xs text-gray-400 text-center mt-4 px-4">
          Ao cadastrar seu cartão, você concorda com os termos de uso do serviço Petloo.
          A primeira cobrança ocorrerá apenas após 30 dias.
        </p>
      </div>
    </div>
  )
}

// ============================================
// EXPORT COM SUSPENSE (necessário por usar useSearchParams)
// ============================================

export default function UpsellTagPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      }
    >
      <UpsellTagContent />
    </Suspense>
  )
}
