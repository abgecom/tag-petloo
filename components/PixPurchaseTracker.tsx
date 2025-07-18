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

export default function PixPurchaseTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window === "undefined") return

    const handlePixPurchase = async () => {
      try {
        // Obter dados da URL ou sessionStorage
        const orderId = searchParams.get("orderId")
        const amount = searchParams.get("amount") || "1887"

        // Tentar obter dados PIX do sessionStorage
        const savedPixData = sessionStorage.getItem("pixPaymentData")
        let pixData = null
        if (savedPixData) {
          try {
            pixData = JSON.parse(savedPixData)
          } catch (error) {
            console.error("Erro ao parsear dados PIX:", error)
          }
        }

        // Gerar transaction_id único
        const transactionId = orderId || pixData?.orderId || `PIX-PETLOO-${new Date().getTime()}`
        const value = Number(amount) / 100 // Converter centavos para reais

        const items = [
          {
            item_id: "tag-petloo",
            item_name: "Tag rastreamento Petloo + App",
            category: "Pet Tracking",
            quantity: 1,
            price: value,
          },
        ]

        // Obter dados do usuário dos cookies (salvos no checkout)
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

        const userEmail = getCookieValue("ploo_email")
        const firstName = getCookieValue("ploo_first_name")
        const lastName = getCookieValue("ploo_last_name")
        const phone = getCookieValue("ploo_phone")

        // 📊 GA4 via GTM - Purchase Event (PIX)
        window.dataLayer = window.dataLayer || []
        window.dataLayer.push({
          event: "purchase",
          ecommerce: {
            transaction_id: transactionId,
            value: value,
            currency: "BRL",
            items: items,
          },
          // Dados adicionais
          customer_data: {
            email: userEmail,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
          },
          payment_method: "PIX",
          payment_status: "pending", // PIX está pendente até confirmação
          page_location: window.location.href,
          page_title: document.title,
          timestamp: new Date().toISOString(),
        })

        console.log("📊 GTM PIX Purchase Event:", {
          event: "purchase",
          transaction_id: transactionId,
          value: value,
          currency: "BRL",
          payment_method: "PIX",
          items: items,
        })

        // 📱 Meta Pixel - Purchase Event (PIX) com Advanced Matching
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
            // PIX specific data
            payment_method: "pix",
          })

          logMetaPixelEvent("PIX Purchase", {
            value: value,
            currency: "BRL",
            transaction_id: transactionId,
            payment_method: "pix",
            ...metaUserData,
          })
        } else {
          console.warn("⚠️ Meta Pixel (fbq) not found - PIX Purchase event not sent")
        }

        // 🎯 Evento personalizado PIX
        window.dataLayer.push({
          event: "pix_purchase_initiated",
          transaction_id: transactionId,
          pix_amount: value,
          pix_status: "generated",
          timestamp: new Date().toISOString(),
        })

        console.log("✅ PIX Purchase tracking completed!")
        console.log("Transaction ID:", transactionId)
        console.log("Value:", `R$ ${value.toFixed(2)}`)
        console.log("Payment Method: PIX")
      } catch (error) {
        console.error("Erro no PIX Purchase Tracker:", error)
      }
    }

    // Executar após um pequeno delay para garantir que os dados estejam disponíveis
    const timer = setTimeout(() => {
      handlePixPurchase()
    }, 1500)

    return () => clearTimeout(timer)
  }, [searchParams]) // Executar quando searchParams mudar

  return null
}
