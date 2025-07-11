"use client"

import { useEffect, useRef, useState } from "react"

interface LeadData {
  email: string
  name: string
  phone: string
  source: string
  page_url: string
  timestamp: string
  product_type: string
  cart_value: number
}

export default function LeadCaptureTracker() {
  const [capturedLeads, setCapturedLeads] = useState<Set<string>>(new Set())
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Função para obter dados do produto/carrinho
  const getProductData = () => {
    const personalizedData = sessionStorage.getItem("personalizedProduct")
    let cartValue = 18.87 // Valor padrão para produto genérico
    let productType = "Tag Genérica"

    if (personalizedData) {
      try {
        const data = JSON.parse(personalizedData)
        if (data.color && data.amount && data.petName) {
          cartValue = data.amount / 100 // Converter de centavos para reais
          productType = "Tag Personalizada"
        }
      } catch (error) {
        console.error("Erro ao parsear produto personalizado:", error)
      }
    }

    return { cartValue, productType }
  }

  // Função para enviar lead para Make.com
  const sendLeadToMake = async (leadData: LeadData) => {
    try {
      console.log("📧 Enviando lead para Make.com:", leadData)

      const response = await fetch("/api/capture-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Lead enviado com sucesso:", result)

        // Disparar evento de lead capturado para analytics
        if (typeof window !== "undefined") {
          // 📊 GA4 via GTM - Lead Captured
          window.dataLayer = window.dataLayer || []
          window.dataLayer.push({
            event: "lead_captured",
            lead_source: "checkout_form",
            lead_value: leadData.cart_value,
            product_type: leadData.product_type,
            user_data: {
              email: leadData.email,
              name: leadData.name,
              phone: leadData.phone,
            },
            page_location: window.location.href,
            timestamp: new Date().toISOString(),
          })

          // 📱 Meta Pixel - Lead
          if (typeof window.fbq !== "undefined") {
            const nameParts = leadData.name.trim().split(" ")
            const firstName = nameParts[0] || ""
            const lastName = nameParts.slice(1).join(" ") || ""

            window.fbq("track", "Lead", {
              value: leadData.cart_value,
              currency: "BRL",
              content_name: leadData.product_type,
              content_category: "Pet Tracking",
              // Advanced Matching
              em: leadData.email,
              fn: firstName,
              ln: lastName,
              ph: leadData.phone.replace(/\D/g, ""),
            })

            console.log("📱 Meta Pixel Lead Event enviado")
          }
        }
      } else {
        console.error("❌ Erro ao enviar lead:", response.statusText)
      }
    } catch (error) {
      console.error("❌ Erro na requisição de lead:", error)
    }
  }

  // Função para verificar e capturar lead
  const checkAndCaptureLead = () => {
    const email = (document.getElementById("email") as HTMLInputElement)?.value?.trim() || ""
    const name = (document.getElementById("name") as HTMLInputElement)?.value?.trim() || ""
    const phone = (document.getElementById("phone") as HTMLInputElement)?.value?.trim() || ""

    // Verificar se temos dados suficientes para um lead
    const hasValidEmail = email && email.includes("@") && email.includes(".")
    const hasValidName = name && name.length >= 2
    const hasValidPhone = phone && phone.replace(/\D/g, "").length >= 10

    if (hasValidEmail && hasValidName && hasValidPhone) {
      // Criar chave única para este lead
      const leadKey = `${email}-${phone.replace(/\D/g, "")}`

      // Verificar se já capturamos este lead
      if (!capturedLeads.has(leadKey)) {
        const { cartValue, productType } = getProductData()

        const leadData: LeadData = {
          email,
          name,
          phone: phone.replace(/\D/g, ""), // Limpar formatação
          source: "checkout_form",
          page_url: window.location.href,
          timestamp: new Date().toISOString(),
          product_type: productType,
          cart_value: cartValue,
        }

        // Marcar como capturado
        setCapturedLeads((prev) => new Set([...prev, leadKey]))

        // Enviar para Make.com
        sendLeadToMake(leadData)

        console.log("🎯 Lead capturado:", {
          email,
          name,
          phone: phone.replace(/\D/g, ""),
          productType,
          cartValue,
        })
      }
    }
  }

  // Função com debounce para evitar muitas chamadas
  const debouncedLeadCheck = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      checkAndCaptureLead()
    }, 1000) // Aguardar 1 segundo após parar de digitar
  }

  useEffect(() => {
    // Monitorar mudanças nos campos de entrada
    const emailField = document.getElementById("email")
    const nameField = document.getElementById("name")
    const phoneField = document.getElementById("phone")

    const handleInputChange = () => {
      debouncedLeadCheck()
    }

    // Adicionar listeners
    emailField?.addEventListener("input", handleInputChange)
    nameField?.addEventListener("input", handleInputChange)
    phoneField?.addEventListener("input", handleInputChange)

    // Verificar também quando os campos perdem o foco
    emailField?.addEventListener("blur", handleInputChange)
    nameField?.addEventListener("blur", handleInputChange)
    phoneField?.addEventListener("blur", handleInputChange)

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      emailField?.removeEventListener("input", handleInputChange)
      nameField?.removeEventListener("input", handleInputChange)
      phoneField?.removeEventListener("input", handleInputChange)
      emailField?.removeEventListener("blur", handleInputChange)
      nameField?.removeEventListener("blur", handleInputChange)
      phoneField?.removeEventListener("blur", handleInputChange)
    }
  }, [])

  return null // Este componente não renderiza nada
}
