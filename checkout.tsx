"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js"
import { fetchAddressByCEP } from "@/utils/fetchAddressByCEP"
import { useRouter } from "next/navigation"
import InitiateCheckoutTracker from "@/components/InitiateCheckoutTracker"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Mask functions for credit card fields
const formatCardNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, "")
  const match = cleaned.match(/(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})/)
  if (match) {
    return [match[1], match[2], match[3], match[4]].filter(Boolean).join(" ")
  }
  return cleaned
}

const formatExpiryDate = (value: string) => {
  const cleaned = value.replace(/\D/g, "")
  if (cleaned.length >= 2) {
    const month = cleaned.substring(0, 2)
    const year = cleaned.substring(2, 4)

    // Validate month (01-12)
    if (Number.parseInt(month) > 12) {
      return "12/" + year
    }
    if (Number.parseInt(month) === 0) {
      return "01/" + year
    }

    return month + (year ? "/" + year : "")
  }
  return cleaned
}

const formatCVV = (value: string) => {
  return value.replace(/\D/g, "").substring(0, 3)
}

const getCardType = (number: string) => {
  const cleaned = number.replace(/\D/g, "")
  if (cleaned.match(/^4/)) return "visa"
  if (cleaned.match(/^5[1-5]/)) return "mastercard"
  if (cleaned.match(/^3[47]/)) return "amex"
  return "unknown"
}

// Stripe Card Element styles
const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#9e2146",
    },
  },
}

