import { NextResponse } from "next/server"

// ============================================
// INTEGRAÇÃO SELLFLUX
// Recebe um payload normalizado (disparado pelo webhook do Pagar.me após
// confirmação de pagamento e criação da assinatura) e envia para o webhook
// da Sellflux.
//
// IMPORTANTE: NUNCA incluir o campo `raca_pet` no payload.
// ============================================

const SELLFLUX_WEBHOOK_URL =
  "https://webhook.sellflux.app/webhook/custom/lead/7f26d45735820be9e84b1eb6941335bd"

const SELLFLUX_REQUE_CODE = "7f26d45735820be9e84b1eb6941335bd"

interface SellfluxRequestBody {
  name: string
  email: string
  phone: string
  ID: string
  produtos_lista: string
  valor_total: string
  quantidade_itens: number | string
  data_pedido?: string
  // Status real da assinatura (vindo do Pagar.me)
  subscription_status?: string
  subscription_id?: string
  // Método de pagamento do pedido único (pix | credit_card)
  payment_method?: string
  // Status do pagamento único
  payment_status?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SellfluxRequestBody

    const payload = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      ID: body.ID,
      produtos_lista: body.produtos_lista,
      valor_total: body.valor_total,
      quantidade_itens: body.quantidade_itens,
      appPetloo: "Sim",
      data_pedido: body.data_pedido ?? new Date().toISOString(),
      convert_to_lead: true,
      create_lead: true,
      auto_convert: true,
      reque_code: SELLFLUX_REQUE_CODE,
      origin: "custom",
      custom_fields: {
        name: "name",
        email: "email",
        phone: "phone",
        origem_v0: "tag-petloo",
        tag: "sim",
        subscription_status: body.subscription_status ?? "",
        subscription_id: body.subscription_id ?? "",
        payment_method: body.payment_method ?? "",
        payment_status: body.payment_status ?? "",
      },
    }

    const response = await fetch(SELLFLUX_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("[Sellflux] Erro:", response.status, text)
      return NextResponse.json(
        { error: "Sellflux falhou", status: response.status },
        { status: 500 }
      )
    }

    console.log("[Sellflux] Lead enviado:", body.email, "order:", body.ID)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Sellflux] Erro interno:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
