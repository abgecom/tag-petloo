"use client"

import { useEffect } from "react"

// Extend Window interface to include dataLayer and fbq
declare global {
  interface Window {
    dataLayer: any[]
    fbq: (action: string, event: string, params?: any) => void
  }
}

export default function InitiateCheckoutTracker() {
  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window === "undefined") return

    const value = 18.87 // Valor real da compra em BRL
    const items = [
      {
        item_id: "tag-petloo",
        item_name: "Tag rastreamento Petloo + App",
        category: "Pet Tracking",
        quantity: 1,
        price: 18.87,
      },
    ]

    // GTM/GA4 Event - Begin Checkout
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: "begin_checkout",
      ecommerce: {
        currency: "BRL",
        value: value,
        items: items,
      },
      // Additional custom parameters
      page_location: window.location.href,
      page_title: document.title,
      timestamp: new Date().toISOString(),
    })

    console.log("📊 GTM Begin Checkout Event:", {
      event: "begin_checkout",
      value: value,
      currency: "BRL",
      items: items,
    })

    // Meta Pixel Event - InitiateCheckout
    if (typeof window.fbq !== "undefined") {
      window.fbq("track", "InitiateCheckout", {
        value: value,
        currency: "BRL",
        content_type: "product",
        content_ids: ["tag-petloo"],
        content_name: "Tag rastreamento Petloo + App",
        content_category: "Pet Tracking",
        num_items: 1,
      })

      console.log("📱 Meta Pixel InitiateCheckout Event:", {
        value: value,
        currency: "BRL",
        content_ids: ["tag-petloo"],
      })
    } else {
      console.warn("⚠️ Meta Pixel (fbq) not found - InitiateCheckout event not sent")
    }
  }, []) // Run only once when component mounts

  return null
}
