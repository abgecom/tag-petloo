"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { fbEvents } from "@/lib/fb-events"

interface AbandonedCartTrackerProps {
  abandonmentTimeSeconds?: number
  trackPageExit?: boolean
}

export default function AbandonedCartTracker({
  abandonmentTimeSeconds = 300, // 5 minutos por padrão
  trackPageExit = true,
}: AbandonedCartTrackerProps) {
  const router = useRouter()
  const [hasTriggered, setHasTriggered] = useState(false)
  const [startTime] = useState(Date.now())
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef(Date.now())

  // Função para obter dados do carrinho
  const getCartData = () => {
    const personalizedData = sessionStorage.getItem("personalizedProduct")
    let cartValue = 18.87 // Valor padrão para produto genérico
    let productName = "Tag rastreamento Petloo + App"
    let productType = "Tag Genérica"

    if (personalizedData) {
      try {
        const data = JSON.parse(personalizedData)
        if (data.color && data.amount && data.petName) {
          cartValue = data.amount / 100 // Converter de centavos para reais
          productName = data.name || `Tag ${data.color === "orange" ? "Laranja" : "Roxa"} Personalizada + App`
          productType = "Tag Personalizada"
        }
      } catch (error) {
        console.error("Erro ao parsear produto personalizado:", error)
      }
    }

    return {
      value: cartValue,
      currency: "BRL",
      items: [
        {
          item_id: personalizedData ? "tag-personalizada" : "tag-petloo",
          item_name: productName,
          category: "Pet Tracking",
          quantity: 1,
          price: cartValue,
        },
      ],
      product_type: productType,
    }
  }

  // Função para obter dados do usuário dos campos do formulário
  const getUserData = () => {
    const email = (document.getElementById("email") as HTMLInputElement)?.value || ""
    const name = (document.getElementById("name") as HTMLInputElement)?.value || ""
    const phone = (document.getElementById("phone") as HTMLInputElement)?.value || ""

    // Dividir nome em primeiro e último nome
    const nameParts = name.trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    return {
      email,
      name,
      phone: phone.replace(/\D/g, ""), // Remover formatação do telefone
      firstName,
      lastName,
      hasUserData: !!(email && name && phone),
    }
  }

  // Função para disparar evento de carrinho abandonado
  const triggerAbandonedCartEvent = async (reason: "timeout" | "page_exit") => {
    if (hasTriggered) return

    const cartData = getCartData()
    const userData = getUserData()
    const timeOnPage = Math.floor((Date.now() - startTime) / 1000)

    console.log("🛒 Carrinho Abandonado Detectado:", {
      reason,
      timeOnPage,
      cartValue: cartData.value,
      hasUserData: userData.hasUserData,
    })

    if (typeof window !== "undefined") {
      // 📱 Meta Pixel + CAPI - AddToCart (para remarketing) via fbEvents com deduplicação
      await fbEvents("AddToCart", {
        value: cartData.value,
        currency: cartData.currency,
        content_type: "product",
        content_ids: [cartData.items[0].item_id],
        content_name: cartData.items[0].item_name,
        content_category: "Pet Tracking",
        num_items: 1,
      }, userData.hasUserData ? {
        email: userData.email,
        phone: userData.phone,
        firstName: userData.firstName,
        lastName: userData.lastName,
      } : undefined)

      console.log("📱 Meta Pixel AddToCart (Abandoned) enviado via fbEvents")
    }

    setHasTriggered(true)
  }

  // Função para resetar o timer de abandono
  const resetAbandonmentTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    lastActivityRef.current = Date.now()

    timeoutRef.current = setTimeout(() => {
      triggerAbandonedCartEvent("timeout")
    }, abandonmentTimeSeconds * 1000)
  }

  // Função para detectar saída da página
  const handlePageExit = (event: BeforeUnloadEvent) => {
    // Só disparar se não foi para páginas internas do checkout
    const isInternalNavigation =
      window.location.pathname.includes("/pix-payment") ||
      window.location.pathname.includes("/obrigado") ||
      window.location.pathname.includes("/checkout")

    if (!isInternalNavigation) {
      triggerAbandonedCartEvent("page_exit")
    }
  }

  // Função para detectar interação do usuário
  const handleUserActivity = () => {
    resetAbandonmentTimer()
  }

  useEffect(() => {
    // Iniciar timer de abandono
    resetAbandonmentTimer()

    // Eventos de interação do usuário
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, true)
    })

    // Evento de saída da página
    if (trackPageExit) {
      window.addEventListener("beforeunload", handlePageExit)
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity, true)
      })

      if (trackPageExit) {
        window.removeEventListener("beforeunload", handlePageExit)
      }
    }
  }, [])

  // Parar rastreamento quando usuário vai para PIX ou página de obrigado
  useEffect(() => {
    const handleRouteChange = () => {
      const currentPath = window.location.pathname
      if (currentPath.includes("/pix-payment") || currentPath.includes("/obrigado")) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        setHasTriggered(true) // Parar rastreamento
      }
    }

    // Verificar mudanças de rota
    window.addEventListener("popstate", handleRouteChange)
    handleRouteChange() // Verificar rota atual

    return () => {
      window.removeEventListener("popstate", handleRouteChange)
    }
  }, [])

  return null // Este componente não renderiza nada
}