function OrderSummaryContent({
  quantity,
  setQuantity,
  shippingMethod,
  addressFound,
}: { quantity: number; setQuantity: (q: number) => void; shippingMethod: string; addressFound: boolean }) {
  // Calculate shipping cost only if address is found - VALOR FIXO R$ 18,87
  const getShippingCost = () => {
    if (!addressFound) return 0
    return 18.87 // Valor fixo conforme solicitado
  }

  const shippingCost = getShippingCost()
  const subtotal = shippingCost
  const total = subtotal

  return (
    <div className="space-y-6">
      {/* Product 1 */}
      <div className="flex gap-4">
        <img
          src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Fotos%20da%20LP/image%20594-rIMxV2I0SZADJI938HxomgyWIUjTGg.png"
          alt="Tag rastreamento Petloo + App"
          className="w-20 h-20 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h3 className="font-medium">Tag rastreamento Petloo + App</h3>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full border flex items-center justify-center"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full border flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold">R$ 0,00</p>
        </div>
      </div>

      {/* Coupon */}
      <div className="border-t pt-4">
        <p className="text-sm mb-2">Tem cupom de desconto ou vale presente?</p>
        <div className="flex gap-2">
          <Input placeholder="Código do cupom" className="flex-1" />
          <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6">Aplicar</Button>
        </div>
      </div>

      {/* Totals */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>R$ {total.toFixed(2).replace(".", ",")}</span>
        </div>
        <p className="text-sm text-gray-600">Em até 12x no cartão de crédito</p>
      </div>
    </div>
  )
}

function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState("credit")

  const [addressData, setAddressData] = useState({
    cep: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
  })
  const [addressFound, setAddressFound] = useState(false)
  const [shippingMethod, setShippingMethod] = useState("standard")

  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  })

  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [pixPaymentData, setPixPaymentData] = useState<{
    qr_code: string
    qr_code_url: string
    order_id: string
    valor_formatted: string
    expires_at: string
  } | null>(null)
  const [showPixPayment, setShowPixPayment] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState("")

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return value
  }

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/)
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`
    }
    return value
  }

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    const match = cleaned.match(/^(\d{5})(\d{3})$/)
    if (match) {
      return `${match[1]}-${match[2]}`
    }
    return value
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback("Código copiado!")
      setTimeout(() => setCopyFeedback(""), 3000)
    } catch (err) {
      console.error("Erro ao copiar:", err)
      setCopyFeedback("Erro ao copiar")
      setTimeout(() => setCopyFeedback(""), 3000)
    }
  }

  const handleCheckout = async () => {
    if (!stripe || !elements) {
      console.error("Stripe não foi carregado")
      return
    }

    setIsProcessing(true)
    setCheckoutMessage(null)

    try {
      // Validar campos obrigatórios
      const email = (document.getElementById("email") as HTMLInputElement)?.value
      const name = (document.getElementById("name") as HTMLInputElement)?.value
      const phone = (document.getElementById("phone") as HTMLInputElement)?.value
      const cpf = (document.getElementById("cpf") as HTMLInputElement)?.value
      const number = (document.getElementById("number") as HTMLInputElement)?.value

      console.log("=== DADOS DO CHECKOUT ===")
      console.log("Cliente:", { name, email, phone: phone?.replace(/\D/g, "") })
      console.log("Método de pagamento:", paymentMethod)
      console.log("Produto: Tag rastreamento Petloo + App - R$ 18,87")

      if (!email || !name || !phone || !cpf || !addressFound || !number) {
        setCheckoutMessage({ type: "error", text: "Por favor, preencha todos os campos obrigatórios." })
        return
      }

      if (paymentMethod === "pix") {
        // Processar pagamento PIX - VALOR FIXO 1887 centavos (R$ 18,87)
        const pixData = {
          name,
          email,
          cpf: cpf.replace(/\D/g, ""),
          phone: phone.replace(/\D/g, ""),
          address: {
            cep: addressData.cep.replace(/\D/g, ""),
            street: addressData.street,
            number: number,
            complement: (document.getElementById("complement") as HTMLInputElement)?.value || "",
            district: addressData.neighborhood,
            city: addressData.city,
            state: addressData.state,
          },
          shipping_price: 1887, // Valor fixo conforme solicitado
        }

        console.log("=== DADOS ENVIADOS PARA PIX API ===")
        console.log("PIX Data:", JSON.stringify(pixData, null, 2))

        const response = await fetch("/api/pix", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pixData),
        })

        const result = await response.json()
        console.log("=== RESPOSTA DA PIX API ===")

        if (!response.ok) {
          throw new Error(result.error || "Erro ao gerar pagamento via PIX. Tente novamente.")
        }

        // Verificar se temos os dados PIX diretamente na resposta
        if (result.success && result.qrcode && result.copiacola) {
          console.log("✅ DADOS PIX RECEBIDOS DIRETAMENTE!")
          console.log("QR Code:", result.qrcode ? "✅ Presente" : "❌ Ausente")
          console.log("Copia e Cola:", result.copiacola ? "✅ Presente" : "❌ Ausente")

          // Salvar dados PIX no sessionStorage para evitar URL muito longa
          const pixData = {
            orderId: result.order_id,
            amount: result.amount,
            qrcode: result.qrcode,
            copiacola: result.copiacola,
            expiration_date: result.expiration_date || "",
          }

          sessionStorage.setItem("pixPaymentData", JSON.stringify(pixData))

          // Redirecionar apenas com o order ID
          router.push(`/pix-payment?orderId=${result.order_id}&amount=${result.amount}`)
        } else {
          // Fallback para o fluxo antigo se necessário
          const orderId = result.order_id
          const amount = result.amount || 1887

          if (!orderId) {
            throw new Error("ID do pedido não foi retornado pela API")
          }

          console.log("=== REDIRECIONANDO PARA PIX PAYMENT ===")
          console.log("Order ID:", orderId)
          console.log("Amount:", amount)

          router.push(`/pix-payment?orderId=${orderId}&amount=${amount}`)
        }
      } else {
        // Processar pagamento com cartão (código existente)
        const cardElement = elements.getElement(CardElement)
        if (!cardElement) {
          setCheckoutMessage({ type: "error", text: "Elemento do cartão não encontrado." })
          return
        }

        // Preparar dados para envio (sem dados do cartão)
        const checkoutData = {
          name,
          email,
          cpf: cpf.replace(/\D/g, ""),
          telefone: phone.replace(/\D/g, ""),
          cep: addressData.cep.replace(/\D/g, ""),
          endereco: addressData.street,
          numero: number,
          bairro: addressData.neighborhood,
          cidade: addressData.city,
          estado: addressData.state,
          complemento: (document.getElementById("complement") as HTMLInputElement)?.value || "",
          shipping_price: 1887, // Valor fixo também para cartão
        }

        console.log("Dados enviados para API:", checkoutData)

        // Chamar API de checkout
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(checkoutData),
        })

        const result = await response.json()
        console.log("Resposta da API:", result)

        if (!response.ok) {
          throw new Error(result.error || "Erro no processamento do pagamento")
        }

        // Processar pagamento com cartão usando Stripe
        console.log("Confirmando pagamento com client_secret:", result.client_secret)

        const { error, paymentIntent } = await stripe.confirmCardPayment(result.client_secret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: name,
              email: email,
              phone: phone.replace(/\D/g, ""),
            },
          },
        })

        console.log("=== RESPOSTA DO STRIPE ===")
        console.log("Error:", error)
        console.log("PaymentIntent:", paymentIntent)

        if (error) {
          console.error("Erro no pagamento:", error)
          setCheckoutMessage({
            type: "error",
            text: `Erro no pagamento: ${error.message}`,
          })
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
          console.log("✅ PAGAMENTO CONFIRMADO!")

          // Salvar dados do pedido para a página de obrigado
          const orderSummary = {
            orderId: paymentIntent.id,
            customerName: name,
            customerEmail: email,
            amount: 1887,
            paymentMethod: "Cartão de Crédito",
          }

          sessionStorage.setItem("orderSummary", JSON.stringify(orderSummary))

          // Redirecionar para página de obrigado
          router.push("/obrigado")
        } else {
          console.log("Status do pagamento:", paymentIntent?.status)
          setCheckoutMessage({
            type: "error",
            text: "Pagamento não foi processado. Tente novamente.",
          })
        }
      }
    } catch (error) {
      console.error("Erro no checkout:", error)
      setCheckoutMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro interno. Tente novamente.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Initiate Checkout Tracker - Fires when checkout page loads */}
      <InitiateCheckoutTracker />

      {/* Alert Banner */}
      <div className="bg-red-500 text-white text-center py-2 px-4 text-sm">
        <strong>ATENÇÃO:</strong> O prazo de entrega dos produtos personalizados inclui o tempo de frete + o prazo de
        produção (2 a 3 semanas).
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Left Column - Forms (Desktop) / Main Content (Mobile) */}
          <div className="lg:order-1">
            {/* Mobile Order Summary Toggle */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
                className="w-full flex items-center justify-between p-4 bg-white border rounded-lg"
              >
                <span className="font-medium">Resumo do pedido</span>
                {isOrderSummaryOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {isOrderSummaryOpen && (
                <div className="mt-4 p-4 bg-white border rounded-lg">
                  <OrderSummaryContent
                    quantity={quantity}
                    setQuantity={setQuantity}
                    shippingMethod={shippingMethod}
                    addressFound={addressFound}
                  />
                </div>
              )}
            </div>

            {/* Petloo Logo */}
            <div className="mb-8 text-center lg:text-left">
              <img
                src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
                alt="Petloo Logo"
                className="h-12 mx-auto lg:mx-0"
              />
            </div>

            {/* Personal Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Informações Pessoais</h2>
              <p className="text-sm text-gray-600 mb-4">Para quem devemos entregar o pedido?</p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    E-mail
                  </Label>
                  <Input id="email" type="email" placeholder="Digite seu e-mail" className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nome completo
                  </Label>
                  <Input id="name" placeholder="Digite seu nome completo" className="mt-1" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Celular
                    </Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      className="mt-1"
                      onChange={(e) => {
                        e.target.value = formatPhone(e.target.value)
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf" className="text-sm font-medium">
                      CPF
                    </Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      className="mt-1"
                      onChange={(e) => {
                        e.target.value = formatCPF(e.target.value)
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Informações de Entrega</h2>
              <p className="text-sm text-gray-600 mb-4">Para onde devemos entregar o pedido?</p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cep" className="text-sm font-medium">
                    CEP
                  </Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      placeholder="99999-999"
                      className={`mt-1 ${addressFound ? "border-green-500 bg-green-50" : "bg-blue-50"}`}
                      value={addressData.cep}
                      onChange={(e) => {
                        const formatted = formatCEP(e.target.value)
                        setAddressData((prev) => ({ ...prev, cep: formatted }))
                        fetchAddressByCEP(formatted).then((address) => {
                          if (address) {
                            setAddressData(address)
                            setAddressFound(true)
                          } else {
                            setAddressFound(false)
                          }
                        })
                      }}
                    />
                    {addressFound && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-green-500">✅</span>
                      </div>
                    )}
                  </div>
                  {addressFound && <p className="text-green-600 text-sm mt-1">Endereço encontrado com sucesso</p>}
                </div>

                {addressFound && (
                  <>
                    <div>
                      <Label htmlFor="street" className="text-sm font-medium">
                        Endereço
                      </Label>
                      <Input
                        id="street"
                        value={addressData.street}
                        className="mt-1 border-green-500 bg-green-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <Label htmlFor="neighborhood" className="text-sm font-medium">
                        Bairro
                      </Label>
                      <Input
                        id="neighborhood"
                        value={addressData.neighborhood}
                        className="mt-1 border-green-500 bg-green-50"
                        readOnly
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-sm font-medium">
                          Cidade
                        </Label>
                        <Input
                          id="city"
                          value={addressData.city}
                          className="mt-1 border-green-500 bg-green-50"
                          readOnly
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-sm font-medium">
                          Estado
                        </Label>
                        <Input
                          id="state"
                          value={addressData.state}
                          className="mt-1 border-green-500 bg-green-50"
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="number" className="text-sm font-medium">
                          Número
                        </Label>
                        <Input id="number" placeholder="Nº" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="complement" className="text-sm font-medium">
                          Complemento
                        </Label>
                        <Input id="complement" placeholder="Apto, bloco..." className="mt-1" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Shipping Method - REMOVIDO POIS VALOR É FIXO */}
            {addressFound && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-2">Método de envio</h2>
                <div className="space-y-3">
                  <div className="border-2 border-orange-300 bg-orange-50/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input type="radio" checked readOnly className="pointer-events-none" />
                        <div>
                          <label className="font-medium">Frete Padrão</label>
                          <p className="text-sm text-gray-600">15 a 20 dias (Produção) + 4 a 12 dias (Entrega)</p>
                        </div>
                      </div>
                      <span className="font-semibold">R$ 18,87</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Método de pagamento</h2>
              <p className="text-sm text-gray-600 mb-4">Escolha o seu método de pagamento abaixo</p>

              <div className="space-y-4">
                {/* Credit Card Option */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === "credit"
                      ? "border-orange-300 bg-orange-50/30"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setPaymentMethod("credit")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="credit"
                        name="payment"
                        value="credit"
                        checked={paymentMethod === "credit"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-orange-500 pointer-events-none"
                      />
                      <label htmlFor="credit" className="font-medium cursor-pointer">
                        Cartão de Crédito
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src="/placeholder.svg?height=20&width=100&text=Cards" alt="Payment Method" className="h-5" />
                      <span className="text-xs text-gray-500">E muito mais...</span>
                    </div>
                  </div>

                  {paymentMethod === "credit" && (
                    <div className="space-y-4">
                      {/* Stripe CardElement for secure processing */}
                      <div className="p-3 border rounded-lg bg-gray-50">
                        <Label className="text-sm font-medium mb-2 block text-gray-600">
                          Processamento seguro (preencha os dados do cartão aqui)
                        </Label>
                        <CardElement options={cardElementOptions} />
                      </div>

                      <select className="w-full p-3 border rounded-lg bg-white">
                        <option>1x de R$ 18,87</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* PIX Option */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === "pix"
                      ? "border-orange-300 bg-orange-50/30"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setPaymentMethod("pix")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="pix"
                        name="payment"
                        value="pix"
                        checked={paymentMethod === "pix"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="pointer-events-none"
                      />
                      <label htmlFor="pix" className="font-medium cursor-pointer">
                        PIX
                      </label>
                    </div>
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pix-pQeEaHw1QkFcUBY4A45g43gFx34OWl.svg"
                      alt="PIX"
                      className="h-5"
                    />
                  </div>

                  {/* PIX Details - Show when selected */}
                  {paymentMethod === "pix" && (
                    <div className="mt-4 pt-4 border-t border-orange-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">PIX</h3>
                        <img
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pix-pQeEaHw1QkFcUBY4A45g43gFx34OWl.svg"
                          alt="PIX"
                          className="h-5"
                        />
                      </div>

                      <p className="text-sm text-gray-700 mb-4">Clique em "Finalizar Compra" para gerar o PIX.</p>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2">Informações sobre o pagamento via PIX:</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>• Valor à vista R$ 18,87;</li>
                          <li>
                            • <strong>Não pode ser parcelado!</strong> Use cartão de crédito para parcelar sua compra;
                          </li>
                          <li>
                            • Prazo de até <strong>30 minutos</strong> para compensar.
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Checkbox id="save-info" defaultChecked />
                <label htmlFor="save-info" className="text-sm text-gray-600">
                  Salvar minhas informações com segurança para compras futuras.
                </label>
              </div>
            </div>

            {/* Finalize Button */}
            <Button
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 text-lg font-semibold mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCheckout}
              disabled={isProcessing || !stripe || showPixPayment}
            >
              {isProcessing ? (paymentMethod === "pix" ? "Gerando PIX..." : "Processando...") : "Finalizar compra"}
            </Button>

            {checkoutMessage && (
              <div
                className={`p-4 rounded-lg mb-4 text-center ${
                  checkoutMessage.type === "success"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                {checkoutMessage.text}
              </div>
            )}

            {/* Terms and Security */}
            <div className="text-center text-sm text-gray-600 space-y-2">
              <p>
                Ao prosseguir, você concorda com os <span className="text-orange-500 underline">Termos de Serviço</span>
              </p>
              <p>Petloo - Todos os direitos reservados</p>
              <div className="flex justify-center mt-4">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-KSAVnVrLk1AvbhF07h55u42sGHYCX4.png"
                  alt="Site Seguro"
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary (Desktop Only) */}
          <div className="hidden lg:block lg:order-2">
            <div className="bg-white p-6 rounded-lg border sticky top-8">
              <OrderSummaryContent
                quantity={quantity}
                setQuantity={setQuantity}
                shippingMethod={shippingMethod}
                addressFound={addressFound}
              />
            </div>
          </div>
        </div>
        {/* PIX Payment Interface */}
        {showPixPayment && pixPaymentData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="text-center space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Pagamento via PIX</h2>

                <div className="space-y-4">
                  <p className="text-gray-600">Escaneie o QR Code abaixo com seu banco ou copie o código manual</p>

                  {/* QR Code */}
                  <div className="flex justify-center">
                    <img
                      src={`data:image/png;base64,${pixPaymentData.qr_code}`}
                      alt="QR Code PIX"
                      className="max-w-[300px] w-full h-auto border rounded-lg"
                    />
                  </div>

                  {/* PIX Code */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Código PIX (Copia e Cola)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pixPaymentData.qr_code}
                        readOnly
                        className="flex-1 p-3 border rounded-lg bg-gray-50 text-sm font-mono"
                      />
                      <Button
                        onClick={() => copyToClipboard(pixPaymentData.qr_code)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4"
                      >
                        Copiar
                      </Button>
                    </div>
                    {copyFeedback && (
                      <p className={`text-sm ${copyFeedback.includes("copiado") ? "text-green-600" : "text-red-600"}`}>
                        {copyFeedback}
                      </p>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Valor:</span>
                      <span className="font-bold text-green-600">{pixPaymentData.valor_formatted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">ID do pedido:</span>
                      <span className="text-sm text-gray-600">{pixPaymentData.order_id}</span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="text-left bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Como pagar:</h4>
                    <ol className="text-sm text-blue-700 space-y-1">
                      <li>1. Abra o app do seu banco</li>
                      <li>2. Escaneie o QR Code ou cole o código PIX</li>
                      <li>3. Confirme o pagamento</li>
                      <li>4. Aguarde a confirmação por email</li>
                    </ol>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setShowPixPayment(false)
                        setPixPaymentData(null)
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Voltar ao checkout
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      Novo pedido
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  )
}
