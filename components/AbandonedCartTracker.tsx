"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { prepareMetaPixelUserData, logMetaPixelEvent } from "@/utils/metaPixelUtils"

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

    // Determinar nível de engajamento
    let engagementLevel = "low"
    if (userData.hasUserData) {
      engagementLevel = "high"
    } else if (userData.email || userData.name) {
      engagementLevel = "medium"
    }

    if (typeof window !== "undefined") {
      // 📊 GA4 via GTM - Abandoned Cart
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: "abandoned_cart",
        ecommerce: {
          currency: cartData.currency,
          value: cartData.value,
          items: cartData.items,
        },
        abandonment_reason: reason,
        time_on_checkout_page: timeOnPage,
        engagement_level: engagementLevel,
        user_data: userData.hasUserData
          ? {
              email: userData.email,
              first_name: userData.firstName,
              last_name: userData.lastName,
              phone: userData.phone,
            }
          : {},
        page_location: window.location.href,
        timestamp: new Date().toISOString(),
      })

      console.log("📊 GTM Abandoned Cart Event:", {
        event: "abandoned_cart",
        value: cartData.value,
        currency: cartData.currency,
        reason,
        engagement_level: engagementLevel,
      })

      // 📱 Meta Pixel - AddToCart (para remarketing) com Advanced Matching
      if (typeof window.fbq !== "undefined") {
        // Preparar dados do usuário com hash e formatação correta (se disponível)
        let metaUserData = {}
        if (userData.hasUserData) {
          metaUserData = await prepareMetaPixelUserData({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
          })
        }

        window.fbq("track", "AddToCart", {
          value: cartData.value,
          currency: cartData.currency,
          content_type: "product",
          content_ids: [cartData.items[0].item_id],
          content_name: cartData.items[0].item_name,
          content_category: "Pet Tracking",
          num_items: 1,
          custom_data: {
            abandonment_reason: reason,
            checkout_step: engagementLevel,
            time_on_page: timeOnPage,
          },
          // Advanced Matching se tiver dados do usuário
          ...metaUserData,
        })

        logMetaPixelEvent("AddToCart (Abandoned)", {
          value: cartData.value,
          currency: cartData.currency,
          reason,
          engagement_level: engagementLevel,
          ...metaUserData,
        })
      } else {
        console.warn("⚠️ Meta Pixel (fbq) not found - Abandoned cart event not sent")
      }
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
