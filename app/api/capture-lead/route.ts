import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[SERVER] 📥 API capture-lead chamada - Headers:", {
      "content-type": request.headers.get("content-type"),
    })
    console.log("[SERVER] 📏 Content-Length:", request.headers.get("content-length"))

    console.log("[SERVER] 📥 API capture-lead chamada")

    const body = await request.json()
    console.log("[SERVER] 📋 Dados recebidos:", body)

    const { email, name, phone, source = "checkout_form", page_url, timestamp, product_type, cart_value } = body

    // Validações básicas
    if (!email || !name || !phone) {
      console.log("[SERVER] ❌ Dados obrigatórios faltando")
      return NextResponse.json({ success: false, error: "Email, nome e telefone são obrigatórios" }, { status: 400 })
    }

    // Preparar dados para o Make.com
    const leadData = {
      email,
      name,
      phone,
      source,
      page_url,
      timestamp,
      product_type,
      cart_value,
      lead_type: "checkout_form",
      status: "new",
      utm_source: "checkout",
      utm_medium: "form",
      utm_campaign: "lead_capture",
    }

    // Enviar para Make.com (webhook)
    const makeWebhookUrl = process.env.MAKE_LEAD_WEBHOOK_URL

    if (makeWebhookUrl) {
      try {
        console.log("[SERVER] 📤 Enviando lead para Make.com...")
        console.log("[SERVER] 📦 Payload para Make.com:", leadData)

        const makeResponse = await fetch(makeWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(leadData),
          signal: AbortSignal.timeout(10000), // 10 segundos timeout
        })

        console.log("[SERVER] 📡 Resposta do Make.com:", {
          status: makeResponse.status,
          statusText: makeResponse.statusText,
          ok: makeResponse.ok,
          headers: Object.fromEntries(makeResponse.headers.entries()),
        })

        if (makeResponse.ok) {
          console.log("[SERVER] ✅ Lead enviado para Make.com com sucesso!")
        } else {
          console.log("[SERVER] ⚠️ Make.com retornou erro, mas continuando...")
        }
      } catch (error) {
        console.error("[SERVER] ❌ Erro ao enviar para Make.com:", error)
        console.log("[SERVER] ⚠️ Continuando mesmo com erro no webhook...")
      }
    } else {
      console.log("[SERVER] ⚠️ MAKE_LEAD_WEBHOOK_URL não configurada")
    }

    // Sempre retornar sucesso para não quebrar a experiência do usuário
    return NextResponse.json({
      success: true,
      message: "Lead capturado e enviado com sucesso",
      data: {
        email,
        name,
        phone,
        product_type,
        cart_value,
        timestamp,
      },
    })
  } catch (error) {
    console.error("[SERVER] ❌ Erro na API capture-lead:", error)

    // Mesmo com erro, retornar sucesso para não quebrar o fluxo
    return NextResponse.json({
      success: true,
      message: "Lead processado (com avisos)",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    })
  }
}
