"use client"

// Declaração de tipos para variáveis globais (Facebook Pixel)
declare global {
  interface Window {
    fbq: (
      action: string,
      event: string,
      params?: Record<string, unknown>,
      userData?: Record<string, unknown>,
    ) => void
  }
}

import { useState, useEffect } from "react"
import { ChevronUp, ChevronDown, Minus, Plus, Edit2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

import { fetchAddressByCEP } from "@/utils/fetchAddressByCEP"
import { useRouter } from "next/navigation"
import InitiateCheckoutTracker from "@/components/InitiateCheckoutTracker"
import AbandonedCartTracker from "@/components/AbandonedCartTracker"
import LeadCaptureTracker from "@/components/LeadCaptureTracker"
import PersonalizedTagManager from "@/components/PersonalizedTagManager"

import { fbEvents } from "@/lib/fb-events"
import { exportOrderToShopify, type CheckoutInput } from "@/actions/shopify-actions"
import { calculatePaymentAmount, formatCurrency } from "@/lib/payment-constants"



// Interface para tags personalizadas
interface PersonalizedTag {
  id: string
  color: "orange" | "purple"
  petName: string
  price: number
}

// Mask functions for credit card fields - FIXED with null checks
const formatCardNumber = (value: string) => {
  if (!value || typeof value !== "string") return ""
  const cleaned = value.replace(/\D/g, "")
  const match = cleaned.match(/(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})/)
  if (match) {
    return [match[1], match[2], [match[3], match[4]].filter(Boolean).join(" ")].filter(Boolean).join(" ")
  }
  return cleaned
}

const formatExpiryDate = (value: string) => {
  if (!value || typeof value !== "string") return ""
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
  if (!value || typeof value !== "string") return ""
  return value.replace(/\D/g, "").substring(0, 3)
}

const getCardType = (number: string) => {
  if (!number || typeof number !== "string") return "unknown"
  const cleaned = number.replace(/\D/g, "")
  if (cleaned.match(/^4/)) return "visa"
  if (cleaned.match(/^5[1-5]/)) return "mastercard"
  if (cleaned.match(/^3[47]/)) return "amex"
  if (cleaned.match(/^6(?:011|5)/)) return "discover"
  return "unknown"
}



