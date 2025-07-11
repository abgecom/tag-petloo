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
    try {
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
        } catch (parseError) {
          console.warn("⚠️ Erro ao parsear produto personalizado:", parseError)
        }
      }

      return { cartValue, productType }
    } catch (error) {
      console.warn("⚠️ Erro ao obter dados do produto, usando padrões:", error)
      return { cartValue: 18.87, productType: "Tag Genérica" }
    }
  }

  // Função para enviar lead para Make.com
  const sendLeadToMake = async (leadData: LeadData) => {
    try {
      console.log("📧 Tentando enviar lead para Make.com:", leadData)

      // Verificar se estamos no cliente
      if (typeof window === "undefined") {
        console.warn("⚠️ Tentativa de enviar lead no servidor, ignorando")
        return
      }

      const response = await fetch("/api/capture-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadData),
      })

      console.log("📡 Resposta da API capture-lead:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      // Verificar se a resposta é JSON válido
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("❌ Resposta não é JSON:", textResponse)
        throw new Error(`Resposta inválida da API: ${response.status} - ${textResponse}`)
      }

      const result = await response.json()
      console.log("📋 Resultado da API:", result)

      if (response.ok && result.success) {
        console.log("✅ Lead enviado com sucesso:", result)

        // Disparar evento de lead capturado para analytics
        if (typeof window !== "undefined") {
          try {
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

            console.log("📊 GTM Lead Captured Event enviado")

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
            } else {
              console.warn("⚠️ Meta Pixel (fbq) não encontrado")
            }
          } catch (analyticsError) {
            console.warn("⚠️ Erro ao enviar eventos de analytics:", analyticsError)
          }
        }
      } else {
        console.error("❌ Erro na resposta da API:", result)
        throw new Error(result.error || `Erro da API: ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Erro detalhado ao enviar lead:", {
        error: error,
        message: error instanceof Error ? error.message : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : undefined,
        leadData: leadData,
      })

      // Não re-throw o erro para não quebrar a experiência do usuário
      // O lead capture é uma funcionalidade adicional, não crítica
    }
  }

  // Função para verificar e capturar lead
  const checkAndCaptureLead = () => {
    try {
      // Verificar se estamos no cliente
      if (typeof window === "undefined") {
        return
      }

      const emailField = document.getElementById("email") as HTMLInputElement
      const nameField = document.getElementById("name") as HTMLInputElement
      const phoneField = document.getElementById("phone") as HTMLInputElement

      if (!emailField || !nameField || !phoneField) {
        console.warn("⚠️ Campos do formulário não encontrados ainda")
        return
      }

      const email = emailField.value?.trim() || ""
      const name = nameField.value?.trim() || ""
      const phone = phoneField.value?.trim() || ""

      // Verificar se temos dados suficientes para um lead
      const hasValidEmail = email && email.includes("@") && email.includes(".")
      const hasValidName = name && name.length >= 2
      const hasValidPhone = phone && phone.replace(/\D/g, "").length >= 10

      console.log("🔍 Verificando dados do lead:", {
        email: email ? "✅" : "❌",
        name: name ? "✅" : "❌",
        phone: phone ? "✅" : "❌",
        hasValidEmail,
        hasValidName,
        hasValidPhone,
      })

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
        } else {
          console.log("ℹ️ Lead já foi capturado anteriormente:", leadKey)
        }
      }
    } catch (error) {
      console.error("❌ Erro ao verificar lead:", error)
    }
  }

  // Função com debounce para evitar muitas chamadas
  const debouncedLeadCheck = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      checkAndCaptureLead()
    }, 1500) // Aumentar para 1.5 segundos para dar tempo dos campos carregarem
  }

  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window === "undefined") {
      return
    }

    // Aguardar um pouco para os campos carregarem
    const initTimer = setTimeout(() => {
      try {
        // Monitorar mudanças nos campos de entrada
        const emailField = document.getElementById("email")
        const nameField = document.getElementById("name")
        const phoneField = document.getElementById("phone")

        if (!emailField || !nameField || !phoneField) {
          console.warn("⚠️ Campos do formulário não encontrados, tentando novamente...")
          // Tentar novamente após mais tempo
          setTimeout(() => {
            debouncedLeadCheck()
          }, 2000)
          return
        }

        const handleInputChange = () => {
          debouncedLeadCheck()
        }

        // Adicionar listeners
        emailField.addEventListener("input", handleInputChange)
        nameField.addEventListener("input", handleInputChange)
        phoneField.addEventListener("input", handleInputChange)

        // Verificar também quando os campos perdem o foco
        emailField.addEventListener("blur", handleInputChange)
        nameField.addEventListener("blur", handleInputChange)
        phoneField.addEventListener("blur", handleInputChange)

        console.log("✅ LeadCaptureTracker inicializado com sucesso")

        // Cleanup function
        return () => {
          emailField?.removeEventListener("input", handleInputChange)
          nameField?.removeEventListener("input", handleInputChange)
          phoneField?.removeEventListener("input", handleInputChange)
          emailField?.removeEventListener("blur", handleInputChange)
          nameField?.removeEventListener("blur", handleInputChange)
          phoneField?.removeEventListener("blur", handleInputChange)
        }
      } catch (error) {
        console.error("❌ Erro ao inicializar LeadCaptureTracker:", error)
      }
    }, 1000) // Aguardar 1 segundo para os campos carregarem

    // Cleanup
    return () => {
      clearTimeout(initTimer)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return null // Este componente não renderiza nada
}
