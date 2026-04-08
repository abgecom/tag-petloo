"use client"

import { useEffect, useState } from "react"
import { fbEvents } from "@/lib/fb-events"

// Extend Window interface to include fbq
declare global {
  interface Window {
    fbq: (action: string, event: string, params?: any) => void
  }
}

interface LeadData {
  email: string
  name: string
  phone: string
  productType: string
  cartValue: number
}

async function sendLeadToMake(leadData: LeadData, pageUrl: string) {
  try {
    console.log("📧 Tentando enviar lead para Make.com:", {
      email: leadData.email,
      name: leadData.name,
      phone: leadData.phone,
      source: "checkout_form",
      page_url: pageUrl,
      timestamp: new Date().toISOString(),
      product_type: leadData.productType,
      cart_value: leadData.cartValue,
    })

    const response = await fetch("/api/capture-lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: leadData.email,
        name: leadData.name,
        phone: leadData.phone,
        source: "checkout_form",
        page_url: pageUrl,
        timestamp: new Date().toISOString(),
        product_type: leadData.productType,
        cart_value: leadData.cartValue,
      }),
    })

    console.log("📡 Resposta da API capture-lead:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    let result
    const contentType = response.headers.get("content-type")

    if (contentType && contentType.includes("application/json")) {
      result = await response.json()
    } else {
      const textResult = await response.text()
      console.log("📋 Resposta em texto:", textResult)
      result = textResult || "Lead capturado e enviado com sucesso"
    }

    console.log("📋 Resultado da API:", result)
    return result
  } catch (error) {
    console.error("❌ Erro detalhado ao enviar lead:", error)

    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error("Erro de conexão - verifique sua internet")
    }

    if (error instanceof SyntaxError) {
      throw new Error("Resposta inválida da API - formato não JSON")
    }

    throw error
  }
}

export default function LeadCaptureTracker() {
  const [hasTracked, setHasTracked] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || hasTracked) return

    console.log("✅ LeadCaptureTracker inicializado com sucesso")

    const trackLead = async () => {
      try {
        // Aguardar um pouco para garantir que os campos foram preenchidos
        await new Promise((resolve) => setTimeout(resolve, 3000))

        // Obter dados dos campos do formulário
        const emailField = document.querySelector('input[name="email"]') as HTMLInputElement
        const nameField = document.querySelector('input[name="name"]') as HTMLInputElement
        const phoneField = document.querySelector('input[name="phone"]') as HTMLInputElement

        if (!emailField || !nameField || !phoneField) {
          console.log("🔍 Campos do formulário não encontrados ainda, tentando novamente...")
          return
        }

        const email = emailField.value?.trim()
        const name = nameField.value?.trim()
        const phone = phoneField.value?.trim()

        // Validações básicas
        const hasValidEmail = email && email.includes("@") && email.includes(".")
        const hasValidName = name && name.length >= 2
        const hasValidPhone = phone && phone.length >= 10

        console.log("🔍 Verificando dados do lead:", {
          email: hasValidEmail ? "✅" : "❌",
          name: hasValidName ? "✅" : "❌",
          phone: hasValidPhone ? "✅" : "❌",
          hasValidEmail,
          hasValidName,
          hasValidPhone,
        })

        if (!hasValidEmail || !hasValidName || !hasValidPhone) {
          console.log("⏳ Dados ainda não estão completos, aguardando...")
          return
        }

        // Verificar se é produto personalizado ou genérico
        const urlParams = new URLSearchParams(window.location.search)
        const isPersonalized = urlParams.get("personalized") === "true"
        const amount = urlParams.get("amount")

        const productType = isPersonalized ? "Tag Personalizada" : "Tag Genérica"
        const cartValue = amount ? Number(amount) / 100 : isPersonalized ? 49.9 : 18.87

        const leadData: LeadData = {
          email,
          name,
          phone,
          productType,
          cartValue,
        }

        console.log("🎯 Lead capturado:", leadData)

        // Marcar como rastreado para evitar duplicatas
        setHasTracked(true)

        // Enviar para Make.com
        try {
          const result = await sendLeadToMake(leadData, window.location.href)
          console.log("✅ Lead enviado com sucesso:", result)
        } catch (error) {
          console.error("❌ Erro ao enviar lead:", error)
          // Não bloquear o tracking mesmo se o webhook falhar
        }

        // 📱 Meta Pixel + CAPI - Lead Event via fbEvents com deduplicação
        await fbEvents("Lead", {
          content_name: productType,
          content_category: "Pet Tracking",
          value: cartValue,
          currency: "BRL",
        }, {
          email: email,
          phone: phone,
          firstName: name.split(" ")[0],
          lastName: name.split(" ").slice(1).join(" "),
        })

        console.log("📱 Meta Pixel Lead Event enviado via fbEvents")
      } catch (error) {
        console.error("❌ Erro no LeadCaptureTracker:", error)
      }
    }

    // Executar múltiplas vezes para capturar quando os dados estiverem disponíveis
    const intervals = [5000, 10000, 15000, 20000] // 5s, 10s, 15s, 20s
    const timeouts: NodeJS.Timeout[] = []

    intervals.forEach((delay) => {
      const timeout = setTimeout(() => {
        if (!hasTracked) {
          trackLead()
        }
      }, delay)
      timeouts.push(timeout)
    })

    // Cleanup
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout))
    }
  }, [hasTracked])

  return null
}