function OrderSummaryContent({
  quantity,
  setQuantity,
  shippingMethod,
  addressFound,
  personalizedTags,
  onEditTag,
  onRemoveTag,
  fromV2,
  v2Price,
  ofertaAtual,
  orderBumps = { extraTag: false, looapp: false, personalization: false },
}: {
  quantity: number
  setQuantity: (q: number) => void
  shippingMethod: string
  addressFound: boolean
  personalizedTags: PersonalizedTag[]
  onEditTag: (index: number) => void
  onRemoveTag: (index: number) => void
  fromV2?: boolean
  v2Price?: number | null
  ofertaAtual?: { nome: string; parcelas: number; freteGratis: boolean } | null
  orderBumps?: { extraTag: boolean; looapp: boolean; personalization: boolean }
}) {
  // Calculate shipping cost based on shipping method and quantity
  const getShippingCost = () => {
    // Calcular frete baseado no método selecionado
    const getShippingPrice = () => {
      if (shippingMethod === "standard") return 0 // Frete grátis só no método standard
      if (shippingMethod === "standard" && quantity >= 2) return 0 // Frete Grátis
      if (shippingMethod === "loggi") return 15.83
      if (shippingMethod === "sedex") return 28.75
      return 15.83
    }

    // Tags personalizadas reais (excluir orderbumps)
    const realTagsForCost = personalizedTags.filter(t => t.id !== "tag-upgrade" && t.id !== "tag-bump")
    if (realTagsForCost.length > 0) {
      const totalProductPrice = realTagsForCost.reduce((sum, tag) => sum + tag.price, 0) / 100
      if (!addressFound) return totalProductPrice
      return totalProductPrice + getShippingPrice()
    }

    // Verificar se é produto personalizado de forma mais rigorosa
    const personalizedData = sessionStorage.getItem("personalizedProduct")
    let isPersonalized = false

    if (personalizedData) {
      try {
        const data = JSON.parse(personalizedData)
        isPersonalized = !!(data.color && data.amount && data.petName)
      } catch (error) {
        console.error("Erro ao parsear produto personalizado:", error)
        isPersonalized = false
      }
    }

    if (isPersonalized) {
      const data = JSON.parse(personalizedData)
      const basePrice = data.amount / 100
      const additionalPrice = (quantity - 1) * (basePrice / 2) // Adicionais = metade do plano
      const totalProductPrice = basePrice + additionalPrice

      if (!addressFound) return totalProductPrice
      return totalProductPrice + getShippingPrice()
    }

    if (!addressFound) return 0

    // Para produtos genéricos (legacy)
    const basePriceFallback = v2Price || 89.87
    const productPrice = (quantity - 1) * (basePriceFallback / 2)
    return productPrice + getShippingPrice()
  }

  const shippingCost = getShippingCost()

  // Verificar se é produto personalizado de forma mais rigorosa
  const personalizedProductData = sessionStorage.getItem("personalizedProduct")
  let isPersonalized = false
  let productPrice = 0
  let shippingPrice = 0

  // Calcular frete baseado no método selecionado
  const getDisplayShippingPrice = () => {
    if (shippingMethod === "standard") return 0 // Frete grátis só no método standard
    if (shippingMethod === "standard" && quantity >= 2) return 0
    if (shippingMethod === "loggi") return 15.83
    if (shippingMethod === "sedex") return 28.75
    return 15.83 // Fallback
  }

  // Separar tags reais (do fluxo Premium) de tags de orderbump
  const realTags = personalizedTags.filter(t => t.id !== "tag-upgrade" && t.id !== "tag-bump")

  // Calcular preço do PRODUTO (sem orderbumps)
  if (fromV2 && v2Price) {
    // Ofertas v2/v3: preço do plano × quantidade de tags reais
    const realQty = Math.max(quantity, 1)
    if (realTags.length > 0) {
      // Premium com tags personalizadas: somar preços das tags reais
      productPrice = realTags.reduce((sum, tag) => sum + tag.price, 0) / 100
      isPersonalized = true
    } else {
      // Essencial/Completo/Kit: preço fixo do plano
      productPrice = v2Price * realQty
    }
    shippingPrice = addressFound ? getDisplayShippingPrice() : 0
  } else if (personalizedTags.length > 0 && realTags.length > 0) {
    isPersonalized = true
    productPrice = realTags.reduce((sum, tag) => sum + tag.price, 0) / 100
    if (addressFound) shippingPrice = getDisplayShippingPrice()
  } else if (personalizedProductData) {
    try {
      const data = JSON.parse(personalizedProductData)
      isPersonalized = !!(data.color && data.amount && data.petName)
      if (isPersonalized) {
        const basePrice = data.amount / 100
        const additionalPrice = (quantity - 1) * (basePrice / 2)
        productPrice = basePrice + additionalPrice
        if (addressFound) shippingPrice = getDisplayShippingPrice()
      }
    } catch (error) {
      console.error("Erro ao parsear produto personalizado:", error)
      isPersonalized = false
    }
  }

  // Fallback para produto genérico (sem v2, sem personalização)
  if (productPrice === 0 && !fromV2 && !isPersonalized) {
    if (addressFound) {
      const basePriceFallback = 89.87
      productPrice = (quantity - 1) * (basePriceFallback / 2)
      shippingPrice = getDisplayShippingPrice()
    }
  }

  // Calcular valor dos order bumps para exibição
  let bumpDisplayTotal = 0
  if (orderBumps.extraTag && v2Price) bumpDisplayTotal += v2Price / 2
  if (orderBumps.looapp) bumpDisplayTotal += 19.90
  if (orderBumps.personalization) bumpDisplayTotal += 39.90

  const subtotal = productPrice + shippingPrice + bumpDisplayTotal
  const total = subtotal

  // Definir nome e imagem do produto baseado no tipo
  let productName = "Tag rastreamento Petloo + App"

  if (fromV2 && v2Price) {
    productName = ofertaAtual?.nome || "Kit de Proteção Lootag"
  }
  let productImage =
    "https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/image%20978.png"

  if (isPersonalized && personalizedProductData) {
    try {
      const data = JSON.parse(personalizedProductData)
      productName = data.name || "Lootag - Personalizada + App"

      if (data.color === "orange") {
        productImage =
          "https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/ChatGPT%20Image%2010%20de%20jul.%20de%202025%2C%2019_05_16.png"
      } else if (data.color === "purple") {
        productImage =
          "https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/ChatGPT%20Image%2010%20de%20jul.%20de%202025%2C%2019_05_18.png"
      }
    } catch (error) {
      console.error("Erro ao parsear dados do produto personalizado:", error)
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
              className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
            >
              <Plus className="w-4 h-4" />
            </button>
            {/* Adicionar mensagem ao lado do botão + */}
            <span className="text-xs text-gray-500 ml-2">Clique aqui para adicionar mais uma tag</span>
          </div>
          {quantity > 1 && (
            <p className="text-xs text-gray-600 mt-1">
              {isPersonalized
                ? `1ª unidade + ${quantity - 1} adicional${quantity > 2 ? "is" : ""} (R$ 9,90 cada)`
                : fromV2 && v2Price
                  ? `${quantity}x R$ ${v2Price.toFixed(2).replace(".", ",")}`
                  : `1ª unidade grátis + ${quantity - 1} adicional${quantity > 2 ? "is" : ""} (R$ 9,90 cada)`}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-semibold">
            {isPersonalized
              ? `R$ ${productPrice.toFixed(2).replace(".", ",")}`
              : productPrice === 0
                ? "Grátis"
                : `R$ ${productPrice.toFixed(2).replace(".", ",")}`}
          </p>
          {quantity === 1 && !isPersonalized && <p className="text-xs text-gray-500">1º mês grátis</p>}
        </div>
      </div>

      {/* 🆕 LISTA DE TAGS PERSONALIZADAS */}
      {personalizedTags.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-800 mb-3">Tags Configuradas:</h4>
          <div className="space-y-2">
            {personalizedTags.map((tag, index) => (
              <div key={tag.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  <div>
                    <p className="font-medium text-sm">{tag.petName}</p>
                    <p className="text-xs text-gray-600">Lootag - Personalizada</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">R$ {(tag.price / 100).toFixed(2).replace(".", ",")}</span>
                  <button onClick={() => onEditTag(index)} className="p-1 hover:bg-gray-200 rounded" title="Editar tag">
                    <Edit2 className="w-3 h-3 text-gray-600" />
                  </button>
                  {personalizedTags.length > 1 && (
                    <button onClick={() => onRemoveTag(index)} className="p-1 hover:bg-red-100 rounded" title="Remover tag">
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Aviso sobre tags não configuradas */}
          {personalizedTags.length < quantity && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ Você tem {quantity - personalizedTags.length} tag{quantity - personalizedTags.length > 1 ? "s" : ""}{" "}
                não configurada{quantity - personalizedTags.length > 1 ? "s" : ""}. Configure todas as tags antes de
                finalizar a compra.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quantity Discount Notice */}

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
        {/* Mostrar linha do produto apenas se tiver valor ou for personalizado */}
        {(isPersonalized || productPrice > 0) && (
          <div className="flex justify-between">
            <span>
              Produto{quantity > 1 ? "s" : ""} ({quantity}x)
            </span>
            <span className="font-semibold">
              {productPrice === 0 ? "Grátis" : `R$ ${productPrice.toFixed(2).replace(".", ",")}`}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Frete</span>
          <span className={`font-semibold ${!addressFound ? "text-gray-400 text-sm" : ""}`}>
            {!addressFound
              ? "Informe o CEP"
              : shippingPrice === 0
                ? "Grátis"
                : `R$ ${shippingPrice.toFixed(2).replace(".", ",")}`}
          </span>
        </div>
        {/* Linhas dos Order Bumps */}
        {orderBumps.extraTag && v2Price && (
          <div className="flex justify-between text-sm">
            <span>Tag extra (50% OFF)</span>
            <span className="font-semibold">R$ {(v2Price / 2).toFixed(2).replace(".", ",")}</span>
          </div>
        )}
        {orderBumps.looapp && (
          <div className="flex justify-between text-sm">
            <span>Looapp Completo</span>
            <span className="font-semibold">R$ 19,90</span>
          </div>
        )}
        {orderBumps.personalization && (
          <div className="flex justify-between text-sm">
            <span>Personalização</span>
            <span className="font-semibold">R$ 39,90</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>R$ {total.toFixed(2).replace(".", ",")}</span>
        </div>
        <p className="text-sm text-gray-600">{ofertaAtual ? `Em até ${ofertaAtual.parcelas}x sem juros` : "Em até 12x no cartão de crédito"}</p>
      </div>
    </div>
  )
}

function CheckoutForm({ 
  productParams 
}: { 
  productParams?: { 
    product?: string
    price?: string
    items?: string
  } 
}) {
  const router = useRouter()
  
  // Verificar se veio do /v2 via URL params
  // ================================================
  // 🎯 SISTEMA DINÂMICO DE OFERTAS
  // Para adicionar uma nova oferta, basta registrar aqui.
  // A página anterior passa ?product=SLUG&price=VALOR via URL.
  // ================================================
  const OFERTAS: Record<string, { nome: string; parcelas: number; freteGratis: boolean }> = {
    "lootag-kit": {
      nome: "Kit de Proteção Lootag",
      parcelas: 3,
      freteGratis: true,
    },
    "lootag-essencial": {
      nome: "Essencial",
      parcelas: 3,
      freteGratis: true,
    },
    "lootag-completo": {
      nome: "Completo",
      parcelas: 3,
      freteGratis: true,
    },
    "lootag-premium": {
      nome: "Premium",
      parcelas: 3,
      freteGratis: true,
    },
  }

  const fromV2 = !!(productParams?.product && OFERTAS[productParams.product])
  const v2Price = productParams?.price ? parseFloat(productParams.price) : null
  const ofertaAtual = productParams?.product ? OFERTAS[productParams.product] ?? null : null

  // All hooks must be called before any conditional returns
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(true)
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
  const [shippingMethod, setShippingMethod] = useState("standard") // Definir frete grátis como padrão para personalizados
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  })
  const [installments, setInstallments] = useState("3")
  const [installmentOptions, setInstallmentOptions] = useState<Array<{ value: string; label: string }>>([])
  const [cardErrors, setCardErrors] = useState({
    number: false,
    name: false,
    expiry: false,
    cvv: false,
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

  // 🆕 NOVOS ESTADOS PARA TAGS PERSONALIZADAS\
  const [personalizedTags, setPersonalizedTags] = useState<PersonalizedTag[]>([])
  const [showTagManager, setShowTagManager] = useState(false)
  const [editingTagIndex, setEditingTagIndex] = useState<number>(-1)
  const [isCepLoading, setIsCepLoading] = useState(false)
  const [petSizes, setPetSizes] = useState<string[]>([])
  const [deviceType, setDeviceType] = useState("")
  const [showSizeModalCheckout, setShowSizeModalCheckout] = useState(false)
  const [pendingQuantityIncrease, setPendingQuantityIncrease] = useState(false)

  // Order bumps
  const [orderBumps, setOrderBumps] = useState({
    extraTag: false,
    looapp: false,
    personalization: false,
  })
  const [personalizationPetName, setPersonalizationPetName] = useState("")
  const [extraTagPetName, setExtraTagPetName] = useState("")
  const [showBumpNameModal, setShowBumpNameModal] = useState<"extraTag" | "personalization" | null>(null)
  const [bumpNameInput, setBumpNameInput] = useState("")

  // Initialize loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  // Calcular opcoes de parcelamento quando o valor total mudar
  useEffect(() => {
    // Usar o mesmo total do resumo do pedido (produto + frete + bumps)
    let total = getShippingCost()
    if (orderBumps.extraTag && v2Price) total += v2Price / 2
    if (orderBumps.looapp) total += 19.90
    if (orderBumps.personalization) total += 39.90

    if (total > 0) {
      const maxParcelas = ofertaAtual?.parcelas ?? 12
      const options: Array<{ value: string; label: string }> = []
      for (let i = 1; i <= maxParcelas; i++) {
        const calc = calculatePaymentAmount(total, "credit_card", i)
        if (i <= 3) {
          options.push({
            value: i.toString(),
            label: `${i}x de R$ ${formatCurrency(calc.installmentAmount)} sem juros`,
          })
        } else {
          options.push({
            value: i.toString(),
            label: `${i}x de R$ ${formatCurrency(calc.installmentAmount)}*`,
          })
        }
      }
      setInstallmentOptions(options)
    }
  }, [quantity, shippingMethod, addressFound, personalizedTags, productInfo, orderBumps])

  // Handle URL params and personalized product data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isPersonalized = urlParams.get("personalized") === "true"

    console.log("🔍 Verificando parâmetros da URL:", {
      isPersonalized,
      color: urlParams.get("color"),
      amount: urlParams.get("amount"),
      petName: urlParams.get("petName"),
    })

    // Se veio de /v3 com lootag-premium (tag personalizada com nome gravado)
    if (productParams?.product === "lootag-premium" && v2Price) {
      console.log("[v3] Produto Premium detectado:", v2Price)
      const petNameFromUrl = urlParams.get("petName") ? decodeURIComponent(urlParams.get("petName")!) : ""

      setProductInfo({
        type: "Tag Personalizada Premium",
        color: "purple",
        amount: v2Price,
        sku: "LOOTAG-PREMIUM",
        petName: petNameFromUrl,
      })

      if (petNameFromUrl) {
        setPersonalizedTags([{
          id: "tag-0",
          color: "purple" as "orange" | "purple",
          petName: petNameFromUrl,
          price: Math.round(v2Price * 100), // Converter preço para centavos
        }])
      }

      const petSizeFromUrl = urlParams.get("petSize")
      if (petSizeFromUrl) setPetSizes([petSizeFromUrl])
      const deviceTypeFromUrl = urlParams.get("deviceType")
      if (deviceTypeFromUrl) setDeviceType(deviceTypeFromUrl)

      setShippingMethod("standard")
    } else if (fromV2 && v2Price) {
      // Se veio de /v2 ou /v3 com outro produto, usar o preço da URL
      console.log("[v0] Preço de oferta detectado:", v2Price)
      setProductInfo({
        type: "lootag-kit",
        color: "default",
        amount: v2Price,
        sku: "lootag-kit-001",
        petName: "",
      })

      // Capturar tamanho do pet da URL
      const petSizeFromUrl = urlParams.get("petSize")
      if (petSizeFromUrl) {
        setPetSizes([petSizeFromUrl])
      }

      const deviceTypeFromUrl = urlParams.get("deviceType")
      if (deviceTypeFromUrl) {
        setDeviceType(deviceTypeFromUrl)
      }
    } else if (isPersonalized) {
      const color = urlParams.get("color")
      const priceId = urlParams.get("priceId")
      const amount = urlParams.get("amount")
      const petName = urlParams.get("petName") // Obter nome do pet da URL

      if (color && priceId && amount) {
        console.log("✅ Produto personalizado detectado, salvando dados...")

        const productData = {
          color,
          priceId,
          amount: Number(amount),
          name: "Lootag - Personalizada + App",
          petName: petName ? decodeURIComponent(petName) : "", // Decodificar nome do pet
        }

        // Salvar no estado local também
        setProductInfo({
          type: "Tag Personalizada",
          color: "Personalizada",
          amount: Number(amount),
          sku: `TAG-PERSONALIZADA-${color.toUpperCase()}`,
          petName: petName ? decodeURIComponent(petName) : "", // Adicionar ao estado
        })

        // 🆕 CRIAR PRIMEIRA TAG PERSONALIZADA AUTOMATICAMENTE
        if (petName) {
          const firstTag: PersonalizedTag = {
            id: "tag-0",
            color: color as "orange" | "purple",
            petName: decodeURIComponent(petName),
            price: 4990, // R$ 49,90 em centavos
          }
          setPersonalizedTags([firstTag])
        }

        // Manter frete grátis como padrão para produtos personalizados
        setShippingMethod("standard")

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
      // 🚨 PRODUTO GENÉRICO - LIMPAR DADOS ANTIGOS DO SESSIONSTORAGE
      console.log("🧹 Produto genérico detectado, limpando sessionStorage...")

      // Limpar dados de produto personalizado antigos
      sessionStorage.removeItem("personalizedProduct")
      setPersonalizedTags([]) // Limpar tags personalizadas

      // Produto genérico - APENAS FRETE EXPRESSO
      setProductInfo({
        type: "Kit de Proteção Lootag",
        color: "Padrão",
        amount: 8987, // R$ 89,87 em centavos (Kit de Proteção Lootag)
        sku: "KIT-LOOTAG-8987",
        petName: "", // Produto genérico não tem nome do pet
      })
      // Definir Loggi como padrão para 1 unidade genérica
      setShippingMethod("loggi")
    }
  }, [])

  // 🆕 FUNÇÃO PERSONALIZADA PARA ALTERAR QUANTIDADE
  const handleQuantityChange = (newQuantity: number) => {
    const personalizedData = sessionStorage.getItem("personalizedProduct")
    let isPersonalized = false

    if (personalizedData) {
      try {
        const data = JSON.parse(personalizedData)
        isPersonalized = !!(data.color && data.amount && data.petName)
      } catch (error) {
        console.error("Erro ao parsear produto personalizado:", error)
        isPersonalized = false
      }
    }

    // 🆕 TAMBÉM CONSIDERAR PERSONALIZADO SE TEMOS TAGS CONFIGURADAS
    if (personalizedTags.length > 0) {
      isPersonalized = true
    }

    // Se diminuiu a quantidade, remover tags extras
    if (newQuantity < personalizedTags.length) {
      setPersonalizedTags((prev) => prev.slice(0, newQuantity))
      setQuantity(newQuantity)
    }
    // Se aumentou a quantidade E é produto personalizado, abrir popup para nova tag
    else if (newQuantity > quantity && isPersonalized && newQuantity > personalizedTags.length) {
      // NÃO alterar a quantidade ainda - só alterar após salvar a tag
      setEditingTagIndex(personalizedTags.length) // Índice da nova tag
      setShowTagManager(true)
    }
    // Para produtos genéricos ou quando não precisa de popup
    else {
      if (newQuantity > quantity) {
        // Abrir modal de tamanho para a nova tag
        setPendingQuantityIncrease(true)
        setShowSizeModalCheckout(true)
      } else {
        // Diminuindo quantidade — remover último tamanho
        setPetSizes(prev => prev.slice(0, newQuantity))
        setQuantity(newQuantity)
      }
    }
  }

  // 🆕 FUNÇÃO PARA SALVAR TAG PERSONALIZADA
  const handleSaveTag = (tag: PersonalizedTag) => {
    setPersonalizedTags((prev) => {
      const newTags = [...prev]
      const existingIndex = newTags.findIndex((t) => t.id === tag.id)

      if (existingIndex >= 0) {
        newTags[existingIndex] = tag
      } else {
        newTags.push(tag)
        // Se é uma nova tag, atualizar a quantidade
        setQuantity(newTags.length)
      }

      return newTags
    })
    setShowTagManager(false)
    setEditingTagIndex(-1)
  }

  // 🆕 FUNÇÃO PARA EDITAR TAG
  const handleEditTag = (index: number) => {
    setEditingTagIndex(index)
    setShowTagManager(true)
  }

  const handleRemoveTag = (index: number) => {
    const basePrice = v2Price ? Math.round(v2Price * 100) : 8987
    setPersonalizedTags(prev => {
      const newTags = prev.filter((_, i) => i !== index)
      // Recalcular preços: primeira = cheio, demais = metade
      return newTags.map((tag, i) => ({
        ...tag,
        id: `tag-${i}`,
        price: i === 0 ? basePrice : Math.round(basePrice / 2),
      }))
    })
    setQuantity(prev => Math.max(1, prev - 1))
    setPetSizes(prev => prev.filter((_, i) => i !== index))
  }

  // 🔧 FUNÇÃO CORRIGIDA PARA CALCULAR VALOR TOTAL EM REAIS
  const getShippingCost = () => {
    // Calcular frete baseado no método selecionado
    const getShippingPrice = () => {
      if (shippingMethod === "standard") return 0 // Frete grátis só no método standard
      if (shippingMethod === "standard" && quantity >= 2) return 0
      if (shippingMethod === "loggi") return 15.83
      if (shippingMethod === "sedex") return 28.75
      return 15.83
    }

    // Tags personalizadas reais (excluir orderbumps) — checar ANTES de v2Price*qty
    const realTagsForCost = personalizedTags.filter(t => t.id !== "tag-upgrade" && t.id !== "tag-bump")
    if (realTagsForCost.length > 0) {
      const totalProductPrice = realTagsForCost.reduce((sum, tag) => sum + tag.price, 0) / 100
      if (!addressFound) return totalProductPrice
      return totalProductPrice + getShippingPrice()
    }

    // Oferta dinâmica de /v2 ou /v3 (sem tags personalizadas)
    if (fromV2 && v2Price) {
      const productTotal = v2Price * quantity
      if (!addressFound) return productTotal
      return productTotal + getShippingPrice()
    }

    // Verificar se é produto personalizado de forma mais rigorosa
    const personalizedData = sessionStorage.getItem("personalizedProduct")
    let isPersonalized = false

    if (personalizedData) {
      try {
        const data = JSON.parse(personalizedData)
        isPersonalized = !!(data.color && data.amount && data.petName)
      } catch (error) {
        console.error("Erro ao parsear produto personalizado:", error)
        isPersonalized = false
      }
    }

    if (isPersonalized) {
      const data = JSON.parse(personalizedData)
      const basePrice = data.amount / 100
      const additionalPrice = (quantity - 1) * (basePrice / 2) // Adicionais = metade
      const totalProductPrice = basePrice + additionalPrice

      if (!addressFound) return totalProductPrice
      return totalProductPrice + getShippingPrice()
    }

    // Produtos genéricos
    if (!addressFound) return 0
    const basePriceFallback = v2Price || 89.87
    const productPrice = (quantity - 1) * (basePriceFallback / 2)
    return productPrice + getShippingPrice()
  }

  // Valor total para exibição no card do PIX (mesmo cálculo do OrderSummaryContent)
  const pixTotalDisplay = (() => {
    let total = getShippingCost()
    if (orderBumps.extraTag && v2Price) total += v2Price / 2
    if (orderBumps.looapp) total += 19.90
    if (orderBumps.personalization) total += 39.90
    return total
  })()

  // Função para salvar cookies para GTM
  const saveCookiesForGTM = (email: string, name: string, phone: string) => {
    if (typeof document !== "undefined") {
      // Dividir nome em primeiro e último nome
      const nameParts = (name || "").trim().split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      // Salvar cookies com duração de 30 dias (2592000 segundos)
      const maxAge = "max-age=2592000"
      const path = "path=/"

      document.cookie = `ploo_email=${encodeURIComponent(email || "")}; ${path}; ${maxAge}`
      document.cookie = `ploo_first_name=${encodeURIComponent(firstName)}; ${path}; ${maxAge}`
      document.cookie = `ploo_last_name=${encodeURIComponent(lastName)}; ${path}; ${maxAge}`
      document.cookie = `ploo_phone=${encodeURIComponent((phone || "").replace(/\D/g, ""))}; ${path}; ${maxAge}`

      console.log("🍪 Cookies salvos para GTM:", {
        email: email || "",
        firstName: firstName,
        lastName: lastName,
        phone: (phone || "").replace(/\D/g, ""),
      })
    }
  }

  // Função para disparar eventos de add_payment_info
  const handleAddressFound = async () => {
    const value = 29.39 // Valor do frete expresso
    const items = [
      {
        item_id: "tag-petloo",
        item_name: "Tag rastreamento Petloo + App",
        category: "Pet Tracking",
        quantity: 1,
        price: 29.39,
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
      const nameParts = (name || "").trim().split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      if (typeof window !== "undefined") {
        // 📱 Meta Pixel + CAPI - AddPaymentInfo via fbEvents com deduplicação
        await fbEvents("AddPaymentInfo", {
          value: value,
          currency: "BRL",
          content_type: "product",
          content_ids: ["tag-petloo"],
          content_name: "Tag rastreamento Petloo + App",
          content_category: "Pet Tracking",
          num_items: 1,
        }, {
          email: email,
          phone: phone,
          firstName: firstName,
          lastName: lastName,
        })
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
    if (!value || typeof value !== "string") return ""
    const cleaned = value.replace(/\D/g, "")
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return value
  }

  const formatCPF = (value: string) => {
    if (!value || typeof value !== "string") return ""
    const cleaned = value.replace(/\D/g, "")
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/)
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`
    }
    return value
  }

  const formatCEP = (value: string) => {
    if (!value || typeof value !== "string") return ""
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, "")

    // Limit to 8 digits maximum
    const limited = cleaned.substring(0, 8)

    // Apply mask progressively
    if (limited.length <= 5) {
      return limited
    } else {
      return `${limited.substring(0, 5)}-${limited.substring(5)}`
    }
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
    // 🆕 VALIDAÇÃO PARA PRODUTOS PERSONALIZADOS
    const personalizedData = sessionStorage.getItem("personalizedProduct")
    let isPersonalized = false

    if (personalizedData) {
      try {
        const data = JSON.parse(personalizedData)
        isPersonalized = !!(data.color && data.amount && data.petName)
      } catch (error) {
        console.error("Erro ao parsear produto personalizado:", error)
        isPersonalized = false
      }
    }

    // Se é produto personalizado, verificar se todas as tags estão configuradas
    if (isPersonalized && personalizedTags.length < quantity) {
      setCheckoutMessage({
        type: "error",
        text: `Configure todas as ${quantity} tags antes de finalizar a compra. ${quantity - personalizedTags.length} tag${quantity - personalizedTags.length > 1 ? "s" : ""} ainda não configurada${quantity - personalizedTags.length > 1 ? "s" : ""}.`,
      })
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
      console.log("Tags personalizadas:", personalizedTags)

      if (!email || !name || !phone || !cpf || !addressFound || !number) {
        setCheckoutMessage({ type: "error", text: "Por favor, preencha todos os campos obrigatórios." })
        return
      }

      // 🔧 CORREÇÃO CRÍTICA: Calcular valor correto em centavos
      let productInfo = {
        amount: 8987, // R$ 89,87 em centavos (Kit de Proteção Lootag)
        name: "Kit de Proteção Lootag",
        sku: "KIT-LOOTAG-8987",
        type: "Tag Genérica",
        color: "Não se aplica",
        petName: "",
      }

      // 🆕 USAR DADOS DAS TAGS PERSONALIZADAS SE DISPONÍVEIS (excluir tags de orderbump)
      const realPersonalizedTags = personalizedTags.filter(t => t.id !== "tag-upgrade" && t.id !== "tag-bump")
      if (realPersonalizedTags.length > 0) {
        // Somar preço de cada tag real (primeira = cheio, adicionais = metade)
        const totalProductPrice = realPersonalizedTags.reduce((sum, tag) => sum + tag.price, 0)

        let finalAmount = totalProductPrice

        // Adicionar frete se necessário (standard = grátis)
        if (addressFound && shippingMethod !== "standard") {
          if (shippingMethod === "loggi") {
            finalAmount += 1583
          } else if (shippingMethod === "sedex") {
            finalAmount += 2875
          }
        }

        // 🎯 USAR VALOR CALCULADO DIRETAMENTE (sem mapeamento incorreto)
        productInfo = {
          amount: finalAmount, // Usar valor calculado diretamente
          name: `Tags Personalizadas (${personalizedTags.length}x)`,
          sku: `TAG-PERSONALIZADA-MULTI-${personalizedTags.length}x`,
          type: "Tag Personalizada",
          color: personalizedTags.map(() => "Personalizada").join(", "),
          petName: personalizedTags.map((tag) => tag.petName).join(", "),
        }

        console.log("✅ Usando dados das tags personalizadas:", productInfo)
        console.log("💰 Valor final em centavos:", finalAmount)
      } else {
        const personalizedProductData = sessionStorage.getItem("personalizedProduct")
        if (personalizedProductData) {
          try {
            const data = JSON.parse(personalizedProductData)
            // Verificação rigorosa: só considerar personalizado se tiver TODOS os dados necessários
            const isReallyPersonalized = !!(data.color && data.amount && data.petName && data.priceId)

            console.log("🔍 Verificando produto personalizado:", {
              hasColor: !!data.color,
              hasAmount: !!data.amount,
              hasPetName: !!data.petName,
              hasPriceId: !!data.priceId,
              isReallyPersonalized,
            })

            if (isReallyPersonalized) {
              const baseAmount = data.amount // Preço do plano em centavos
              const additionalAmount = (quantity - 1) * Math.round(baseAmount / 2) // Adicionais = metade
              const totalProductAmount = baseAmount + additionalAmount

              let finalAmount = totalProductAmount
              // Adicionar frete se necessário
              if (addressFound) {
                if (shippingMethod === "loggi") {
                  finalAmount += 1583
                } else if (shippingMethod === "sedex") {
                  finalAmount += 2875
                }
                // "standard" = grátis (só disponível para 2+)
              }

              productInfo = {
                amount: finalAmount, // Usar valor calculado diretamente
                name: `${quantity}x ${data.name}`,
                sku: `TAG-PERSONALIZADA-${data.color.toUpperCase()}-${quantity}x-${shippingMethod === "standard" ? "FREE" : shippingMethod === "sedex" ? "SEDEX" : "LOGGI"}`,
                type: "Tag Personalizada",
                color: "Personalizada",
                petName: data.petName || "",
              }

              console.log("✅ Produto personalizado confirmado:", productInfo)
              console.log("💰 Valor final em centavos:", finalAmount)
            } else {
              console.log("⚠️ Dados incompletos no sessionStorage, usando produto genérico")
              // Limpar sessionStorage com dados incompletos
              sessionStorage.removeItem("personalizedProduct")
            }
          } catch (error) {
            console.error("❌ Erro ao parsear produto personalizado:", error)
            // Limpar sessionStorage corrompido
            sessionStorage.removeItem("personalizedProduct")
          }
        } else if (fromV2 && v2Price) {
          // 🎯 OFERTA DINÂMICA (ex: lootag-kit) - v2Price * quantity
          let calculatedAmount = Math.round(v2Price * quantity * 100)

          // Adicionar frete (standard = grátis)
          if (addressFound && shippingMethod !== "standard") {
            if (shippingMethod === "loggi") calculatedAmount += 1583
            else if (shippingMethod === "sedex") calculatedAmount += 2875
          }

          productInfo = {
            amount: calculatedAmount,
            name: ofertaAtual?.nome ?? "Kit de Proteção Lootag",
            sku: `LOOTAG-KIT-${quantity}x`,
            type: "Kit",
            color: "Não se aplica",
            petName: "",
          }

          console.log("💰 Oferta dinâmica - Valor final em centavos:", calculatedAmount)
        } else {
          // ⚠️ PRODUTO GENÉRICO — fallback (nenhuma oferta v2/v3 detectada)
          console.warn("⚠️ Checkout sem produto definido! Usando preço base R$ 89,87 como fallback.")

          // Preço base de R$ 89,87 por unidade como fallback seguro
          let calculatedAmount = Math.round(89.87 * quantity * 100)

          // Adicionar frete se não for grátis
          if (shippingMethod === "loggi") calculatedAmount += 1583
          else if (shippingMethod === "sedex") calculatedAmount += 2875

          productInfo = {
            amount: calculatedAmount,
            name: "Tag rastreamento Petloo + App",
            sku: `TAG-APP-${quantity}x`,
            type: "Tag Genérica",
            color: "Não se aplica",
            petName: "",
          }

          console.log("💰 Produto genérico - Valor final em centavos:", calculatedAmount)
        }
      }

      // 🎁 Adicionar order bumps ao valor total
      let bumpTotal = 0
      if (orderBumps.extraTag && v2Price) bumpTotal += Math.round(v2Price * 100 / 2)
      if (orderBumps.looapp) bumpTotal += 1990
      if (orderBumps.personalization) bumpTotal += 3990
      if (bumpTotal > 0) {
        productInfo.amount += bumpTotal
        console.log("🎁 Order bumps adicionados:", bumpTotal, "centavos. Novo total:", productInfo.amount)
      }

      console.log("🎯 Produto final para checkout:", productInfo)

      // ── Shopify: calcular valor do produto SEM frete (para não duplicar) ──
      const shippingCentavos = shippingMethod === "standard" ? 0 : shippingMethod === "loggi" ? 1583 : shippingMethod === "sedex" ? 2875 : 0
      const productOnlyAmount = productInfo.amount - shippingCentavos - bumpTotal

      if (paymentMethod === "pix") {
        // Salvar dados completos para a página PIX
        const orderDataForPix = {
          personalizedTags: personalizedTags,
          quantity: quantity,
          isPersonalized: personalizedTags.length > 0 || !!sessionStorage.getItem("personalizedProduct"),
          productName: ofertaAtual?.nome || productInfo.name || "Kit de Proteção Lootag",
          productPrice: fromV2 && v2Price ? v2Price * quantity : (productInfo.amount - bumpTotal) / 100,
          shippingPrice: 0,
          orderBumps: {
            extraTag: orderBumps.extraTag,
            looapp: orderBumps.looapp,
            personalization: orderBumps.personalization,
          },
          bumpValues: {
            extraTag: orderBumps.extraTag && v2Price ? v2Price / 2 : 0,
            looapp: orderBumps.looapp ? 19.90 : 0,
            personalization: orderBumps.personalization ? 39.90 : 0,
          },
        }
        sessionStorage.setItem("orderDataForPixPage", JSON.stringify(orderDataForPix))

        // Salvar dados para a página de Obrigado
        const orderDataForObrigado = {
          personalizedTags: personalizedTags,
          quantity: quantity,
          customerName: name,
          customerEmail: email,
          petSizes: petSizes.join(","),
          deviceType: deviceType || "",
        }
        sessionStorage.setItem("orderDataForObrigado", JSON.stringify(orderDataForObrigado))

        // Processar pagamento PIX via nova API Pagar.me
        const pixPayload = {
          amount: productInfo.amount, // Valor em centavos
          paymentMethod: "pix",
          customer: {
            name,
            email,
            cpf: cpf.replace(/\D/g, ""),
            phone: phone.replace(/\D/g, ""),
          },
          shipping: {
            cep: addressData.cep.replace(/\D/g, ""),
            street: addressData.street,
            number: number,
            complement: (document.getElementById("complement") as HTMLInputElement)?.value || "",
            neighborhood: addressData.neighborhood,
            city: addressData.city,
            state: addressData.state,
          },
          items: [
            {
              name: productInfo.name,
              quantity: quantity,
              price: Math.round(productInfo.amount / quantity), // Preço unitário em centavos
              sku: productInfo.sku,
            },
          ],
          petName: productInfo.petName || "",
          petSizes: petSizes.join(","),
          deviceType: deviceType || "",
          orderBumps: {
            extraTag: orderBumps.extraTag,
            looapp: orderBumps.looapp,
            personalization: orderBumps.personalization,
            personalizationPetName: personalizationPetName || null,
          },
        }

        console.log("=== DADOS ENVIADOS PARA API PAYMENT (PIX) ===")
        console.log("PIX Payload:", JSON.stringify(pixPayload, null, 2))

        try {
          const response = await fetch("/api/payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(pixPayload),
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

          // Verificar se temos os dados PIX na resposta (estrutura da nova API Pagar.me)
          if (result.success && result.pix?.qrcode && result.pix?.copiacola) {
            // Disparar evento de tracking antes do redirecionamento
            // 📱 Meta Pixel + CAPI - InitiateCheckout (PIX) via fbEvents com deduplicação
            await fbEvents("InitiateCheckout", {
              content_name: productInfo.name,
              content_ids: [productInfo.sku],
              content_type: "product",
              value: productInfo.amount / 100,
              currency: "BRL",
              num_items: quantity,
            }, {
              email,
              phone: phone.replace(/\D/g, ""),
              firstName: name.split(" ")[0],
              lastName: name.split(" ").slice(1).join(" "),
              city: addressData.city,
              state: addressData.state,
              zipCode: addressData.cep.replace(/\D/g, ""),
              country: "BR",
            })

            // Exportar pedido para Shopify (em background)
            const shopifyData: CheckoutInput = {
              customer: {
                name,
                email,
                phone: phone.replace(/\D/g, ""),
                cpf: cpf.replace(/\D/g, ""),
              },
              shipping: {
                cep: addressData.cep.replace(/\D/g, ""),
                street: addressData.street,
                number: number,
                complement: (document.getElementById("complement") as HTMLInputElement)?.value || "",
                neighborhood: addressData.neighborhood,
                city: addressData.city,
                state: addressData.state,
                method: shippingMethod === "standard" ? "Frete Grátis" : shippingMethod === "sedex" ? "Sedex" : "Loggi",
                price: shippingCentavos,
              },
              items: [
                {
                  quantity: quantity,
                  price: Math.round(productOnlyAmount / quantity),
                  type: productInfo.type,
                  color: productInfo.color,
                  petName: productInfo.petName,
                },
              ],
              paymentMethod: "pix",
              totalAmount: productInfo.amount,
              paymentId: result.orderId,
              paymentStatus: "pending",
              petName: productInfo.petName,
              hasSubscription: true,
              hasLooapp: orderBumps.looapp,
              hasPersonalizationUpgrade: orderBumps.personalization,
              extraTagBump: orderBumps.extraTag,
            }

            // Chamar exportOrderToShopify em background (nao bloquear redirecionamento)
            exportOrderToShopify(shopifyData).catch((err) => {
              console.error("Erro ao exportar pedido para Shopify:", err)
            })

            // Salvar dados PIX no sessionStorage para evitar URL muito longa
            const pixDataToSave = {
              orderId: result.orderId,
              amount: productInfo.amount,
              qrcode: result.pix.qrcode,
              copiacola: result.pix.copiacola,
              expiration_date: result.pix.expiration_date || "",
            }

            sessionStorage.setItem("pixPaymentData", JSON.stringify(pixDataToSave))

            // Redirecionar para página de pagamento PIX
            router.push(`/pix-payment?orderId=${result.orderId}&amount=${productInfo.amount}`)
          } else {
            // Fallback se não receber dados completos
            const orderId = result.orderId

            if (!orderId) {
              throw new Error("ID do pedido não foi retornado pela API")
            }

            router.push(`/pix-payment?orderId=${orderId}&amount=${productInfo.amount}`)
          }
        } catch (fetchError) {
          console.error("Erro na requisição PIX:", fetchError)
          if (fetchError instanceof TypeError && fetchError.message.includes("Failed to fetch")) {
            throw new Error("Erro de conexão. Verifique sua internet e tente novamente.")
          }
          throw fetchError
        }
      } else {
        // Processar pagamento com cartão de crédito via Pagar.me
        // Validar campos do cartão
        const newCardErrors = {
          number: !cardData.number || cardData.number.replace(/\s/g, "").length < 13,
          name: !cardData.name || cardData.name.trim().length < 3,
          expiry: !cardData.expiry || cardData.expiry.length < 5,
          cvv: !cardData.cvv || cardData.cvv.length < 3,
        }

        setCardErrors(newCardErrors)

        if (Object.values(newCardErrors).some((hasError) => hasError)) {
          setCheckoutMessage({ type: "error", text: "Preencha todos os dados do cartão corretamente." })
          setIsProcessing(false)
          return
        }

        // Extrair mês e ano da validade
        const [expMonth, expYear] = cardData.expiry.split("/")

        console.log("=== PROCESSANDO CARTÃO VIA PAGAR.ME ===")

        // Preparar payload para a nova API de pagamento
        const cardPayload = {
          amount: productInfo.amount, // Valor em centavos
          paymentMethod: "credit_card",
          installments: parseInt(installments, 10),
          customer: {
            name,
            email,
            cpf: cpf.replace(/\D/g, ""),
            phone: phone.replace(/\D/g, ""),
          },
          shipping: {
            cep: addressData.cep.replace(/\D/g, ""),
            street: addressData.street,
            number: number,
            complement: (document.getElementById("complement") as HTMLInputElement)?.value || "",
            neighborhood: addressData.neighborhood,
            city: addressData.city,
            state: addressData.state,
          },
          items: [
            {
              name: productInfo.name,
              quantity: quantity,
              price: Math.round(productInfo.amount / quantity), // Preço unitário em centavos
              sku: productInfo.sku,
            },
          ],
          card: {
            number: cardData.number.replace(/\s/g, ""),
            holder_name: cardData.name,
            exp_month: parseInt(expMonth, 10),
            exp_year: parseInt(`20${expYear}`, 10),
            cvv: cardData.cvv,
          },
          petName: productInfo.petName || "",
          petSizes: petSizes.join(","),
          deviceType: deviceType || "",
          orderBumps: {
            extraTag: orderBumps.extraTag,
            looapp: orderBumps.looapp,
            personalization: orderBumps.personalization,
            personalizationPetName: personalizationPetName || null,
          },
        }

        console.log("=== ENVIANDO DADOS PARA API PAYMENT (CARTÃO) ===")
        console.log("Card Payload:", { ...cardPayload, card: { ...cardPayload.card, number: "****", cvv: "***" } })

        try {
          const response = await fetch("/api/payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(cardPayload),
          })

          console.log("Status da resposta:", response.status)
          console.log("Content-Type:", response.headers.get("content-type"))

          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await response.text()
            console.error("Resposta não é JSON:", textResponse)
            throw new Error("Erro no servidor. Resposta inválida recebida.")
          }

          const result = await response.json()
          console.log("Resposta da API:", result)

          if (!response.ok || !result.success) {
            throw new Error(result.error || `Erro HTTP ${response.status}: ${result.message || "Erro desconhecido"}`)
          }

          // Purchase será rastreado na página /obrigado pelo PurchaseTracker
          console.log("✅ Pagamento cartão aprovado - Purchase será rastreado na página /obrigado")

          // Exportar pedido para Shopify
          const shopifyData: CheckoutInput = {
            customer: {
              name,
              email,
              phone: phone.replace(/\D/g, ""),
              cpf: cpf.replace(/\D/g, ""),
            },
            shipping: {
              cep: addressData.cep.replace(/\D/g, ""),
              street: addressData.street,
              number: number,
              complement: (document.getElementById("complement") as HTMLInputElement)?.value || "",
              neighborhood: addressData.neighborhood,
              city: addressData.city,
              state: addressData.state,
              method: shippingMethod === "standard" ? "Frete Grátis" : shippingMethod === "sedex" ? "Sedex" : "Loggi",
              price: shippingCentavos,
            },
            items: [
              {
                quantity: quantity,
                price: Math.round(productOnlyAmount / quantity),
                type: productInfo.type,
                color: productInfo.color,
                petName: productInfo.petName,
              },
            ],
            paymentMethod: "credit_card",
            totalAmount: productInfo.amount,
            paymentId: result.orderId,
            paymentStatus: "paid",
            petName: productInfo.petName,
            hasSubscription: true, // Cartao sempre cria assinatura
            hasLooapp: orderBumps.looapp,
            hasPersonalizationUpgrade: orderBumps.personalization,
            extraTagBump: orderBumps.extraTag,
          }

          // Chamar exportOrderToShopify (em background para nao bloquear)
          exportOrderToShopify(shopifyData).catch((err) => {
            console.error("Erro ao exportar pedido para Shopify:", err)
          })

          // Salvar dados do pedido para a página de obrigado
          const orderSummary = {
            orderId: result.orderId,
            customerName: name,
            customerEmail: email,
            amount: productInfo.amount,
            paymentMethod: "Cartão de Crédito",
            personalizedTags: personalizedTags,
            quantity: quantity,
            subscriptionId: result.subscriptionId,
            petSizes: petSizes.join(","),
            deviceType: deviceType || "",
          }

          sessionStorage.setItem("orderSummary", JSON.stringify(orderSummary))

          // Redirecionar para página de obrigado
          router.push("/obrigado")
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

      {/* Abandoned Cart Tracker - Monitors cart abandonment */}
      <AbandonedCartTracker
        abandonmentTimeSeconds={300} // 5 minutos
        trackPageExit={true}
      />

      {/* Lead Capture Tracker - Captures leads when user fills form */}
      <LeadCaptureTracker />

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Left Column - Forms (Desktop) / Main Content (Mobile) */}
          <div className="lg:order-1">
            {/* Petloo Logo */}
            <div className="mb-8 text-center lg:text-left">
              <img
                src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
                alt="Petloo Logo"
                className="h-12 mx-auto lg:mx-0"
              />
            </div>

            {/* Mobile Order Summary Toggle */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
                className="w-full flex items-center justify-between p-4 bg-white border rounded-lg"
              >
                <span className="font-medium">Resumo do pedido</span>
                {isOrderSummaryOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {/* Mensagem sutil para orientar o usuário */}
              {!isOrderSummaryOpen && (
                <p className="text-xs text-gray-500 text-center mt-2 px-2">
                  💡 Toque no resumo acima para alterar a quantidade ou configurar suas tags
                </p>
              )}

              {isOrderSummaryOpen && (
                <div className="mt-4 p-4 bg-white border rounded-lg">
                  <OrderSummaryContent
                    quantity={quantity}
                    setQuantity={handleQuantityChange}
                    shippingMethod={shippingMethod}
                    addressFound={addressFound}
                    personalizedTags={personalizedTags}
                    onEditTag={handleEditTag}
                    onRemoveTag={handleRemoveTag}
                    fromV2={fromV2}
                    v2Price={v2Price}
                    ofertaAtual={ofertaAtual}
                    orderBumps={orderBumps}
                  />
                </div>
              )}
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
                      className={`mt-1 ${
                        addressFound
                          ? "border-green-500 bg-green-50"
                          : isCepLoading
                            ? "border-blue-500 bg-blue-50"
                            : "bg-blue-50"
                      }`}
                      value={addressData.cep}
                      onChange={(e) => {
                        const formatted = formatCEP(e.target.value)
                        setAddressData((prev) => ({ ...prev, cep: formatted }))

                        // Se o CEP tem 9 caracteres (formato completo), buscar endereço
                        if (formatted.length === 9) {
                          setIsCepLoading(true)
                          setAddressFound(false)

                          fetchAddressByCEP(formatted)
                            .then((address) => {
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
                              setIsCepLoading(false)
                            })
                            .catch(() => {
                              setAddressFound(false)
                              setIsCepLoading(false)
                            })
                        } else {
                          setAddressFound(false)
                          setIsCepLoading(false)
                        }
                      }}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isCepLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                      )}
                      {addressFound && !isCepLoading && <span className="text-green-500">✅</span>}
                    </div>
                  </div>
                  {isCepLoading && (
                    <div className="text-blue-600 text-sm mt-1 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent"></div>
                      Validando CEP...
                    </div>
                  )}
                  {addressFound && !isCepLoading && (
                    <p className="text-green-600 text-sm mt-1">Endereço encontrado com sucesso</p>
                  )}
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

            {/* Shipping Method - Atualizar para mostrar frete grátis a partir de 4 unidades */}
            {addressFound && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-2">Método de envio</h2>

                {(() => {
                  // Verificar se é produto personalizado
                  const personalizedData = sessionStorage.getItem("personalizedProduct")
                  let isPersonalized = false

                  if (personalizedData) {
                    try {
                      const data = JSON.parse(personalizedData)
                      isPersonalized = !!(data.color && data.amount && data.petName)
                    } catch (error) {
                      console.error("Erro ao parsear produto personalizado:", error)
                      isPersonalized = false
                    }
                  }

                  if (personalizedTags.length > 0) {
                    isPersonalized = true
                  }

                  // ========================================
                  // OFERTA DINÂMICA fromV2 (lootag-kit)
                  // ========================================
                  if (fromV2) {
                    // 2+ unidades: Frete Grátis disponível
                    if (quantity >= 2) {
                      return (
                        <div className="space-y-3">
                          {/* Frete Grátis */}
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
                                  <p className="text-sm text-gray-600">5 a 9 dias (Entrega)</p>
                                </div>
                              </div>
                              <span className="font-semibold text-green-600">Grátis</span>
                            </div>
                          </div>

                          {/* Loggi */}
                          <div
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                              shippingMethod === "loggi"
                                ? "border-blue-300 bg-blue-50/30"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setShippingMethod("loggi")}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  id="loggi"
                                  name="shipping"
                                  value="loggi"
                                  checked={shippingMethod === "loggi"}
                                  onChange={(e) => setShippingMethod(e.target.value)}
                                  className="pointer-events-none"
                                />
                                <div>
                                  <label htmlFor="loggi" className="font-medium cursor-pointer">
                                    Loggi
                                  </label>
                                  <p className="text-sm text-gray-600">5 a 9 dias (Entrega)</p>
                                </div>
                              </div>
                              <span className="font-semibold">R$ 15,83</span>
                            </div>
                          </div>

                          {/* Sedex */}
                          <div
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                              shippingMethod === "sedex"
                                ? "border-orange-300 bg-orange-50/30"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setShippingMethod("sedex")}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  id="sedex"
                                  name="shipping"
                                  value="sedex"
                                  checked={shippingMethod === "sedex"}
                                  onChange={(e) => setShippingMethod(e.target.value)}
                                  className="pointer-events-none"
                                />
                                <div>
                                  <label htmlFor="sedex" className="font-medium cursor-pointer">
                                    Sedex
                                  </label>
                                  <p className="text-sm text-gray-600">1 a 7 dias (Entrega)</p>
                                </div>
                              </div>
                              <span className="font-semibold">R$ 28,75</span>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    // 1 unidade: Sem frete grátis
                    return (
                      <div className="space-y-3">
                        {/* Aviso: frete grátis só a partir de 2 */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-1">
                          <p className="text-blue-800 text-sm">
                            💡 <strong>Dica:</strong> Adicione mais 1 unidade e ganhe <strong>frete grátis</strong>!
                          </p>
                        </div>

                        {/* Loggi */}
                        <div
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                            shippingMethod === "loggi"
                              ? "border-blue-300 bg-blue-50/30"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setShippingMethod("loggi")}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                id="loggi"
                                name="shipping"
                                value="loggi"
                                checked={shippingMethod === "loggi"}
                                onChange={(e) => setShippingMethod(e.target.value)}
                                className="pointer-events-none"
                              />
                              <div>
                                <label htmlFor="loggi" className="font-medium cursor-pointer">
                                  Loggi
                                </label>
                                <p className="text-sm text-gray-600">5 a 9 dias (Entrega)</p>
                              </div>
                            </div>
                            <span className="font-semibold">R$ 15,83</span>
                          </div>
                        </div>

                        {/* Sedex */}
                        <div
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                            shippingMethod === "sedex"
                              ? "border-orange-300 bg-orange-50/30"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setShippingMethod("sedex")}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                id="sedex"
                                name="shipping"
                                value="sedex"
                                checked={shippingMethod === "sedex"}
                                onChange={(e) => setShippingMethod(e.target.value)}
                                className="pointer-events-none"
                              />
                              <div>
                                <label htmlFor="sedex" className="font-medium cursor-pointer">
                                  Sedex
                                </label>
                                <p className="text-sm text-gray-600">1 a 7 dias (Entrega)</p>
                              </div>
                            </div>
                            <span className="font-semibold">R$ 28,75</span>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // ========================================
                  // PRODUTOS PERSONALIZADOS
                  // ========================================
                  if (isPersonalized) {
                    // 2+ unidades: Frete Grátis disponível
                    if (quantity >= 2) {
                      return (
                        <div className="space-y-3">
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
                                <input type="radio" id="standard" name="shipping" value="standard"
                                  checked={shippingMethod === "standard"}
                                  onChange={(e) => setShippingMethod(e.target.value)}
                                  className="pointer-events-none" />
                                <div>
                                  <label htmlFor="standard" className="font-medium cursor-pointer">Frete Grátis</label>
                                  <p className="text-sm text-gray-600">5 a 9 dias (Entrega)</p>
                                </div>
                              </div>
                              <span className="font-semibold text-green-600">Grátis</span>
                            </div>
                          </div>

                          <div
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                              shippingMethod === "loggi"
                                ? "border-blue-300 bg-blue-50/30"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setShippingMethod("loggi")}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <input type="radio" id="loggi" name="shipping" value="loggi"
                                  checked={shippingMethod === "loggi"}
                                  onChange={(e) => setShippingMethod(e.target.value)}
                                  className="pointer-events-none" />
                                <div>
                                  <label htmlFor="loggi" className="font-medium cursor-pointer">Loggi</label>
                                  <p className="text-sm text-gray-600">5 a 9 dias (Entrega)</p>
                                </div>
                              </div>
                              <span className="font-semibold">R$ 15,83</span>
                            </div>
                          </div>

                          <div
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                              shippingMethod === "sedex"
                                ? "border-orange-300 bg-orange-50/30"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setShippingMethod("sedex")}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <input type="radio" id="sedex" name="shipping" value="sedex"
                                  checked={shippingMethod === "sedex"}
                                  onChange={(e) => setShippingMethod(e.target.value)}
                                  className="pointer-events-none" />
                                <div>
                                  <label htmlFor="sedex" className="font-medium cursor-pointer">Sedex</label>
                                  <p className="text-sm text-gray-600">1 a 7 dias (Entrega)</p>
                                </div>
                              </div>
                              <span className="font-semibold">R$ 28,75</span>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    // 1 unidade personalizada: sem frete grátis
                    return (
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-1">
                          <p className="text-blue-800 text-sm">
                            💡 <strong>Dica:</strong> Adicione mais 1 unidade e ganhe <strong>frete grátis</strong>!
                          </p>
                        </div>

                        <div
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                            shippingMethod === "loggi"
                              ? "border-blue-300 bg-blue-50/30"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setShippingMethod("loggi")}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input type="radio" id="loggi" name="shipping" value="loggi"
                                checked={shippingMethod === "loggi"}
                                onChange={(e) => setShippingMethod(e.target.value)}
                                className="pointer-events-none" />
                              <div>
                                <label htmlFor="loggi" className="font-medium cursor-pointer">Loggi</label>
                                <p className="text-sm text-gray-600">5 a 9 dias (Entrega)</p>
                              </div>
                            </div>
                            <span className="font-semibold">R$ 15,83</span>
                          </div>
                        </div>

                        <div
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                            shippingMethod === "sedex"
                              ? "border-orange-300 bg-orange-50/30"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setShippingMethod("sedex")}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input type="radio" id="sedex" name="shipping" value="sedex"
                                checked={shippingMethod === "sedex"}
                                onChange={(e) => setShippingMethod(e.target.value)}
                                className="pointer-events-none" />
                              <div>
                                <label htmlFor="sedex" className="font-medium cursor-pointer">Sedex</label>
                                <p className="text-sm text-gray-600">1 a 7 dias (Entrega)</p>
                              </div>
                            </div>
                            <span className="font-semibold">R$ 28,75</span>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // ========================================
                  // PRODUTOS GENÉRICOS (fallback)
                  // ========================================
                  if (quantity >= 2) {
                    return (
                      <div className="border-2 rounded-lg p-4 border-green-300 bg-green-50/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Frete Grátis</p>
                            <p className="text-sm text-gray-600">5 a 9 dias (Entrega)</p>
                          </div>
                          <span className="font-semibold text-green-600">Grátis</span>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-1">
                        <p className="text-blue-800 text-sm">
                          💡 <strong>Dica:</strong> Adicione mais 1 unidade e ganhe <strong>frete grátis</strong>!
                        </p>
                      </div>
                      <div className="border-2 rounded-lg p-4 border-orange-300 bg-orange-50/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Loggi</p>
                            <p className="text-sm text-gray-600">5 a 9 dias (Entrega)</p>
                          </div>
                          <span className="font-semibold">R$ 15,83</span>
                        </div>
                      </div>
                      <div className="border-2 rounded-lg p-4 border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Sedex</p>
                            <p className="text-sm text-gray-600">1 a 7 dias (Entrega)</p>
                          </div>
                          <span className="font-semibold">R$ 28,75</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
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
                    <div className="flex items-center gap-1.5">
                      <img
                        src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/Comum/card-visa%20%281%29.svg"
                        alt="Visa"
                        className={`h-5 transition-all duration-200 ${
                          getCardType(cardData.number) === "visa"
                            ? "opacity-100"
                            : cardData.number.length > 0
                              ? "opacity-30 grayscale"
                              : "opacity-100"
                        }`}
                      />
                      <img
                        src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/Comum/card-mastercard%20%281%29.svg"
                        alt="Mastercard"
                        className={`h-5 transition-all duration-200 ${
                          getCardType(cardData.number) === "mastercard"
                            ? "opacity-100"
                            : cardData.number.length > 0
                              ? "opacity-30 grayscale"
                              : "opacity-100"
                        }`}
                      />
                      <img
                        src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/Comum/amex.Csr7hRoy%20%281%29.svg"
                        alt="Amex"
                        className={`h-5 transition-all duration-200 ${
                          getCardType(cardData.number) === "amex"
                            ? "opacity-100"
                            : cardData.number.length > 0
                              ? "opacity-30 grayscale"
                              : "opacity-100"
                        }`}
                      />
                      <img
                        src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/Comum/card-discover%20%281%29.svg"
                        alt="Discover"
                        className={`h-5 transition-all duration-200 ${
                          getCardType(cardData.number) === "discover"
                            ? "opacity-100"
                            : cardData.number.length > 0
                              ? "opacity-30 grayscale"
                              : "opacity-100"
                        }`}
                      />
                      <span className="text-xs text-gray-500 ml-1">E muito mais...</span>
                    </div>
                  </div>

                  {/* Campos de cartão nativos - Layout Looneca */}
                  {paymentMethod === "credit" && (
                    <div className="space-y-4 mt-4">
                      {/* Número do Cartão */}
                      <div>
                        <Label htmlFor="cardNumber" className="text-sm font-medium">
                          Número do Cartão
                        </Label>
                        <input
                          id="cardNumber"
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          value={cardData.number}
                          onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value)
                            setCardData((prev) => ({ ...prev, number: formatted }))
                            setCardErrors((prev) => ({ ...prev, number: false }))
                          }}
                          maxLength={19}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E] ${
                            cardErrors.number ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                      </div>

                      {/* Nome no Cartão */}
                      <div>
                        <Label htmlFor="cardName" className="text-sm font-medium">
                          Nome no Cartão
                        </Label>
                        <input
                          id="cardName"
                          type="text"
                          placeholder="Nome como está no cartão"
                          value={cardData.name}
                          onChange={(e) => {
                            setCardData((prev) => ({ ...prev, name: e.target.value.toUpperCase() }))
                            setCardErrors((prev) => ({ ...prev, name: false }))
                          }}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E] ${
                            cardErrors.name ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                      </div>

                      {/* Grid para Validade e CVV */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cardExpiry" className="text-sm font-medium">
                            Validade
                          </Label>
                          <input
                            id="cardExpiry"
                            type="text"
                            placeholder="MM/AA"
                            value={cardData.expiry}
                            onChange={(e) => {
                              const formatted = formatExpiryDate(e.target.value)
                              setCardData((prev) => ({ ...prev, expiry: formatted }))
                              setCardErrors((prev) => ({ ...prev, expiry: false }))
                            }}
                            maxLength={5}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E] ${
                              cardErrors.expiry ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cardCvv" className="text-sm font-medium">
                            CVV
                          </Label>
                          <input
                            id="cardCvv"
                            type="text"
                            placeholder="123"
                            value={cardData.cvv}
                            onChange={(e) => {
                              const formatted = formatCVV(e.target.value)
                              setCardData((prev) => ({ ...prev, cvv: formatted }))
                              setCardErrors((prev) => ({ ...prev, cvv: false }))
                            }}
                            maxLength={4}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E] ${
                              cardErrors.cvv ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Select para Parcelas */}
                      <div>
                        <Label htmlFor="installments" className="text-sm font-medium">
                          Parcelas
                        </Label>
                        <select
                          id="installments"
                          value={installments}
                          onChange={(e) => setInstallments(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E] bg-white"
                        >
                          {installmentOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-green-600 font-medium mt-1">Ate 3x sem juros</p>
                      </div>


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
                          <li>• Valor à vista R$ {pixTotalDisplay.toFixed(2).replace(".", ",")};</li>
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
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg font-semibold mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCheckout}
              disabled={isProcessing || showPixPayment}
            >
              {isProcessing ? (paymentMethod === "pix" ? "Gerando PIX..." : "Processando...") : "Finalizar compra"}
            </Button>

            {/* === ORDER BUMPS === */}
            <div className="space-y-3 my-4">
              {/* Orderbump 1: Tag Extra — só para premium com qty 1 */}
              {productParams?.product === "lootag-premium" && quantity === 1 && (
                <div className="border-2 border-dashed border-amber-400 rounded-lg overflow-hidden">
                  <div className="bg-amber-500 text-white text-center py-2 font-bold text-sm">
                    🏷️ OFERTA EXCLUSIVA — SÓ APARECE AGORA
                  </div>
                  <div className="p-4 bg-amber-50">
                    <p className="text-sm font-semibold text-gray-800 mb-2">
                      Leve +1 tag personalizada pela METADE do preço
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      Seu pet merece um backup. Se a tag principal cair da coleira, parar na
                      máquina de lavar ou simplesmente se desgastar, você tem uma reserva
                      pronta. Quem tem 2 tags, nunca fica sem rastreamento.
                    </p>
                    <p className="text-lg font-bold text-amber-600 mb-3">
                      + R$ {v2Price ? (v2Price / 2).toFixed(2).replace(".", ",") : "0,00"} (metade do preço)
                    </p>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="bump-extra-tag"
                        checked={orderBumps.extraTag}
                        onCheckedChange={(checked) => {
                          if (checked === true) {
                            setBumpNameInput("")
                            setShowBumpNameModal("extraTag")
                          } else {
                            setOrderBumps(prev => ({ ...prev, extraTag: false }))
                            setExtraTagPetName("")
                            setQuantity(prev => Math.max(1, prev - 1))
                            setPetSizes(prev => prev.filter((_, i) => i !== prev.length - 1))
                            setPersonalizedTags(prev => prev.filter(t => t.id !== "tag-bump"))
                          }
                        }}
                      />
                      <label htmlFor="bump-extra-tag" className="text-sm font-semibold text-gray-800 cursor-pointer">
                        Sim, quero adicionar!
                      </label>
                    </div>
                    {orderBumps.extraTag && extraTagPetName && (
                      <p className="text-sm text-green-700 font-medium mt-2">Tag extra: {extraTagPetName} ✓</p>
                    )}
                  </div>
                </div>
              )}

              {/* Orderbump 2: Looapp — sempre aparece */}
              <div className="border-2 border-dashed border-amber-400 rounded-lg overflow-hidden">
                <div className="bg-amber-500 text-white text-center py-2 font-bold text-sm">
                  📱 ATIVE O LOOAPP COMPLETO — SEU PET PROTEGIDO DE VERDADE
                </div>
                <div className="p-4 bg-amber-50">
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">
                    Transforme seu celular na caderneta de saúde digital do seu pet.
                  </p>
                  <div className="text-sm text-gray-700 leading-relaxed mb-3 space-y-1">
                    <p><span className="text-green-600 font-bold">✓</span> RG Digital do Pet — todos os dados em um só lugar, sempre no bolso</p>
                    <p><span className="text-green-600 font-bold">✓</span> Cartão de Vacinas Digital — nunca mais perca o controle</p>
                    <p><span className="text-green-600 font-bold">✓</span> Lembretes Automáticos — aviso antes de cada vacina ou vermífugo vencer</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    Chega de papel amassado na gaveta. Chega de esquecer a data da próxima
                    vacina. O Looapp organiza tudo pra você.
                  </p>
                  <p className="text-lg font-bold text-amber-600 mb-3">
                    + R$ 19,90 (pagamento único)
                  </p>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="bump-looapp"
                      checked={orderBumps.looapp}
                      onCheckedChange={(checked) => {
                        setOrderBumps(prev => ({ ...prev, looapp: checked === true }))
                      }}
                    />
                    <label htmlFor="bump-looapp" className="text-sm font-semibold text-gray-800 cursor-pointer">
                      Sim, quero o Looapp Completo!
                    </label>
                  </div>
                </div>
              </div>

              {/* Orderbump 3: Upgrade Personalização — só para não-premium */}
              {productParams?.product !== "lootag-premium" && (
                <div className="border-2 border-dashed border-amber-400 rounded-lg overflow-hidden">
                  <div className="bg-amber-500 text-white text-center py-2 font-bold text-sm">
                    ✨ TRANSFORME SUA TAG — GRAVAÇÃO COM O NOME DO SEU PET
                  </div>
                  <div className="p-4 bg-amber-50">
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      Sua tag vem lisa de fábrica. Por + R$ 39,90 a gente grava o nome do
                      seu pet direto no acrílico. Isso não é adesivo — é gravação permanente
                      que não descasca, não desbota e não sai.
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      Se o seu pet se perder, quem encontrar sabe o nome dele na hora.
                      Além de lindo, é mais seguro.
                    </p>
                    <p className="text-lg font-bold text-amber-600 mb-3">
                      + R$ 39,90 (gravação permanente)
                    </p>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="bump-personalization"
                        checked={orderBumps.personalization}
                        onCheckedChange={(checked) => {
                          if (checked === true) {
                            setBumpNameInput("")
                            setShowBumpNameModal("personalization")
                          } else {
                            setOrderBumps(prev => ({ ...prev, personalization: false }))
                            setPersonalizationPetName("")
                            setPersonalizedTags(prev => prev.filter(t => t.id !== "tag-upgrade"))
                          }
                        }}
                      />
                      <label htmlFor="bump-personalization" className="text-sm font-semibold text-gray-800 cursor-pointer">
                        Sim, quero personalizar com o nome do meu pet!
                      </label>
                    </div>
                    {orderBumps.personalization && personalizationPetName && (
                      <p className="text-sm text-green-700 font-medium mt-2">Gravação: {personalizationPetName} ✓</p>
                    )}
                  </div>
                </div>
              )}
            </div>

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
                Ao prosseguir, você concorda com os <a href="https://tag.petloo.com.br/termos-de-uso-LooTag" target="_blank" rel="noopener noreferrer" className="text-orange-500 underline">Termos de Serviço</a>
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
                setQuantity={handleQuantityChange}
                shippingMethod={shippingMethod}
                addressFound={addressFound}
                personalizedTags={personalizedTags}
                onEditTag={handleEditTag}
                onRemoveTag={handleRemoveTag}
                fromV2={fromV2}
                v2Price={v2Price}
                ofertaAtual={ofertaAtual}
                orderBumps={orderBumps}
              />
            </div>
          </div>
        </div>

        {/* Modal de nome do pet para order bumps */}
        {showBumpNameModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => {
            setShowBumpNameModal(null)
          }}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Qual o nome do seu pet?</h2>
                <p className="text-sm text-gray-600">Vamos gravar na sua tag com muito carinho</p>
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  value={bumpNameInput}
                  onChange={(e) => setBumpNameInput(e.target.value.slice(0, 20))}
                  placeholder="Digite aqui o nome do pet"
                  className="w-full border-2 border-gray-200 focus:border-purple-500 rounded-xl p-4 text-center text-lg font-bold text-gray-900 outline-none transition-colors"
                  autoFocus
                />
                <p className="text-xs text-gray-500 text-center mt-2">{bumpNameInput.length}/20 caracteres</p>
              </div>

              <button
                onClick={() => {
                  const name = bumpNameInput.trim()
                  if (!name) return
                  if (showBumpNameModal === "extraTag") {
                    setExtraTagPetName(name)
                    setOrderBumps(prev => ({ ...prev, extraTag: true }))
                    setQuantity(prev => prev + 1)
                    setPetSizes(prev => [...prev, petSizes[0] || "M"])
                    setPersonalizedTags(prev => [...prev, {
                      id: "tag-bump",
                      color: "purple" as "orange" | "purple",
                      petName: name,
                      price: Math.round((v2Price || 0) * 100 / 2),
                    }])
                  } else if (showBumpNameModal === "personalization") {
                    setPersonalizationPetName(name)
                    setOrderBumps(prev => ({ ...prev, personalization: true }))
                    setPersonalizedTags(prev => {
                      const filtered = prev.filter(t => t.id !== "tag-upgrade")
                      return [...filtered, {
                        id: "tag-upgrade",
                        color: "purple" as "orange" | "purple",
                        petName: name,
                        price: 3990,
                      }]
                    })
                  }
                  setShowBumpNameModal(null)
                }}
                disabled={!bumpNameInput.trim()}
                className="w-full py-3 font-bold text-base rounded-full text-center transition-all bg-petloo-green text-white hover:bg-petloo-green/90 disabled:opacity-40 disabled:cursor-not-allowed mb-3"
              >
                {!bumpNameInput.trim() ? "Digite o nome do pet" : "Confirmar"}
              </button>

              <button
                onClick={() => setShowBumpNameModal(null)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* 🆕 POPUP PARA CONFIGURAR TAGS PERSONALIZADAS */}
        <PersonalizedTagManager
          isOpen={showTagManager}
          onClose={() => {
            setShowTagManager(false)
            setEditingTagIndex(-1)
          }}
          tagIndex={editingTagIndex}
          existingTag={
            editingTagIndex >= 0 && editingTagIndex < personalizedTags.length
              ? personalizedTags[editingTagIndex]
              : undefined
          }
          onSaveTag={handleSaveTag}
          basePrice={v2Price ? Math.round(v2Price * 100) : 8987}
        />

        {/* Modal de Tamanho para tags adicionais no Checkout */}
        {showSizeModalCheckout && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => {
            setShowSizeModalCheckout(false)
            setPendingQuantityIncrease(false)
          }}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tamanho da tag #{quantity + 1}</h2>
                <p className="text-sm text-gray-600">Qual o tamanho do pet que vai usar esta tag?</p>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { size: "P", label: "Pequeno", desc: "Gatos e cães pequenos", weight: "Até 8kg", emoji: "🐱" },
                  { size: "M", label: "Médio", desc: "Cães de porte médio", weight: "De 8kg a 25kg", emoji: "🐕" },
                  { size: "G", label: "Grande", desc: "Cães de porte grande", weight: "Acima de 25kg", emoji: "🐕🦺" },
                ].map((option) => (
                  <button
                    key={option.size}
                    onClick={() => {
                      setPetSizes(prev => [...prev, option.size])
                      setQuantity(prev => prev + 1)
                      setShowSizeModalCheckout(false)
                      setPendingQuantityIncrease(false)
                    }}
                    className="w-full border-2 border-gray-200 hover:border-orange-500 rounded-xl p-4 text-left transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900">{option.size} — {option.label}</span>
                        <p className="text-sm text-gray-600 mt-1">{option.desc}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{option.weight}</p>
                      </div>
                      <span className="text-2xl">{option.emoji}</span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setShowSizeModalCheckout(false)
                  setPendingQuantityIncrease(false)
                }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

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

export default function CheckoutPage({
  productParams
}: {
  productParams?: {
    product?: string
    price?: string
    items?: string
  }
}) {
  return <CheckoutForm productParams={productParams} />
}
