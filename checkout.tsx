"use client"

import { useState, useEffect, Suspense } from "react"
import { ChevronUp, ChevronDown, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { loadStripe } from "@stripe/stripe-js"
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js"
import { fetchAddressByCEP } from "@/utils/fetchAddressByCEP"
import { useRouter } from "next/navigation"
import InitiateCheckoutTracker from "@/components/InitiateCheckoutTracker"
import { Elements } from "@stripe/react-stripe-js"

// Initialize Stripe with preload
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
  // Preload Stripe.js to improve performance
  stripeAccount: undefined,
})

// Preload Stripe immediately
if (typeof window !== "undefined") {
  stripePromise
}

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
  // Calculate shipping cost based on shipping method
  const getShippingCost = () => {
    // Verificar se é produto personalizado
    const personalizedData = sessionStorage.getItem("personalizedProduct")
    if (personalizedData) {
      try {
        const data = JSON.parse(personalizedData)
        const basePrice = data.amount / 100 // R$ 39,90

        if (!addressFound) return basePrice

        // Para produto personalizado: frete grátis padrão, frete expresso R$ 10,52
        if (shippingMethod === "express") {
          return basePrice + 10.52 // R$ 39,90 + R$ 10,52 = R$ 50,42
        }
        return basePrice // R$ 39,90 (frete grátis)
      } catch (error) {
        console.error("Erro ao parsear produto personalizado:", error)
      }
    }

    // Lógica original para produtos não personalizados
    if (!addressFound) return 0
    return shippingMethod === "express" ? 29.39 : 18.87
  }

  const shippingCost = getShippingCost()
  const personalizedProductData = sessionStorage.getItem("personalizedProduct")
  let productPrice = 0
  let shippingPrice = 0

  if (personalizedProductData) {
    try {
      const data = JSON.parse(personalizedProductData)
      productPrice = data.amount / 100 // R$ 39,90
      shippingPrice = shippingMethod === "express" ? 10.52 : 0 // Frete grátis ou R$ 10,52
    } catch (error) {
      console.error("Erro ao parsear produto personalizado:", error)
    }
  } else {
    // Para produto genérico: produto grátis, cliente paga apenas o frete
    productPrice = 0
    shippingPrice = addressFound ? (shippingMethod === "express" ? 29.39 : 18.87) : 0
  }

  const subtotal = productPrice + shippingPrice
  const total = subtotal

  const productData = personalizedProductData ? JSON.parse(personalizedProductData) : null
  const productName = productData ? productData.name : "Tag rastreamento Petloo + App"

  // Definir a imagem baseada na cor escolhida
  let productImage =
    "https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Fotos%20da%20LP/image%20594-rIMxV2I0SZADJI938HxomgyWIUjTGg.png"

  if (productData) {
    if (productData.color === "orange") {
      productImage =
        "https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/ChatGPT%20Image%2010%20de%20jul.%20de%202025%2C%2019_05_16.png"
    } else if (productData.color === "purple") {
      productImage =
        "https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/ChatGPT%20Image%2010%20de%20jul.%20de%202025%2C%2019_05_18.png"
    }
  }

  return (
    <div className="space-y-6">
      {/* Product 1 */}
      <div className="flex gap-4">
        <img
          src={productImage || "/placeholder.svg"}
          alt="Tag rastreamento Petloo + App"
          className="w-20 h-20 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h3 className="font-medium">{productName}</h3>
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
          <p className="font-semibold">
            {personalizedProductData ? `R$ ${productPrice.toFixed(2).replace(".", ",")}` : "Grátis"}
          </p>
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
        {personalizedProductData && (
          <div className="flex justify-between">
            <span>Produto</span>
            <span className="font-semibold">R$ {productPrice.toFixed(2).replace(".", ",")}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Frete</span>
          <span className="font-semibold">
            {shippingPrice === 0 ? "Grátis" : `R$ ${shippingPrice.toFixed(2).replace(".", ",")}`}
          </span>
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

  // All hooks must be called before any conditional returns
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
  const [isLoading, setIsLoading] = useState(true)
  const [productInfo, setProductInfo] = useState<{
    type: string
    color: string
    amount: number
    sku: string
    petName?: string
  } | null>(null)

  // Initialize loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  // Handle URL params and personalized product data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isPersonalized = urlParams.get("personalized") === "true"

    if (isPersonalized) {
      const color = urlParams.get("color")
      const priceId = urlParams.get("priceId")
      const amount = urlParams.get("amount")
      const petName = urlParams.get("petName") // Obter nome do pet da URL

      if (color && priceId && amount) {
        const productData = {
          color,
          priceId,
          amount: Number(amount),
          name: `Tag ${color === "orange" ? "Laranja" : "Roxa"} Personalizada + App`,
          petName: petName ? decodeURIComponent(petName) : "", // Decodificar nome do pet
        }

        // Salvar no estado local também
        setProductInfo({
          type: "Tag Personalizada",
          color: color === "orange" ? "Laranja" : "Roxa",
          amount: Number(amount),
          sku: `TAG-PERSONALIZADA-${color.toUpperCase()}`,
          petName: petName ? decodeURIComponent(petName) : "", // Adicionar ao estado
        })

        if ("requestIdleCallback" in window) {
          requestIdleCallback(() => {
            sessionStorage.setItem("personalizedProduct", JSON.stringify(productData))
          })
        } else {
          setTimeout(() => {
            sessionStorage.setItem("personalizedProduct", JSON.stringify(productData))
          }, 0)
        }
      }
    } else {
      // Produto genérico
      setProductInfo({
        type: "Tag Genérica",
        color: "Não se aplica",
        amount: 1887, // Valor padrão
        sku: "TAG-APP-1887",
        petName: "", // Produto genérico não tem nome do pet
      })
    }
  }, [])

  // Mover esta função para dentro do CheckoutForm, antes do return
  const getShippingCost = () => {
    // Verificar se é produto personalizado
    const personalizedData = sessionStorage.getItem("personalizedProduct")
    if (personalizedData) {
      try {
        const data = JSON.parse(personalizedData)
        const basePrice = data.amount / 100 // R$ 39,90

        if (!addressFound) return basePrice

        // Para produto personalizado: frete grátis padrão, frete expresso R$ 10,52
        if (shippingMethod === "express") {
          return basePrice + 10.52 // R$ 39,90 + R$ 10,52 = R$ 50,42
        }
        return basePrice // R$ 39,90 (frete grátis)
      } catch (error) {
        console.error("Erro ao parsear produto personalizado:", error)
      }
    }

    // Lógica original para produtos não personalizados
    if (!addressFound) return 0
    return shippingMethod === "express" ? 29.39 : 18.87
  }

  // Função para salvar cookies para GTM
  const saveCookiesForGTM = (email: string, name: string, phone: string) => {
    if (typeof document !== "undefined") {
      // Dividir nome em primeiro e último nome
      const nameParts = name.trim().split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      // Salvar cookies com duração de 30 dias (2592000 segundos)
      const maxAge = "max-age=2592000"
      const path = "path=/"

      document.cookie = `ploo_email=${encodeURIComponent(email)}; ${path}; ${maxAge}`
      document.cookie = `ploo_first_name=${encodeURIComponent(firstName)}; ${path}; ${maxAge}`
      document.cookie = `ploo_last_name=${encodeURIComponent(lastName)}; ${path}; ${maxAge}`
      document.cookie = `ploo_phone=${encodeURIComponent(phone.replace(/\D/g, ""))}; ${path}; ${maxAge}`

      console.log("🍪 Cookies salvos para GTM:", {
        email: email,
        firstName: firstName,
        lastName: lastName,
        phone: phone.replace(/\D/g, ""),
      })
    }
  }

  // Função para disparar eventos de add_payment_info
  const handleAddressFound = () => {
    const value = 18.87 // Valor real do produto
    const items = [
      {
        item_id: "tag-petloo",
        item_name: "Tag rastreamento Petloo + App",
        category: "Pet Tracking",
        quantity: 1,
        price: 18.87,
      },
    ]

    // Obter dados do formulário
    const email = (document.getElementById("email") as HTMLInputElement)?.value || ""
    const name = (document.getElementById("name") as HTMLInputElement)?.value || ""
    const phone = (document.getElementById("phone") as HTMLInputElement)?.value || ""

    if (email && name && phone) {
      // Salvar cookies para GTM
      saveCookiesForGTM(email, name, phone)

      // Dividir nome para Meta Pixel
      const nameParts = name.trim().split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      if (typeof window !== "undefined") {
        // 📊 GA4 via GTM - Add Payment Info
        window.dataLayer = window.dataLayer || []
        window.dataLayer.push({
          event: "add_payment_info",
          ecommerce: {
            currency: "BRL",
            value: value,
            items: items,
          },
          // Dados adicionais do usuário
          user_data: {
            email: email,
            first_name: firstName,
            last_name: lastName,
            phone: phone.replace(/\D/g, ""),
          },
          page_location: window.location.href,
          timestamp: new Date().toISOString(),
        })

        console.log("📊 GTM Add Payment Info Event:", {
          event: "add_payment_info",
          value: value,
          currency: "BRL",
          items: items,
        })

        // 📱 Meta Pixel - AddPaymentInfo
        if (typeof window.fbq !== "undefined") {
          window.fbq("track", "AddPaymentInfo", {
            value: value,
            currency: "BRL",
            content_type: "product",
            content_ids: ["tag-petloo"],
            content_name: "Tag rastreamento Petloo + App",
            content_category: "Pet Tracking",
            num_items: 1,
            // Advanced Matching para Meta Pixel
            em: email,
            fn: firstName,
            ln: lastName,
            ph: phone.replace(/\D/g, ""),
          })

          console.log("📱 Meta Pixel AddPaymentInfo Event:", {
            value: value,
            currency: "BRL",
            em: email,
            fn: firstName,
            ln: lastName,
          })
        } else {
          console.warn("⚠️ Meta Pixel (fbq) not found - AddPaymentInfo event not sent")
        }
      }
    } else {
      console.warn("⚠️ Dados do formulário incompletos - eventos não disparados:", {
        email: !!email,
        name: !!name,
        phone: !!phone,
      })
    }
  }

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

      const personalizedProductData = sessionStorage.getItem("personalizedProduct")
      let productInfo = {
        amount: shippingMethod === "express" ? 2939 : 1887,
        name: "Tag rastreamento Petloo + App",
        sku: shippingMethod === "express" ? "TAG-APP-2939" : "TAG-APP-1887",
        type: "Tag Genérica",
        color: "Não se aplica",
      }

      if (personalizedProductData) {
        try {
          const data = JSON.parse(personalizedProductData)
          const baseAmount = data.amount // R$ 39,90 = 3990 centavos
          const expressShipping = 1052 // R$ 10,52 = 1052 centavos

          productInfo = {
            amount: shippingMethod === "express" ? baseAmount + expressShipping : baseAmount,
            name: data.name,
            sku: `TAG-PERSONALIZADA-${data.color.toUpperCase()}-${shippingMethod === "express" ? "EXPRESS" : "FREE"}`,
            type: "Tag Personalizada",
            color: data.color === "orange" ? "Laranja" : data.color === "purple" ? "Roxa" : data.color,
          }
        } catch (error) {
          console.error("Erro ao parsear produto personalizado:", error)
        }
      }

      if (paymentMethod === "pix") {
        // Processar pagamento PIX
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
          shipping_price: productInfo.amount, // Valor em centavos
          // 🎯 ADICIONAR DADOS DO PRODUTO
          product_type: productInfo.type,
          product_color: productInfo.color,
          product_quantity: quantity,
          product_sku: productInfo.sku,
          pet_name: productInfo.petName || "", // Adicionar nome do pet
        }

        console.log("=== DADOS ENVIADOS PARA PIX API ===")
        console.log("PIX Data:", JSON.stringify(pixData, null, 2))

        try {
          const response = await fetch("/api/pix", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(pixData),
          })

          console.log("=== RESPOSTA DA PIX API ===")
          console.log("Status:", response.status)
          console.log("Content-Type:", response.headers.get("content-type"))

          // Verificar se a resposta é JSON válido
          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await response.text()
            console.error("Resposta não é JSON:", textResponse)
            throw new Error("Erro no servidor. Resposta inválida recebida.")
          }

          const result = await response.json()
          console.log("Result:", JSON.stringify(result, null, 2))

          if (!response.ok) {
            throw new Error(result.error || `Erro HTTP ${response.status}: ${result.message || "Erro desconhecido"}`)
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
        } catch (fetchError) {
          console.error("Erro na requisição PIX:", fetchError)
          if (fetchError instanceof TypeError && fetchError.message.includes("Failed to fetch")) {
            throw new Error("Erro de conexão. Verifique sua internet e tente novamente.")
          }
          throw fetchError
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
          shipping_price: productInfo.amount, // Valor fixo também para cartão
          // 🎯 ADICIONAR DADOS DO PRODUTO
          product_type: productInfo.type,
          product_color: productInfo.color,
          product_quantity: quantity,
          product_sku: productInfo.sku,
          pet_name: productInfo.petName || "", // Adicionar nome do pet
        }

        console.log("Dados enviados para API:", checkoutData)

        try {
          // Chamar API de checkout
          const response = await fetch("/api/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(checkoutData),
          })

          console.log("Status da resposta:", response.status)
          console.log("Content-Type:", response.headers.get("content-type"))

          // Verificar se a resposta é JSON válido
          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await response.text()
            console.error("Resposta não é JSON:", textResponse)
            throw new Error("Erro no servidor. Resposta inválida recebida.")
          }

          const result = await response.json()
          console.log("Resposta da API:", result)

          if (!response.ok) {
            throw new Error(result.error || `Erro HTTP ${response.status}: ${result.message || "Erro desconhecido"}`)
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
        } catch (fetchError) {
          console.error("Erro na requisição checkout:", fetchError)
          if (fetchError instanceof TypeError && fetchError.message.includes("Failed to fetch")) {
            throw new Error("Erro de conexão. Verifique sua internet e tente novamente.")
          }
          throw fetchError
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

  // Show loading state with better animation and messaging
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Initiate Checkout Tracker - Fires when checkout page loads */}
        <InitiateCheckoutTracker />

        {/* Alert Banner - mesmo durante loading */}
        <div className="bg-red-500 text-white text-center py-2 px-4 text-sm">
          <strong>ATENÇÃO:</strong> O prazo de entrega dos produtos personalizados inclui o tempo de frete + o prazo de
          produção (2 a 3 semanas).
        </div>

        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="text-center max-w-md w-full">
            {/* Logo durante loading */}
            <div className="mb-8">
              <img
                src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
                alt="Petloo Logo"
                className="h-12 mx-auto mb-4"
              />
            </div>

            {/* Animação de loading mais elaborada */}
            <div className="relative mb-6">
              {/* Círculo principal */}
              <div className="w-16 h-16 mx-auto relative">
                <div className="absolute inset-0 border-4 border-orange-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
              </div>

              {/* Pontos animados */}
              <div className="flex justify-center mt-4 space-x-1">
                <div
                  className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>

            {/* Mensagens de loading */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-800">Preparando seu checkout</h2>
              <p className="text-gray-600">Carregando informações de pagamento seguro...</p>

              {/* Barra de progresso simulada */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{ width: "70%" }}></div>
              </div>

              <p className="text-sm text-gray-500 mt-3">
                ⚡ Aguarde alguns segundos, estamos preparando tudo para você
              </p>
            </div>

            {/* Ícones de segurança durante loading */}
            <div className="mt-8 flex justify-center items-center gap-4 opacity-60">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-KSAVnVrLk1AvbhF07h55u42sGHYCX4.png"
                alt="Site Seguro"
                className="h-8"
              />
              <div className="flex gap-2">
                <img
                  src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/visa-BRBd7AI7oDhyBwzy47g6H1kt5cjCOs.svg"
                  alt="Visa"
                  className="h-6"
                />
                <img
                  src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/mastercard-RHKlJLfpzUysKGBW778wrPcURdL1Vs.svg"
                  alt="Mastercard"
                  className="h-6"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
                            // 🎯 DISPARAR EVENTOS QUANDO ENDEREÇO FOR ENCONTRADO
                            setTimeout(() => {
                              handleAddressFound()
                            }, 500) // Pequeno delay para garantir que os campos estejam preenchidos
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

            {/* Shipping Method */}
            {addressFound && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-2">Método de envio</h2>
                <div className="space-y-3">
                  {(() => {
                    const personalizedData = sessionStorage.getItem("personalizedProduct")
                    const isPersonalized = !!personalizedData

                    if (isPersonalized) {
                      return (
                        <>
                          {/* Frete Grátis para produto personalizado */}
                          <div
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                              shippingMethod === "standard"
                                ? "border-green-300 bg-green-50/30"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setShippingMethod("standard")}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  id="standard"
                                  name="shipping"
                                  value="standard"
                                  checked={shippingMethod === "standard"}
                                  onChange={(e) => setShippingMethod(e.target.value)}
                                  className="pointer-events-none"
                                />
                                <div>
                                  <label htmlFor="standard" className="font-medium cursor-pointer">
                                    Frete Grátis
                                  </label>
                                  <p className="text-sm text-gray-600">
                                    15 a 20 dias (Produção) + 4 a 12 dias (Entrega)
                                  </p>
                                </div>
                              </div>
                              <span className="font-semibold text-green-600">Grátis</span>
                            </div>
                          </div>

                          {/* Frete Expresso para produto personalizado */}
                          <div
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                              shippingMethod === "express"
                                ? "border-orange-300 bg-orange-50/30"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setShippingMethod("express")}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  id="express"
                                  name="shipping"
                                  value="express"
                                  checked={shippingMethod === "express"}
                                  onChange={(e) => setShippingMethod(e.target.value)}
                                  className="pointer-events-none"
                                />
                                <div>
                                  <label htmlFor="express" className="font-medium cursor-pointer">
                                    Frete Expresso
                                  </label>
                                  <p className="text-sm text-gray-600">
                                    15 a 20 dias (Produção) + 1 a 3 dias (Entrega)
                                  </p>
                                </div>
                              </div>
                              <span className="font-semibold">R$ 10,52</span>
                            </div>
                          </div>
                        </>
                      )
                    } else {
                      return (
                        <>
                          {/* Frete Padrão para produto não personalizado */}
                          <div
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                              shippingMethod === "standard"
                                ? "border-orange-300 bg-orange-50/30"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setShippingMethod("standard")}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  id="standard"
                                  name="shipping"
                                  value="standard"
                                  checked={shippingMethod === "standard"}
                                  onChange={(e) => setShippingMethod(e.target.value)}
                                  className="pointer-events-none"
                                />
                                <div>
                                  <label htmlFor="standard" className="font-medium cursor-pointer">
                                    Frete Padrão
                                  </label>
                                  <p className="text-sm text-gray-600">10 a 12 dias (Entrega)</p>
                                </div>
                              </div>
                              <span className="font-semibold">R$ 18,87</span>
                            </div>
                          </div>

                          {/* Frete Expresso para produto não personalizado */}
                          <div
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                              shippingMethod === "express"
                                ? "border-orange-300 bg-orange-50/30"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setShippingMethod("express")}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  id="express"
                                  name="shipping"
                                  value="express"
                                  checked={shippingMethod === "express"}
                                  onChange={(e) => setShippingMethod(e.target.value)}
                                  className="pointer-events-none"
                                />
                                <div>
                                  <label htmlFor="express" className="font-medium cursor-pointer">
                                    Frete Expresso
                                  </label>
                                  <p className="text-sm text-gray-600">1 a 7 dias (Entrega)</p>
                                </div>
                              </div>
                              <span className="font-semibold">R$ 29,39</span>
                            </div>
                          </div>
                        </>
                      )
                    }
                  })()}
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

                  {/* Lazy load CardElement only when credit card is selected */}
                  {paymentMethod === "credit" && (
                    <div className="space-y-4">
                      <div className="p-3 border rounded-lg bg-gray-50">
                        <Label className="text-sm font-medium mb-2 block text-gray-600">
                          Processamento seguro (preencha os dados do cartão aqui)
                        </Label>
                        <Suspense fallback={<div className="h-10 bg-gray-200 animate-pulse rounded"></div>}>
                          <CardElement options={cardElementOptions} />
                        </Suspense>
                      </div>

                      <select className="w-full p-3 border rounded-lg bg-white" defaultValue="">
                        <option value="" disabled>
                          Selecione o parcelamento
                        </option>
                        <option value="1x">1x de R$ {getShippingCost().toFixed(2).replace(".", ",")}</option>
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
                    <label className="text-sm font-medium text-gray-700 block">Código PIX Copia e Cola:</label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={pixPaymentData.qr_code_url}
                        readOnly
                        className="w-full p-3 border rounded-lg bg-gray-50"
                      />
                      <Button
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm"
                        onClick={() => copyToClipboard(pixPaymentData.qr_code_url)}
                      >
                        Copiar
                      </Button>
                    </div>
                    {copyFeedback && <p className="text-green-600 text-sm">{copyFeedback}</p>}
                  </div>
                </div>

                <p className="text-gray-600">
                  O pagamento expira em:{" "}
                  {new Date(pixPaymentData.expires_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                <Button
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-md"
                  onClick={() => setShowPixPayment(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  )
}
