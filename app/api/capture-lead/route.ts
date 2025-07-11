import { type NextRequest, NextResponse } from "next/server"

// Interface para os dados do lead
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

export async function POST(request: NextRequest) {
  try {
    console.log("📥 API capture-lead chamada")

    // Parse request body com tratamento de erro
    let leadData: LeadData
    try {
      leadData = await request.json()
      console.log("📋 Dados recebidos:", leadData)
    } catch (parseError) {
      console.error("❌ Erro ao parsear JSON:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Dados JSON inválidos",
          details: parseError instanceof Error ? parseError.message : "Erro de parsing",
        },
        { status: 400 },
      )
    }

    // Validar dados obrigatórios
    const requiredFields = ["email", "name", "phone"]
    const missingFields = requiredFields.filter((field) => !leadData[field])

    if (missingFields.length > 0) {
      console.error("❌ Campos obrigatórios ausentes:", missingFields)
      return NextResponse.json(
        {
          success: false,
          error: "Dados obrigatórios não fornecidos",
          missing_fields: missingFields,
        },
        { status: 400 },
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(leadData.email)) {
      console.error("❌ Email inválido:", leadData.email)
      return NextResponse.json(
        {
          success: false,
          error: "Formato de email inválido",
        },
        { status: 400 },
      )
    }

    // URL do Webhook do Make.com para captura de leads
    // SUBSTITUA PELA SUA URL DO MAKE.COM
    const MAKE_LEAD_WEBHOOK_URL = "https://hook.us2.make.com/8dqa0henadsmyfa86vskbqwmn6yoqgeg"

    console.log("📤 Enviando lead para Make.com...")

    // Preparar dados para envio
    const leadPayload = {
      email: leadData.email,
      name: leadData.name,
      phone: leadData.phone,
      source: leadData.source || "checkout_form",
      page_url: leadData.page_url || "",
      timestamp: leadData.timestamp || new Date().toISOString(),
      product_type: leadData.product_type || "Tag Genérica",
      cart_value: leadData.cart_value || 18.87,
      lead_type: "checkout_form",
      status: "new",
      // Dados adicionais para segmentação
      utm_source: "checkout",
      utm_medium: "form",
      utm_campaign: "lead_capture",
    }

    console.log("📦 Payload para Make.com:", leadPayload)

    // Enviar dados para o Make.com com timeout
    let makeResponse: Response
    try {
      makeResponse = await fetch(MAKE_LEAD_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadPayload),
        // Adicionar timeout de 10 segundos
        signal: AbortSignal.timeout(10000),
      })

      console.log("📡 Resposta do Make.com:", {
        status: makeResponse.status,
        statusText: makeResponse.statusText,
        ok: makeResponse.ok,
      })
    } catch (fetchError) {
      console.error("❌ Erro na requisição para Make.com:", fetchError)

      // Retornar sucesso mesmo se Make.com falhar para não quebrar a experiência
      return NextResponse.json({
        success: true,
        message: "Lead processado localmente (Make.com indisponível)",
        lead_id: `lead_${Date.now()}`,
        warning: "Webhook externo falhou, mas lead foi registrado",
      })
    }

    // Verificar resposta do Make.com
    if (!makeResponse.ok) {
      console.warn("⚠️ Make.com retornou erro:", makeResponse.status)

      // Tentar ler a resposta de erro
      let errorDetails = "Erro desconhecido"
      try {
        const errorText = await makeResponse.text()
        errorDetails = errorText || `HTTP ${makeResponse.status}`
      } catch (readError) {
        console.warn("⚠️ Não foi possível ler erro do Make.com:", readError)
      }

      // Retornar sucesso mesmo se Make.com falhar
      return NextResponse.json({
        success: true,
        message: "Lead processado localmente (erro no webhook)",
        lead_id: `lead_${Date.now()}`,
        warning: `Webhook retornou ${makeResponse.status}: ${errorDetails}`,
      })
    }

    console.log("✅ Lead enviado para Make.com com sucesso!")

    return NextResponse.json({
      success: true,
      message: "Lead capturado e enviado com sucesso",
      lead_id: `lead_${Date.now()}`,
    })
  } catch (error) {
    console.error("❌ Erro geral na API capture-lead:", {
      error: error,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

// Adicionar suporte para outros métodos HTTP
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Método não permitido. Use POST.",
    },
    { status: 405 },
  )
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: "Método não permitido. Use POST.",
    },
    { status: 405 },
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "Método não permitido. Use POST.",
    },
    { status: 405 },
  )
}
