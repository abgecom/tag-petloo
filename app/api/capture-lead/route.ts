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
    const leadData: LeadData = await request.json()

    // Validar dados obrigatórios
    if (!leadData.email || !leadData.name || !leadData.phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados obrigatórios não fornecidos (email, name, phone)",
        },
        { status: 400 },
      )
    }

    // URL do Webhook do Make.com para captura de leads
    const MAKE_LEAD_WEBHOOK_URL = "https://hook.us2.make.com/8dqa0henadsmyfa86vskbqwmn6yoqgeg"

    console.log("=== ENVIANDO LEAD PARA MAKE.COM ===")
    console.log("Lead Data:", JSON.stringify(leadData, null, 2))

    // Preparar dados para envio
    const leadPayload = {
      email: leadData.email,
      name: leadData.name,
      phone: leadData.phone,
      source: leadData.source,
      page_url: leadData.page_url,
      timestamp: leadData.timestamp,
      product_type: leadData.product_type,
      cart_value: leadData.cart_value,
      lead_type: "checkout_form",
      status: "new",
      // Dados adicionais para segmentação
      utm_source: "checkout",
      utm_medium: "form",
      utm_campaign: "lead_capture",
    }

    // Enviar dados para o Make.com
    const response = await fetch(MAKE_LEAD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leadPayload),
    })

    if (!response.ok) {
      throw new Error(`Erro ao enviar para Make.com: ${response.status}`)
    }

    console.log("✅ Lead enviado para Make.com com sucesso!")

    return NextResponse.json({
      success: true,
      message: "Lead capturado e enviado com sucesso",
      lead_id: `lead_${Date.now()}`,
    })
  } catch (error) {
    console.error("❌ Erro ao capturar lead:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao capturar lead",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
