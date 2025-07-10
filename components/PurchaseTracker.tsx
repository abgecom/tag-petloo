"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

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
    // Função para obter dados da compra
    const getPurchaseData = (): PurchaseData => {
      // Tentar obter dados do sessionStorage primeiro
      const savedOrderData = sessionStorage.getItem("orderSummary")
      if (savedOrderData) {
        try {
          return JSON.parse(savedOrderData)
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
        paymentMethod: searchParams.get("method") || "PIX",
      }
    }

    const handleSuccessfulPayment = () => {
      const purchaseData = getPurchaseData()

      // Gerar transaction_id único se não existir
      const transactionId = purchaseData.transactionId || purchaseData.orderId || `TX-PETLOO-${new Date().getTime()}`

      const value = (purchaseData.amount || 1887) / 100 // Converter centavos para reais
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
        // 📊 GA4 via GTM - Purchase Event
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
          payment_method: purchaseData.paymentMethod || "PIX",
          page_location: window.location.href,
          page_title: document.title,
          timestamp: new Date().toISOString(),
        })

        console.log("📊 GTM Purchase Event:", {
          event: "purchase",
          transaction_id: transactionId,
          value: value,
          currency: "BRL",
          items: items,
          payment_method: purchaseData.paymentMethod,
        })

        // 📱 Meta Pixel - Purchase Event
        if (typeof window.fbq !== "undefined") {
          window.fbq("track", "Purchase", {
            value: value,
            currency: "BRL",
            transaction_id: transactionId,
            content_type: "product",
            content_ids: ["tag-petloo"],
            content_name: "Tag rastreamento Petloo + App",
            content_category: "Pet Tracking",
            num_items: 1,
            // Advanced Matching para Meta Pixel
            em: userEmail,
            fn: firstName,
            ln: lastName,
            ph: phone,
          })

          console.log("📱 Meta Pixel Purchase Event:", {
            value: value,
            currency: "BRL",
            transaction_id: transactionId,
            em: userEmail ? "✅ Presente" : "❌ Ausente",
            fn: firstName ? "✅ Presente" : "❌ Ausente",
          })
        } else {
          console.warn("⚠️ Meta Pixel (fbq) not found - Purchase event not sent")
        }

        // 🎯 Evento personalizado para remarketing
        window.dataLayer.push({
          event: "petloo_purchase_complete",
          customer_lifetime_value: value,
          product_category: "Pet Tracking",
          purchase_timestamp: new Date().toISOString(),
        })

        console.log("✅ Purchase tracking completed successfully!")
        console.log("Transaction ID:", transactionId)
        console.log("Value:", `R$ ${value.toFixed(2)}`)
        console.log("Customer Email:", userEmail ? "✅ Presente" : "❌ Não encontrado")
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
