"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { prepareMetaPixelUserData, logMetaPixelEvent } from "@/utils/metaPixelUtils"

// Extend Window interface to include dataLayer and fbq
declare global {
  interface Window {
    dataLayer: any[]
    fbq: (action: string, event: string, params?: any) => void
  }
}

interface PurchaseData {
  transactionId?: string
  customerName?: string
  customerEmail?: string
  amount?: number
  paymentMethod?: string
  orderId?: string
}

export default function PurchaseTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window === "undefined") return

    // Função para obter dados da compra
    const getPurchaseData = (): PurchaseData => {
      // Tentar obter dados do sessionStorage primeiro
      const savedOrderData = sessionStorage.getItem("orderSummary")
      if (savedOrderData) {
        try {
          const parsedData = JSON.parse(savedOrderData)
          // Se o valor for maior que 100, está em centavos, senão já está em reais
          const amountInCentavos = parsedData.amount > 100 ? parsedData.amount : parsedData.amount * 100
          return {
            ...parsedData,
            amount: amountInCentavos, // Garantir que está em centavos para o tracker
          }
        } catch (error) {
          console.error("Erro ao parsear dados do pedido:", error)
        }
      }

      // Fallback para parâmetros da URL
      return {
        transactionId: searchParams.get("orderId") || undefined,
        customerName: searchParams.get("name") || undefined,
        customerEmail: searchParams.get("email") || undefined,
        amount: searchParams.get("amount") ? Number(searchParams.get("amount")) : 1887,
        paymentMethod: searchParams.get("method") || "Cartão de Crédito",
      }
    }

    const handleSuccessfulPayment = async () => {
      const purchaseData = getPurchaseData()

      // Só disparar para pagamentos com cartão (PIX já foi disparado na página do PIX)
      if (purchaseData.paymentMethod === "PIX") {
        console.log("⚠️ Purchase PIX já foi rastreado na página do PIX - pulando evento duplicado")
        return
      }

      // Gerar transaction_id único se não existir
      const transactionId = purchaseData.transactionId || purchaseData.orderId || `CARD-PETLOO-${new Date().getTime()}`

      const value = (purchaseData.amount || 1887) / 100 // Sempre converter centavos para reais aqui
      const items = [
        {
          item_id: "tag-petloo",
          item_name: "Tag rastreamento Petloo + App",
          category: "Pet Tracking",
          quantity: 1,
          price: value,
        },
      ]

      // Obter dados do usuário dos cookies (salvos anteriormente)
      const getCookieValue = (name: string): string => {
        if (typeof document !== "undefined") {
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) {
            return decodeURIComponent(parts.pop()?.split(";").shift() || "")
          }
        }
        return ""
      }

      const userEmail = getCookieValue("ploo_email") || purchaseData.customerEmail || ""
      const firstName = getCookieValue("ploo_first_name") || ""
      const lastName = getCookieValue("ploo_last_name") || ""
      const phone = getCookieValue("ploo_phone") || ""

      if (typeof window !== "undefined") {
        // 📊 GA4 via GTM - Purchase Event (Cartão)
        window.dataLayer = window.dataLayer || []
        window.dataLayer.push({
          event: "purchase",
          ecommerce: {
            transaction_id: transactionId,
            value: value,
            currency: "BRL",
            items: items,
          },
          // Dados adicionais para Enhanced Ecommerce
          customer_data: {
            email: userEmail,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
          },
          payment_method: purchaseData.paymentMethod || "Cartão de Crédito",
          payment_status: "completed", // Cartão já foi processado
          page_location: window.location.href,
          page_title: document.title,
          timestamp: new Date().toISOString(),
        })

        console.log("📊 GTM Card Purchase Event:", {
          event: "purchase",
          transaction_id: transactionId,
          value: value,
          currency: "BRL",
          items: items,
          payment_method: purchaseData.paymentMethod,
        })

        // 📱 Meta Pixel - Purchase Event (Cartão) com Advanced Matching
        if (typeof window.fbq !== "undefined") {
          // Preparar dados do usuário com hash e formatação correta
          const metaUserData = await prepareMetaPixelUserData({
            email: userEmail,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
          })

          window.fbq("track", "Purchase", {
            value: value,
            currency: "BRL",
            transaction_id: transactionId,
            content_type: "product",
            content_ids: ["tag-petloo"],
            content_name: "Tag rastreamento Petloo + App",
            content_category: "Pet Tracking",
            num_items: 1,
            // Advanced Matching com dados formatados e hash
            ...metaUserData,
            // Card specific data
            payment_method: "credit_card",
          })

          logMetaPixelEvent("Card Purchase", {
            value: value,
            currency: "BRL",
            transaction_id: transactionId,
            payment_method: "card",
            ...metaUserData,
          })
        } else {
          console.warn("⚠️ Meta Pixel (fbq) not found - Card Purchase event not sent")
        }

        // 🎯 Evento personalizado para remarketing
        window.dataLayer.push({
          event: "petloo_purchase_complete",
          customer_lifetime_value: value,
          product_category: "Pet Tracking",
          purchase_timestamp: new Date().toISOString(),
          payment_method: "card",
        })

        console.log("✅ Card Purchase tracking completed successfully!")
        console.log("Transaction ID:", transactionId)
        console.log("Value:", `R$ ${value.toFixed(2)}`)
        console.log("Payment Method:", purchaseData.paymentMethod)
      }
    }

    // Executar o rastreamento após um pequeno delay para garantir que a página carregou
    const timer = setTimeout(() => {
      handleSuccessfulPayment()
    }, 1000)

    // Cleanup
    return () => clearTimeout(timer)
  }, []) // Executar apenas uma vez quando o componente montar

  return null
}
