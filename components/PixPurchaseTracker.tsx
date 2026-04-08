"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { fbEvents } from "@/lib/fb-events"

// Extend Window interface to include fbq
declare global {
  interface Window {
    fbq: (action: string, event: string, params?: any) => void
  }
}

export default function PixPurchaseTracker() {
  const searchParams = useSearchParams()
  const hasTrackedRef = useRef(false) // Flag para evitar múltiplos disparos

  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window === "undefined") return

    // Se já foi executado, não executar novamente
    if (hasTrackedRef.current) {
      console.log("🚫 PIX Purchase já foi rastreado, pulando...")
      return
    }

    const handlePixPurchase = async () => {
      try {
        // Marcar como executado IMEDIATAMENTE para evitar duplicatas
        hasTrackedRef.current = true

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

        // 📱 Meta Pixel + CAPI - Purchase Event (PIX) via fbEvents com deduplicação
        await fbEvents("Purchase", {
          value: value,
          currency: "BRL",
          transaction_id: transactionId,
          content_type: "product",
          content_ids: ["tag-petloo"],
          content_name: "Tag rastreamento Petloo + App",
          content_category: "Pet Tracking",
          num_items: 1,
          payment_method: "pix",
        }, {
          email: userEmail,
          phone: phone,
          firstName: firstName,
          lastName: lastName,
        })

        // Salvar no sessionStorage que o evento já foi disparado
        sessionStorage.setItem("pix_purchase_tracked", transactionId)

        console.log("✅ PIX Purchase tracking completed (ÚNICO DISPARO)!")
        console.log("Transaction ID:", transactionId)
        console.log("Value:", `R$ ${value.toFixed(2)}`)
        console.log("Payment Method: PIX")
      } catch (error) {
        console.error("Erro no PIX Purchase Tracker:", error)
        // Em caso de erro, resetar a flag para permitir nova tentativa
        hasTrackedRef.current = false
      }
    }

    // Verificar se já foi rastreado no sessionStorage
    const orderId = searchParams.get("orderId")
    const alreadyTracked = sessionStorage.getItem("pix_purchase_tracked")

    if (alreadyTracked === orderId) {
      console.log("🚫 PIX Purchase já foi rastreado para este pedido:", orderId)
      return
    }

    // Executar após um pequeno delay para garantir que os dados estejam disponíveis
    const timer = setTimeout(() => {
      handlePixPurchase()
    }, 1500)

    return () => {
      clearTimeout(timer)
    }
  }, [searchParams]) // Executar apenas quando searchParams mudar

  return null
}
