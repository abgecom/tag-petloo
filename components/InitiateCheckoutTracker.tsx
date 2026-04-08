"use client"

import { useEffect } from "react"
import { fbEvents } from "@/lib/fb-events"

// Extend Window interface to include fbq
declare global {
  interface Window {
    fbq: (action: string, event: string, params?: any) => void
  }
}

export default function InitiateCheckoutTracker() {
  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window === "undefined") return

    const handleInitiateCheckout = async () => {
      // 📱 Meta Pixel + CAPI - InitiateCheckout via fbEvents com deduplicação
      await fbEvents("InitiateCheckout", {
        value: 18.87,
        currency: "BRL",
        content_type: "product",
        content_ids: ["tag-petloo"],
        content_name: "Tag rastreamento Petloo + App",
        content_category: "Pet Tracking",
        num_items: 1,
      })
      // Nota: sem userData aqui pois o usuário ainda não preencheu dados

      console.log("📱 Meta Pixel InitiateCheckout Event enviado via fbEvents")
    }

    handleInitiateCheckout()
  }, []) // Run only once when component mounts

  return null
}
