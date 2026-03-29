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
                    fromV2={fromV2}
                    v2Price={v2Price}
                    ofertaAtual={ofertaAtual}
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

                  // 🆕 TAMBÉM CONSIDERAR PERSONALIZADO SE TEMOS TAGS CONFIGURADAS
                  if (personalizedTags.length > 0) {
                    isPersonalized = true
                  }

                  // 🔧 OFERTA DINÂMICA: frete sempre grátis para fromV2
                  if (fromV2 && ofertaAtual?.freteGratis) {
                    return (
                      <div className="border-2 rounded-lg p-4 border-green-300 bg-green-50/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">Frete Expresso</p>
                              <p className="text-sm text-gray-600">1 a 7 dias (Entrega)</p>
                              <p className="text-xs text-gray-500">
                                <span className="line-through text-gray-400">R$ 29,39</span>
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-green-600">Grátis</span>
                        </div>
                      </div>
                    )
                  }

                  // 🆕 MENSAGEM ESPECÍFICA PARA PRODUTOS GENÉRICOS
                  if (!isPersonalized && quantity < 6) {
                    return (
                      <>
                        {/* Aviso sobre frete grátis para produtos genéricos */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <p className="text-blue-800 text-sm">
                            💡 <strong>Dica:</strong> Pedidos com 6 tags ou mais ganham <strong>frete grátis</strong>!
                            Você está a {6 - quantity} tag{6 - quantity > 1 ? "s" : ""} de conseguir o frete grátis.
                          </p>
                        </div>

                        {/* Para produto genérico com frete fixo */}
                        <div className="border-2 rounded-lg p-4 border-orange-300 bg-orange-50/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                id="express"
                                name="shipping"
                                value="express"
                                checked={true}
                                readOnly
                                className="pointer-events-none"
                              />
                              <div>
                                <label htmlFor="express" className="font-medium">
                                  Frete Expresso
                                </label>
                                <p className="text-sm text-gray-600">1 a 7 dias (Entrega)</p>
                                <p className="text-xs text-gray-500">Valor fixo independente da quantidade</p>
                              </div>
                            </div>
                            <span className="font-semibold">R$ 29,39</span>
                          </div>
                        </div>
                      </>
                    )
                  }

                  // Aviso sobre frete grátis quando já tem 6+ unidades (genérico)
                  if (!isPersonalized && quantity >= 6) {
                    return (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <p className="text-green-800 font-medium">
                            🎉 <strong>Parabéns!</strong> Com {quantity} unidades, seu frete é <strong>GRÁTIS</strong>!
                          </p>
                        </div>

                        <div className="border-2 rounded-lg p-4 border-green-300 bg-green-50/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                id="free-shipping"
                                name="shipping"
                                value="free"
                                checked={true}
                                readOnly
                                className="pointer-events-none"
                              />
                              <div>
                                <label htmlFor="free-shipping" className="font-medium">
                                  Frete Grátis
                                </label>
                                <p className="text-sm text-gray-600">1 a 7 dias (Entrega)</p>
                              </div>
                            </div>
                            <span className="font-semibold text-green-600">Grátis</span>
                          </div>
                        </div>
                      </>
                    )
                  }

                  // Para produtos personalizados (mantém a lógica existente)
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
                                <p className="text-sm text-gray-600">15 a 20 dias (Produção) + 4 a 12 dias (Entrega)</p>
                              </div>
                            </div>
                            <span className="font-semibold text-green-600">Grátis</span>
                          </div>
                        </div>

                        {/* Frete Expresso para produto personalizado - sempre disponível */}
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
                                <p className="text-sm text-gray-600">15 a 20 dias (Produção) + 1 a 3 dias (Entrega)</p>
                              </div>
                            </div>
                            <span className="font-semibold">R$ 10,52</span>
                          </div>
                        </div>
                      </>
                    )
                  }

                  return null
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

                {/* PIX temporariamente oculto — não remover */}
                <div className="hidden">
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
                          <li>• Valor à vista R$ {getShippingCost().toFixed(2).replace(".", ",")};</li>
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
                setQuantity={handleQuantityChange}
                shippingMethod={shippingMethod}
                addressFound={addressFound}
                personalizedTags={personalizedTags}
                onEditTag={handleEditTag}
                fromV2={fromV2}
                v2Price={v2Price}
                ofertaAtual={ofertaAtual}
              />
            </div>
          </div>
        </div>

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
        />

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
