"use client"

// Declaração de tipos para variáveis globais (Facebook Pixel e GTM)
declare global {
  interface Window {
    fbq: (
      action: string,
      event: string,
      params?: Record<string, unknown>,
      userData?: Record<string, unknown>
    ) => void
    dataLayer: Array<Record<string, unknown>>
  }
}

import { useState, useEffect } from "react"
import { ChevronUp, ChevronDown, Minus, Plus, Edit2 } from "lucide-react"
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

import { prepareMetaPixelUserData, logMetaPixelEvent } from "@/utils/metaPixelUtils"
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
  fromV2,
  v2Price,
  ofertaAtual,
}: {
  quantity: number
  setQuantity: (q: number) => void
  shippingMethod: string
  addressFound: boolean
  personalizedTags: PersonalizedTag[]
  onEditTag: (index: number) => void
  fromV2?: boolean
  v2Price?: number | null
  ofertaAtual?: { nome: string; parcelas: number; freteGratis: boolean } | null
}) {
  // Calculate shipping cost based on shipping method and quantity
  const getShippingCost = () => {
    // 🆕 NOVA LÓGICA: Se temos tags personalizadas configuradas
    if (personalizedTags.length > 0) {
      // CORREÇÃO: Primeira tag R$ 49,90, demais R$ 9,90
      const firstTagPrice = 49.9 // R$ 49,90 em reais
      const additionalTagsPrice = (personalizedTags.length - 1) * 9.9 // R$ 9,90 cada em reais
      const totalProductPrice = firstTagPrice + additionalTagsPrice

      if (!addressFound) return totalProductPrice

      // Para produto personalizado: sempre oferecer ambas opções de frete
      if (shippingMethod === "express") {
        return totalProductPrice + 10.52
      }
      return totalProductPrice // Frete grátis padrão
    }

    // Verificar se é produto personalizado de forma mais rigorosa
    const personalizedData = sessionStorage.getItem("personalizedProduct")
    let isPersonalized = false

    if (personalizedData) {
      try {
        const data = JSON.parse(personalizedData)
        // Verificar se realmente tem os dados de personalização
        isPersonalized = !!(data.color && data.amount && data.petName)
      } catch (error) {
        console.error("Erro ao parsear produto personalizado:", error)
        isPersonalized = false
      }
    }

    if (isPersonalized) {
      const data = JSON.parse(personalizedData)
      const basePrice = data.amount / 100 // R$ 49,90 primeira unidade
      const additionalPrice = (quantity - 1) * 9.9 // R$ 9,90 por unidade adicional
      const totalProductPrice = basePrice + additionalPrice

      if (!addressFound) return totalProductPrice

      // Para produto personalizado: frete grátis a partir de 4 unidades
      if (quantity >= 4) {
        return totalProductPrice // Frete grátis
      }

      // Menos de 4 unidades: frete grátis padrão, frete expresso R$ 10,52
      if (shippingMethod === "express") {
        return totalProductPrice + 10.52
      }
      return totalProductPrice // Frete grátis padrão
    }

    if (!addressFound) return 0

    // Para produtos genéricos com 6+ unidades: frete grátis
    if (quantity >= 6) {
      // Primeira unidade grátis + unidades adicionais R$ 9,90 cada
      return (quantity - 1) * 9.9 // Sem frete
    }

    // Para produtos genéricos com menos de 6 unidades: frete R$ 29,39
    const baseShipping = 29.39
    const additionalPrice = (quantity - 1) * 9.9
    return baseShipping + additionalPrice
  }

  const shippingCost = getShippingCost()

  // Verificar se é produto personalizado de forma mais rigorosa
  const personalizedProductData = sessionStorage.getItem("personalizedProduct")
  let isPersonalized = false
  let productPrice = 0
  let shippingPrice = 0

  // 🆕 NOVA LÓGICA: Se temos tags personalizadas configuradas
  if (personalizedTags.length > 0) {
    isPersonalized = true
    productPrice = personalizedTags.reduce((sum, tag) => sum + tag.price, 0) / 100 // Converter centavos para reais

    // Calcular frete separadamente
    if (addressFound) {
      if (quantity >= 4) {
        shippingPrice = 0 // Frete grátis
      } else if (shippingMethod === "express") {
        shippingPrice = 10.52
      } else {
        shippingPrice = 0 // Frete grátis padrão
      }
    }
  } else if (personalizedProductData) {
    try {
      const data = JSON.parse(personalizedProductData)
      // Verificar se realmente tem os dados de personalização
      isPersonalized = !!(data.color && data.amount && data.petName)

      if (isPersonalized) {
        const basePrice = data.amount / 100 // R$ 49,90 primeira unidade
        const additionalPrice = (quantity - 1) * 9.9 // R$ 9,90 por unidade adicional
        productPrice = basePrice + additionalPrice

        // Calcular frete separadamente
        if (addressFound) {
          if (quantity >= 4) {
            shippingPrice = 0 // Frete grátis
          } else if (shippingMethod === "express") {
            shippingPrice = 10.52
          } else {
            shippingPrice = 0 // Frete grátis padrão
          }
        }
      }
    } catch (error) {
      console.error("Erro ao parsear produto personalizado:", error)
      isPersonalized = false
    }
  }

  // 🆕 NOVA LÓGICA PARA PRODUTO GENÉRICO
  if (!isPersonalized) {
    // 🔧 OFERTA DINÂMICA: preço fixo sem precisar de CEP
    if (fromV2 && v2Price && ofertaAtual?.freteGratis) {
      productPrice = v2Price * quantity
      shippingPrice = 0
    } else if (addressFound) {
      // Produto: primeira unidade grátis, demais R$ 9,90
      productPrice = (quantity - 1) * 9.9

      // Frete: R$ 29,39 fixo, grátis a partir de 6 unidades
      shippingPrice = quantity >= 6 ? 0 : 29.39
    }
  }

  const subtotal = productPrice + shippingPrice
  const total = subtotal

  // Definir nome e imagem do produto baseado no tipo
  let productName = "Tag rastreamento Petloo + App"

  // Se veio de /v2 com lootag-kit, usar preço total (v2Price * quantity)
  if (fromV2 && v2Price) {
    productPrice = v2Price * quantity
    productName = "Kit de Proteção Lootag"
  }
  let productImage =
    "https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Fotos%20da%20LP/image%20594-rIMxV2I0SZADJI938HxomgyWIUjTGg.png"

  if (isPersonalized && personalizedProductData) {
    try {
      const data = JSON.parse(personalizedProductData)
      productName = data.name || `Tag ${data.color === "orange" ? "Laranja" : "Roxa"} Personalizada + App`

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
                  <div
                    className={`w-4 h-4 rounded-full ${tag.color === "orange" ? "bg-orange-500" : "bg-purple-500"}`}
                  ></div>
                  <div>
                    <p className="font-medium text-sm">{tag.petName}</p>
                    <p className="text-xs text-gray-600">Tag {tag.color === "orange" ? "Laranja" : "Roxa"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">R$ {(tag.price / 100).toFixed(2).replace(".", ",")}</span>
                  <button onClick={() => onEditTag(index)} className="p-1 hover:bg-gray-200 rounded" title="Editar tag">
                    <Edit2 className="w-3 h-3 text-gray-600" />
                  </button>
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
          <span className="font-semibold">
            {shippingPrice === 0 ? "Grátis" : `R$ ${shippingPrice.toFixed(2).replace(".", ",")}`}
          </span>
        </div>
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
    // Adicione futuras ofertas aqui:
    // "outro-kit": { nome: "Outro Produto", parcelas: 1, freteGratis: false },
  }

  const fromV2 = productParams?.product === "lootag-kit"
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

  // Initialize loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  // Calcular opcoes de parcelamento quando o valor total mudar
  useEffect(() => {
    const total = (fromV2 && v2Price) ? v2Price : getShippingCost()
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
  }, [quantity, shippingMethod, addressFound, personalizedTags, productInfo])

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

    // Se veio de /v2, usar o preço da URL
    if (fromV2 && v2Price) {
      console.log("[v0] Preço de /v2 detectado:", v2Price)
      setProductInfo({
        type: "lootag-kit",
        color: "default",
        amount: v2Price,
        sku: "lootag-kit-001",
        petName: "",
      })
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
      // Forçar frete expresso para produtos genéricos
      setShippingMethod("express")
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
      setQuantity(newQuantity)
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

  // 🔧 FUNÇÃO CORRIGIDA PARA CALCULAR VALOR TOTAL EM REAIS
  const getShippingCost = () => {
    // 🆕 NOVA LÓGICA: Se temos tags personalizadas configuradas
    if (personalizedTags.length > 0) {
      // CORREÇÃO: Primeira tag R$ 49,90, demais R$ 9,90
      const firstTagPrice = 49.9 // R$ 49,90 em reais
      const additionalTagsPrice = (personalizedTags.length - 1) * 9.9 // R$ 9,90 cada em reais
      const totalProductPrice = firstTagPrice + additionalTagsPrice

      if (!addressFound) return totalProductPrice

      // Para produto personalizado: sempre oferecer ambas opções de frete
      if (shippingMethod === "express") {
        return totalProductPrice + 10.52
      }
      return totalProductPrice // Frete grátis padrão
    }

    // Verificar se é produto personalizado de forma mais rigorosa
    const personalizedData = sessionStorage.getItem("personalizedProduct")
    let isPersonalized = false

    if (personalizedData) {
      try {
        const data = JSON.parse(personalizedData)
        // Verificar se realmente tem os dados de personalização
        isPersonalized = !!(data.color && data.amount && data.petName)
      } catch (error) {
        console.error("Erro ao parsear produto personalizado:", error)
        isPersonalized = false
      }
    }

    if (isPersonalized) {
      const data = JSON.parse(personalizedData)
      const basePrice = data.amount / 100 // R$ 49,90 primeira unidade
      const additionalPrice = (quantity - 1) * 9.9 // R$ 9,90 por unidade adicional
      const totalProductPrice = basePrice + additionalPrice

      if (!addressFound) return totalProductPrice

      // Para produto personalizado: frete grátis a partir de 4 unidades
      if (quantity >= 4) {
        return totalProductPrice // Frete grátis
      }

      // Menos de 4 unidades: frete grátis padrão, frete expresso R$ 10,52
      if (shippingMethod === "express") {
        return totalProductPrice + 10.52
      }
      return totalProductPrice // Frete grátis padrão
    }

    // 🔧 CORREÇÃO: Lógica para produtos genéricos (NÃO personalizados)
    if (!addressFound) return 0

    // Para produtos genéricos com 6+ unidades: frete grátis
    if (quantity >= 6) {
      // Primeira unidade grátis + unidades adicionais R$ 9,90 cada
      return (quantity - 1) * 9.9 // Sem frete
    }

    // Para produtos genéricos com menos de 6 unidades: frete R$ 29,39
    const baseShipping = 29.39
    const additionalPrice = (quantity - 1) * 9.9
    return baseShipping + additionalPrice
  }

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
            phone: (phone || "").replace(/\D/g, ""),
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

        // 📱 Meta Pixel - AddPaymentInfo com Advanced Matching
        if (typeof window.fbq !== "undefined") {
          // Preparar dados do usuário com hash e formatação correta
          const metaUserData = await prepareMetaPixelUserData({
            email: email,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
          })

          window.fbq("track", "AddPaymentInfo", {
            value: value,
            currency: "BRL",
            content_type: "product",
            content_ids: ["tag-petloo"],
            content_name: "Tag rastreamento Petloo + App",
            content_category: "Pet Tracking",
            num_items: 1,
            // Advanced Matching com dados formatados e hash
            ...metaUserData,
          })

          logMetaPixelEvent("AddPaymentInfo", {
            value: value,
            currency: "BRL",
            ...metaUserData,
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

      // 🆕 USAR DADOS DAS TAGS PERSONALIZADAS SE DISPONÍVEIS
      if (personalizedTags.length > 0) {
        // CORREÇÃO: Primeira tag R$ 49,90, demais R$ 9,90
        const firstTagPrice = 4990 // R$ 49,90 em centavos
        const additionalTagsPrice = (personalizedTags.length - 1) * 990 // R$ 9,90 cada em centavos
        const totalProductPrice = firstTagPrice + additionalTagsPrice

        let finalAmount = totalProductPrice

        // Adicionar frete se necessário
        if (addressFound && personalizedTags.length < 4) {
          if (shippingMethod === "express") {
            finalAmount += 1052 // R$ 10,52 = 1052 centavos
          }
          // Frete padrão é grátis
        }

        // 🎯 USAR VALOR CALCULADO DIRETAMENTE (sem mapeamento incorreto)
        productInfo = {
          amount: finalAmount, // Usar valor calculado diretamente
          name: `Tags Personalizadas (${personalizedTags.length}x)`,
          sku: `TAG-PERSONALIZADA-MULTI-${personalizedTags.length}x`,
          type: "Tag Personalizada",
          color: personalizedTags.map((tag) => (tag.color === "orange" ? "Laranja" : "Roxa")).join(", "),
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
              const baseAmount = data.amount // R$ 49,90 = 4990 centavos primeira unidade
              const additionalAmount = (quantity - 1) * 990 // R$ 9,90 = 990 centavos por unidade adicional
              const totalProductAmount = baseAmount + additionalAmount

              let finalAmount = totalProductAmount
              if (addressFound && quantity < 4) {
                if (shippingMethod === "express") {
                  finalAmount += 1052 // R$ 10,52 = 1052 centavos
                }
                // Frete padrão é grátis
              }

              productInfo = {
                amount: finalAmount, // Usar valor calculado diretamente
                name: `${quantity}x ${data.name}`,
                sku: `TAG-PERSONALIZADA-${data.color.toUpperCase()}-${quantity}x-${quantity >= 4 ? "FREE" : shippingMethod === "express" ? "EXPRESS" : "FREE"}`,
                type: "Tag Personalizada",
                color: data.color === "orange" ? "Laranja" : data.color === "purple" ? "Roxa" : data.color,
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
          const calculatedAmount = Math.round(v2Price * quantity * 100)

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
          // 🎯 PRODUTO GENÉRICO - CALCULAR VALOR CORRETO
          let calculatedAmount = 2939 // Base: frete expresso

          if (quantity >= 5) {
            // Frete grátis + valor das unidades adicionais
            calculatedAmount = (quantity - 1) * 990 // R$ 9,90 por unidade adicional
          } else {
            // Frete + valor das unidades adicionais
            calculatedAmount = 2939 + (quantity - 1) * 990
          }

          productInfo = {
            amount: calculatedAmount, // Usar valor calculado diretamente
            name: "Tag rastreamento Petloo + App",
            sku: `TAG-APP-${quantity}x`,
            type: "Tag Genérica",
            color: "Não se aplica",
            petName: "",
          }

          console.log("💰 Produto genérico - Valor final em centavos:", calculatedAmount)
        }
      }

      console.log("🎯 Produto final para checkout:", productInfo)

      if (paymentMethod === "pix") {
        // Salvar dados do pedido para a página PIX
        const orderDataForPix = {
          personalizedTags: personalizedTags,
          quantity: quantity,
          isPersonalized: personalizedTags.length > 0 || !!sessionStorage.getItem("personalizedProduct"),
        }
        sessionStorage.setItem("orderDataForPixPage", JSON.stringify(orderDataForPix))

        // Salvar dados para a página de Obrigado
        const orderDataForObrigado = {
          personalizedTags: personalizedTags,
          quantity: quantity,
          customerName: name,
          customerEmail: email,
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
            // Disparar eventos de tracking antes do redirecionamento
            // GTM - dataLayer push
            if (typeof window !== "undefined") {
              window.dataLayer = window.dataLayer || []
              window.dataLayer.push({
                event: "purchase",
                ecommerce: {
                  transaction_id: result.orderId,
                  value: productInfo.amount / 100,
                  currency: "BRL",
                  payment_type: "pix",
                  items: [
                    {
                      item_name: productInfo.name,
                      item_id: productInfo.sku,
                      price: productInfo.amount / 100,
                      quantity: quantity,
                    },
                  ],
                },
              })
            }

            // Meta Pixel - InitiateCheckout (PIX pendente)
            if (typeof window !== "undefined" && typeof window.fbq !== "undefined") {
              const metaUserData = await prepareMetaPixelUserData({
                email,
                phone: phone.replace(/\D/g, ""),
                firstName: name.split(" ")[0],
                lastName: name.split(" ").slice(1).join(" "),
                city: addressData.city,
                state: addressData.state,
                zipCode: addressData.cep.replace(/\D/g, ""),
                country: "BR",
              })

              window.fbq("track", "InitiateCheckout", {
                content_name: productInfo.name,
                content_ids: [productInfo.sku],
                content_type: "product",
                value: productInfo.amount / 100,
                currency: "BRL",
                num_items: quantity,
              }, metaUserData)

              logMetaPixelEvent("InitiateCheckout (PIX)", {
                orderId: result.orderId,
                amount: productInfo.amount / 100,
              })
            }

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
                method: "Frete Expresso",
                price: 0, // Frete incluso no total
              },
              items: [
                {
                  quantity: quantity,
                  price: productInfo.amount,
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
              hasSubscription: false,
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

          // Disparar eventos de tracking antes do redirecionamento
          // GTM - dataLayer push - Purchase (cartão aprovado)
          if (typeof window !== "undefined") {
            window.dataLayer = window.dataLayer || []
            window.dataLayer.push({
              event: "purchase",
              ecommerce: {
                transaction_id: result.orderId,
                value: productInfo.amount / 100,
                currency: "BRL",
                payment_type: "credit_card",
                subscription_id: result.subscriptionId,
                items: [
                  {
                    item_name: productInfo.name,
                    item_id: productInfo.sku,
                    price: productInfo.amount / 100,
                    quantity: quantity,
                  },
                ],
              },
            })
          }

          // Meta Pixel - Purchase (cartão aprovado)
          if (typeof window !== "undefined" && typeof window.fbq !== "undefined") {
            const metaUserData = await prepareMetaPixelUserData({
              email,
              phone: phone.replace(/\D/g, ""),
              firstName: name.split(" ")[0],
              lastName: name.split(" ").slice(1).join(" "),
              city: addressData.city,
              state: addressData.state,
              zipCode: addressData.cep.replace(/\D/g, ""),
              country: "BR",
            })

            window.fbq("track", "Purchase", {
              content_name: productInfo.name,
              content_ids: [productInfo.sku],
              content_type: "product",
              value: productInfo.amount / 100,
              currency: "BRL",
              num_items: quantity,
            }, metaUserData)

            logMetaPixelEvent("Purchase (Credit Card)", {
              orderId: result.orderId,
              subscriptionId: result.subscriptionId,
              amount: productInfo.amount / 100,
            })
          }

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
              method: "Frete Expresso",
              price: 0, // Frete incluso no total
            },
            items: [
              {
                quantity: quantity,
                price: productInfo.amount,
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
    <div className="bg-[#f9f9ff] pb-40 min-h-screen" style={{fontFamily: 'Manrope, sans-serif'}}>
      <InitiateCheckoutTracker />
      <AbandonedCartTracker abandonmentTimeSeconds={300} trackPageExit={true} />
      <LeadCaptureTracker />

      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-md flex items-center justify-between px-4 h-16">
        <div>
          <img alt="Petloo Logo" className="h-8 mx-auto" src="https://lh3.googleusercontent.com/aida/ADBb0uii_X6MTPokxaWskI04YdQINniANzfIcar5TFVKh7EQqzUPtXH4ydJOdD6gVByNfEVHCmdSHxwoP01Qh8h-EMSwVxakiKtQhPwyyKPxnTRjFldSZ5yLadfdGd8AIkMANq7emzE1H3rOP7lW-ReqxAu5smyDH-WIpLiBoid6CTp1Z7TGI3mqJphdv4wuL7Jafwalo6hAx16ePyZFTogsLyN_DZbpUkDO5EwZQqj8ZcQbTVnG080IYl80k1Dpl31iiV83jMlornuHoA" />
        </div>
        <span className="material-symbols-outlined text-slate-500">lock</span>
      </header>

      <main className="mt-16 px-4 space-y-6 max-w-lg mx-auto">

        {/* Order Summary */}
        <section className="mt-4">
          <div className="bg-[#f0f3ff] rounded-xl p-4 flex items-center justify-between border border-[rgba(143,112,105,0.15)] cursor-pointer" onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#844981]">shopping_cart</span>
              <span className="font-bold">Resumo do pedido</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#b02600]">R$ {(((ofertaAtual?.price || v2Price || 89.87) * quantity) + getShippingCost()).toFixed(2).replace('.', ',')}</span>
              <span className="material-symbols-outlined text-slate-400">{isOrderSummaryOpen ? 'expand_less' : 'expand_more'}</span>
            </div>
          </div>
          {isOrderSummaryOpen && (
            <div className="bg-white rounded-xl p-4 mt-2 border border-slate-100 space-y-6">
              <div className="flex gap-4">
                <img alt="Product" className="w-24 h-24 rounded-xl object-cover" src={productInfo?.image || "https://lh3.googleusercontent.com/aida/ADBb0uhrqbVYpQXAthxhCcxEXtqN0t9TI-tXui7he8xjYQVzDHonVEIc11BgWbuVJ_blEVqcQtneSy_DbdwA9LWSo0syJ5icUFLSFXoxn4JfJpIZY9xswvc_zoUbKqw-kOVU4se-WLOXSx0QX7Z5N0w2KHJ-RU6BynZxqHy8frxqFi2TGO5HWPFYYsIZB3sj8F0bcsO-29jqYHNJK86Cio4VbFfjkV3U2nAdNprDcrGjE9IMF7IydoVQNW7TbtD1_yhGY-MgLTkdPqiKMw"} />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm">{productInfo?.name || 'Kit de Proteção Lootag'}</h3>
                    <div className="text-right">
                      <p className="font-bold">R$ {(productInfo?.price || 89.87).toFixed(2).replace('.', ',')}</p>
                      <p className="text-[10px] text-slate-400">1º mês grátis</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-slate-200 rounded-full px-2 py-1 gap-4">
                      <button className="text-slate-400 font-bold" onClick={(e) => { e.stopPropagation(); handleQuantityChange(quantity - 1); }}>-</button>
                      <span className="font-bold text-sm">{quantity}</span>
                      <button className="text-slate-400 font-bold" onClick={(e) => { e.stopPropagation(); handleQuantityChange(quantity + 1); }}>+</button>
                    </div>
                    <a className="text-[10px] text-slate-400 leading-tight underline" href="#" onClick={(e) => e.stopPropagation()}>Clique aqui para adicionar mais uma tag</a>
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">Produto ({quantity}x)</span>
                  <span className="font-bold">R$ {((productInfo?.price || 89.87) * quantity).toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold">Frete</span>
                  <span className="font-bold text-emerald-600">{getShippingCost() === 0 ? 'Grátis' : `R$ ${getShippingCost().toFixed(2).replace('.', ',')}`}</span>
                </div>
                <div className="flex justify-between text-xl pt-2">
                  <span className="font-black">Total</span>
                  <span className="font-black">R$ {(((ofertaAtual?.price || v2Price || 89.87) * quantity) + getShippingCost()).toFixed(2).replace('.', ',')}</span>
                </div>
                <p className="text-xs text-slate-400">Em até 3x sem juros</p>
              </div>
            </div>
          )}
        </section>

        {/* Banner */}
        <section className="w-full h-32 rounded-2xl overflow-hidden shadow-sm">
          <img className="w-full h-full object-cover" alt="Pet Petloo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1FKdcNwFYJH9mKUb0PnkjGP1zGNwCCOZ9f3umAQw-iF72ZUkwgA5J3dYrwAooB0xpwps11Vf6V2iJzwXqFnjs-FQpY5BkbbV-Ds17w4kT5i5h-4u9DUhm7mg2XE9N6xhrURTn6dkGixwh-ZadG76Qzs63Fub5emeDAgePDgBmzk7W-uwu0h6c_rylNfywH3x5MAISN-ZDB6MXaPUfUMG4p9WmzulryFLqeOjJuU4P0NingGOcPu5n9cBwNvJ28NwDnDURQBne3aI" />
        </section>

        {/* Personal Info */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#844981]/10 p-1.5 rounded-lg">
              <span className="material-symbols-outlined text-[#844981] text-lg">person</span>
            </span>
            <h2 className="text-lg font-bold tracking-tight">Informações Pessoais</h2>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">E-mail</label>
              <Input className="w-full h-14 bg-[#f0f3ff] border-none rounded-xl px-4 focus:ring-2 focus:ring-[#b02600]/20" placeholder="seu@email.com" type="email" value={addressData.email || ''} onChange={(e) => setAddressData({ ...addressData, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nome completo</label>
              <Input className="w-full h-14 bg-[#f0f3ff] border-none rounded-xl px-4 focus:ring-2 focus:ring-[#b02600]/20" placeholder="Como no documento" type="text" value={addressData.name || ''} onChange={(e) => setAddressData({ ...addressData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Celular</label>
                <Input className="w-full h-14 bg-[#f0f3ff] border-none rounded-xl px-4 focus:ring-2 focus:ring-[#b02600]/20" placeholder="(00) 00000-0000" type="tel" value={addressData.phone || ''} onChange={(e) => setAddressData({ ...addressData, phone: formatPhone(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">CPF</label>
                <Input className="w-full h-14 bg-[#f0f3ff] border-none rounded-xl px-4 focus:ring-2 focus:ring-[#b02600]/20" placeholder="000.000.000-00" type="text" value={addressData.cpf || ''} onChange={(e) => setAddressData({ ...addressData, cpf: formatCPF(e.target.value) })} />
              </div>
            </div>
          </div>
        </section>

        {/* Delivery Info */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#844981]/10 p-1.5 rounded-lg">
              <span className="material-symbols-outlined text-[#844981] text-lg">local_shipping</span>
            </span>
            <h2 className="text-lg font-bold tracking-tight">Informações de Entrega</h2>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">CEP</label>
              <Input className="w-full h-14 bg-[#f0f3ff] border-none rounded-xl px-4 focus:ring-2 focus:ring-[#b02600]/20" placeholder="00000-000" type="text" value={addressData.cep || ''} onChange={(e) => setAddressData({ ...addressData, cep: formatCEP(e.target.value) })} onBlur={(e) => handleAddressFound(e.target.value)} />
            </div>
            {addressFound && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Endereço</label>
                  <Input className="w-full h-14 bg-[#f0f3ff] border-none rounded-xl px-4" value={addressData.street || ''} onChange={(e) => setAddressData({ ...addressData, street: e.target.value })} placeholder="Rua, Avenida..." />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Número</label>
                    <Input className="w-full h-14 bg-[#f0f3ff] border-none rounded-xl px-4" value={addressData.number || ''} onChange={(e) => setAddressData({ ...addressData, number: e.target.value })} placeholder="Nº" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Complemento</label>
                    <Input className="w-full h-14 bg-[#f0f3ff] border-none rounded-xl px-4" value={addressData.complement || ''} onChange={(e) => setAddressData({ ...addressData, complement: e.target.value })} placeholder="Apto, bloco..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cidade</label>
                    <Input className="w-full h-14 bg-[#f0f3ff] border-none rounded-xl px-4" value={addressData.city || ''} onChange={(e) => setAddressData({ ...addressData, city: e.target.value })} placeholder="Cidade" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Estado</label>
                    <Input className="w-full h-14 bg-[#f0f3ff] border-none rounded-xl px-4" value={addressData.state || ''} onChange={(e) => setAddressData({ ...addressData, state: e.target.value })} placeholder="UF" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Payment */}
        <section className="space-y-4">
          <div className="space-y-1 mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Método de pagamento</h2>
            <p className="text-sm text-slate-500">Escolha o seu método de pagamento abaixo</p>
          </div>
          <div className="rounded-2xl border-2 border-[#FADBB2] p-5 space-y-5 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-4 border-[#b02600] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#b02600]"></div>
                </div>
                <span className="font-bold text-lg">Cartão de Crédito</span>
              </div>
              <div className="flex items-center gap-1.5">
                <img alt="Visa" className="h-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCEgPZ4VkmlDAGLP7hPfluJncDRZugcpiQQvxsJAmtZkZ86WHWP0xapCVk9bFRmZL9HjkZv5HVcBGgEOK_2lRl-Ui5-kK_5YiqDuOjextq5y8AHdxtis14G3WM0RToA-7WWsTwekkmWmKoLEQfjEhHpcVc7DWdSu6iZGM1B4wC14pSdn7NWWFw0YaIOwpe0uOfJ3N91pai-XYVRb2uS7miT-kQsw_etCfG1wO67JgkN1mPmg7mdid_A2iXyTL1GsOKSnZPZ4icJ_c" />
                <img alt="Mastercard" className="h-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKEvvUViVaaNvOaNBFTLm9U_siOzIjF2cP_-Py9K2mbtdOCJ6bx4aGyavrl65ciXCYrb2B4dHuqz1MXnYCBOZ5sXePvWBm_VGXaEWES_L1R8I-XMRR3OjHSizBiugWvxYNYxT35gW0k7nLKGSxBGde6N31TsBZtTwiyF6fuOC0mCbgUzxtcE6ZA89_Y9Rl-2ywRHoYtgSjlZc-1ZZnjZJIf9pheCoaSGgGtLxKqWitaw1UHX_PlFe6eN7aiqbGzD6HTjCAhZhDoM4" />
                <div className="bg-[#0170ad] text-white text-[8px] font-bold px-1 rounded-sm flex items-center h-4">AMEX</div>
                <div className="bg-[#f48221] text-white text-[8px] font-bold px-1 rounded-sm flex items-center h-4">Discover</div>
                <span className="text-[10px] text-slate-400 ml-1">E muito mais...</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold ml-1">Número do Cartão</label>
                <Input className="w-full h-14 bg-white border border-slate-200 rounded-xl px-4 placeholder-slate-300 focus:ring-2 focus:ring-[#b02600]/20" placeholder="0000 0000 0000 0000" type="text" value={cardData.number || ''} onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })} maxLength={19} />
                {cardErrors.number && <p className="text-xs text-red-500 ml-1">{cardErrors.number}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold ml-1">Nome no Cartão</label>
                <Input className="w-full h-14 bg-white border border-slate-200 rounded-xl px-4 placeholder-slate-300 focus:ring-2 focus:ring-[#b02600]/20" placeholder="Nome como está no cartão" type="text" value={cardData.name || ''} onChange={(e) => setCardData({ ...cardData, name: e.target.value })} />
                {cardErrors.name && <p className="text-xs text-red-500 ml-1">{cardErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold ml-1">Validade</label>
                  <Input className="w-full h-14 bg-white border border-slate-200 rounded-xl px-4 placeholder-slate-300 focus:ring-2 focus:ring-[#b02600]/20" placeholder="MM/AA" type="text" value={cardData.expiry || ''} onChange={(e) => setCardData({ ...cardData, expiry: formatExpiryDate(e.target.value) })} maxLength={5} />
                  {cardErrors.expiry && <p className="text-xs text-red-500 ml-1">{cardErrors.expiry}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold ml-1">CVV</label>
                  <Input className="w-full h-14 bg-white border border-slate-200 rounded-xl px-4 placeholder-slate-300 focus:ring-2 focus:ring-[#b02600]/20" placeholder="123" type="text" value={cardData.cvv || ''} onChange={(e) => setCardData({ ...cardData, cvv: formatCVV(e.target.value) })} maxLength={4} />
                  {cardErrors.cvv && <p className="text-xs text-red-500 ml-1">{cardErrors.cvv}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold ml-1">Parcelas</label>
                <div className="relative">
                  <select className="w-full h-14 bg-white border border-slate-200 rounded-xl px-4 appearance-none focus:ring-2 focus:ring-[#b02600]/20" value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
                    {installmentOptions.map((opt: { value: number; label: string }) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-4 material-symbols-outlined text-slate-500 pointer-events-none">expand_more</span>
                </div>
                <p className="text-xs font-bold text-emerald-600 ml-1">Até 3x sem juros</p>
              </div>
            </div>
          </div>
          {/* PIX temporariamente oculto — não remover */}
          <div className="hidden">
            <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === "pix" ? "border-orange-300 bg-orange-50/30" : "border-gray-200 hover:border-gray-300"}`} onClick={() => setPaymentMethod("pix")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input type="radio" id="pix" name="payment" value="pix" checked={paymentMethod === "pix"} onChange={(e) => setPaymentMethod(e.target.value)} className="pointer-events-none" />
                  <label htmlFor="pix" className="font-medium cursor-pointer">PIX</label>
                </div>
                <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pix-pQeEaHw1QkFcUBY4A45g43gFx34OWl.svg" alt="PIX" className="h-5" />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="space-y-4 pt-4">
          <h3 className="text-center font-bold text-sm uppercase tracking-widest text-slate-400">O que dizem os tutores</h3>
          <div className="space-y-3">
            {[
              { name: 'Mariana Costa', text: 'O Petloo mudou a rotina do meu cachorro, agora ele se sente muito mais seguro!', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPIdGD_mli54QvgHMRyzFAPbAjULDdIv85RhUhsaNOe0_utq1D_ru7E5410ope1i7WCvkZ2aGh7wzwAX3sZj6VTIl5JFqB8z59ro2KZdzhXqdJSPPmiHfTaNbfj3T4YMaPjyR7W3VBfiD2e-zmjsg1XS6NAhbuRfm1U9FRV4nqi1VFqpc28D7Okxazhi3RAGeyFSQUSnFHgcSjmYnzFj3Z2Rm8QnsuGUCnt-55JfBWlix9XHb3rG1zwYbX1azooPpKo26xqDfEFK8' },
              { name: 'Ricardo Alves', text: 'Entrega super rápida e o material é de altíssima qualidade. Recomendo demais.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmOgO3-TfarsmxNICcsymR6UVIVUK9qbWSgp_LBum5rWcAJzgRFGvNyh4E9kkRqVlAjewWZJGLgsvS6wC8oHwz1Qsrmz4GMbn9Pro1tJKm_Dt7544zQ6lhXc6BQ_PWyoXmZJGkF_23QG5Zg7dHGp8gIIq5KSKyKuar2x-Aeh1MWWcCaltoguQms9txmrrntSvyImiOXJ0ezGtNsEtf7m_sWg43sp1Zz2kSh5TQut119Da32LZUJDVp4a7T_R5bakmzlrLxc2unVoQ' },
              { name: 'Julia Mendes', text: 'Meu gatinho amou o novo cantinho. Finalmente um produto que pensa no bem-estar!', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4Kh0FSb7L6PmvUYdL5kkkwFOqxOHDN4BEg1NBRyVE1df3QpSR1lF3hOG096xdinaYNZ--Xue4raEjsJ8b5Ufh08ipL1VlKGJ477g2abDo095JmWVMSciKxtHxgADUrZHXtLQfVwQNjEE_0_EBDKkGwHW5mViim-AXAxbmW13vaxV_bpA0_36dHMkykN5BugCuWC_dpnKriNPBqPygyJutBsWhPIVGSsa7QlT0RBmGZO548OEgtCglkDVxnmT3pcapQV9TKf2Y2ws' }
            ].map((t) => (
              <div key={t.name} className="bg-white p-4 rounded-2xl shadow-sm border border-[rgba(143,112,105,0.15)] flex gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-[#b02600]/10">
                  <img className="w-full h-full object-cover" src={t.img} alt={t.name} />
                </div>
                <div>
                  <div className="flex text-amber-400 text-xs mb-1">{'★★★★★'.split('').map((_, i) => <span key={i} className="text-amber-400">★</span>)}</div>
                  <p className="text-xs italic leading-relaxed">"{t.text}"</p>
                  <p className="text-[10px] font-bold text-[#844981] mt-1">— {t.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Guarantee */}
        <section className="bg-[#b02600]/5 rounded-3xl p-6 border-2 border-dashed border-[#b02600]/20 text-center space-y-3">
          <div className="w-16 h-16 bg-[#b02600]/10 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[#b02600] text-3xl">verified_user</span>
          </div>
          <h4 className="font-black text-[#b02600] text-lg">30 Dias de Garantia</h4>
          <p className="text-sm text-slate-500 leading-relaxed">Se você não estiver satisfeito com o produto, devolvemos seu dinheiro integralmente em até 30 dias. Risco zero para você!</p>
        </section>

        {checkoutMessage && (
          <div className={`p-4 rounded-xl text-sm font-medium ${checkoutMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
            {checkoutMessage.text}
          </div>
        )}
      </main>

      {/* Fixed Footer CTA */}
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md px-4 pt-4 pb-8 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] border-t border-slate-100">
        <div className="max-w-lg mx-auto space-y-3">
          <Button
            className="w-full h-16 text-white font-black text-lg rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{background: 'linear-gradient(to right, #b02600, #d43f1b)'}}
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processando...' : 'Finalizar Compra'}
            {!isProcessing && <span className="material-symbols-outlined">chevron_right</span>}
          </Button>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <span className="material-symbols-outlined text-sm">shield</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Site Seguro</span>
            </div>
            <p className="text-[10px] text-slate-400 text-center px-6 leading-tight">Ao finalizar, você concorda com nossos Termos de Serviço e Política de Privacidade.</p>
          </div>
        </div>
      </footer>

      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
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
