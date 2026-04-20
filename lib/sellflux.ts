const SELLFLUX_WEBHOOK_URL =
  "https://webhook.sellflux.app/webhook/custom/lead/7f26d45735820be9e84b1eb6941335bd"

const SELLFLUX_REQUE_CODE = "7f26d45735820be9e84b1eb6941335bd"

export interface SellfluxLeadData {
  name: string
  email: string
  phone: string
  ID: string
  produtos_lista: string
  valor_total: string
  quantidade_itens: number | string
  tamanho_pet?: string
  sistema_operacional?: string
  data_pedido?: string
  subscription_status?: string
  subscription_id?: string
  payment_method?: string
  payment_status?: string
}

function buildTags(data: SellfluxLeadData): string[] {
  const tags: string[] = ["origem-v0", "pagarme", "app-petloo"]

  const method = data.payment_method
  const status = data.payment_status

  if (method === "pix" && status === "pending") {
    tags.push("aguardando-pagamento-pix")
  } else if (method === "pix" && status === "paid") {
    tags.push("compra-realizada-pix")
  } else if (method === "credit_card" && status === "paid") {
    tags.push("compra-realizada-cartao-credito")
  }

  return tags
}

export async function dispatchSellflux(data: SellfluxLeadData): Promise<void> {
  try {
    const tags = buildTags(data)

    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      ID: data.ID,
      produtos_lista: data.produtos_lista,
      valor_total: data.valor_total,
      quantidade_itens: data.quantidade_itens,
      appPetloo: "Sim",
      data_pedido: data.data_pedido ?? new Date().toISOString(),
      tamanho_pet: data.tamanho_pet ?? "",
      sistema_operacional: data.sistema_operacional ?? "",
      tags,
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
        tamanho_pet: data.tamanho_pet ?? "",
        sistema_operacional: data.sistema_operacional ?? "",
        subscription_status: data.subscription_status ?? "",
        subscription_id: data.subscription_id ?? "",
        payment_method: data.payment_method ?? "",
        payment_status: data.payment_status ?? "",
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
    } else {
      console.log("[Sellflux] Lead enviado:", data.email, "order:", data.ID)
    }
  } catch (err) {
    console.error("[Sellflux] Falha (não-bloqueante):", err)
  }
}
