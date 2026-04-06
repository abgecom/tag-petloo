import { type NextRequest, NextResponse } from "next/server"
import { pagarmeRequest, PagarmeError } from "@/lib/pagarme/api"
import { PAGARME_CONFIG, getPlanIdByQuantity } from "@/lib/pagarme/config"
import { supabase } from "@/lib/supabase"
 
// ============================================
// ROTA UPSELL SUBSCRIPTION
// Fluxo: Customer → Card → Subscription (R$0, trial 30 dias)
// Usada após pagamento PIX para cadastrar cartão e iniciar assinatura
// ============================================
 
interface UpsellRequestBody {
  customer: {
    name: string
    email: string
    document: string
    phones: {
      mobile_phone: {
        country_code: string
        area_code: string
        number: string
      }
    }
    address: {
      line_1: string
      line_2?: string
      zip_code: string
      city: string
      state: string
      country: string
    }
  }
  card: {
    number: string
    holder_name: string
    exp_month: number
    exp_year: number
    cvv: string
    billing_address: {
      line_1: string
      line_2?: string
      zip_code: string
      city: string
      state: string
      country: string
    }
  }
  orderId: string
  quantity?: number
}
 
export async function POST(request: NextRequest) {
  try {
    const body: UpsellRequestBody = await request.json()
    const { customer, card, orderId, quantity: bodyQuantity } = body
 
    // Determinar quantidade de tags do pedido
    let tagQuantity = bodyQuantity || 1
    if (!bodyQuantity && orderId) {
      try {
        const { data: orderData } = await supabase
          .from("orders")
          .select("product_quantity")
          .eq("order_id", orderId)
          .single()
        if (orderData?.product_quantity) {
          tagQuantity = orderData.product_quantity
        }
      } catch (err) {
        console.log("[Upsell] Não foi possível buscar quantidade do pedido, usando 1")
      }
    }
    console.log("[Upsell] Quantidade de tags:", tagQuantity)
 
    console.log("[Upsell] === INICIANDO CRIAÇÃO DE ASSINATURA VIA UPSELL ===")
    console.log("[Upsell] Order ID original:", orderId)
    console.log("[Upsell] Cliente:", customer.name, customer.email)
 
    // ============================================
    // STEP 1: Criar Customer na Pagar.me
    // ============================================
    console.log("[Upsell] Step 1: Criando customer...")
 
    let customerId: string
 
    try {
      const customerResult = await pagarmeRequest<{ id: string }>(
        PAGARME_CONFIG.endpoints.customers,
        {
          method: "POST",
          body: JSON.stringify({
            name: customer.name,
            email: customer.email,
            document: customer.document,
            document_type: "CPF",
            type: "individual",
            phones: {
              mobile_phone: customer.phones.mobile_phone,
            },
            address: customer.address,
          }),
        }
      )
      customerId = customerResult.id
      console.log("[Upsell] Customer criado:", customerId)
    } catch (error) {
      console.error("[Upsell] Erro ao criar customer:", error)
      const msg = error instanceof PagarmeError ? error.message : "Falha ao criar cadastro do cliente"
      return NextResponse.json({ success: false, error: msg }, { status: 500 })
    }
 
    // ============================================
    // STEP 2: Criar Card vinculado ao Customer
    // Na Pagar.me v5: POST /customers/{id}/cards
    // ============================================
    console.log("[Upsell] Step 2: Criando cartão para customer:", customerId)
 
    let cardId: string
 
    try {
      const cardResult = await pagarmeRequest<{ id: string; last_four_digits: string }>(
        `${PAGARME_CONFIG.endpoints.customers}/${customerId}${PAGARME_CONFIG.endpoints.cards}`,
        {
          method: "POST",
          body: JSON.stringify({
            number: card.number.replace(/\s/g, ""),
            holder_name: card.holder_name,
            exp_month: card.exp_month,
            exp_year: card.exp_year,
            cvv: card.cvv,
            billing_address: card.billing_address,
          }),
        }
      )
      cardId = cardResult.id
      console.log("[Upsell] Cartão criado:", cardId, "Final:", cardResult.last_four_digits)
    } catch (error) {
      console.error("[Upsell] Erro ao criar cartão:", error)
      const msg = error instanceof PagarmeError ? error.message : "Falha ao cadastrar cartão"
      return NextResponse.json({ success: false, error: msg }, { status: 500 })
    }
 
    // ============================================
    // STEP 3: Criar Subscription com trial de 30 dias
    // O plano já tem trial_period_days configurado
    // NÃO enviar start_at para evitar dupla postergação
    // ============================================
    console.log("[Upsell] Step 3: Criando assinatura com trial... Plan:", getPlanIdByQuantity(tagQuantity), "(qty:", tagQuantity, ")")
 
    let subscriptionId: string
    let subscriptionStatus: string
 
    try {
      const subscriptionResult = await pagarmeRequest<{
        id: string
        status: string
        start_at: string
        next_billing_at: string
      }>(
        PAGARME_CONFIG.endpoints.subscriptions,
        {
          method: "POST",
          body: JSON.stringify({
            plan_id: getPlanIdByQuantity(tagQuantity),
            customer_id: customerId,
            card_id: cardId,
            payment_method: "credit_card",
            metadata: {
              source: "pix_upsell",
              order_id: orderId,
              created_at: new Date().toISOString(),
              quantity: tagQuantity.toString(),
            },
          }),
        }
      )
      subscriptionId = subscriptionResult.id
      subscriptionStatus = subscriptionResult.status
      console.log("[Upsell] Assinatura criada:", subscriptionId, "Status:", subscriptionStatus)
      console.log("[Upsell] Próxima cobrança:", subscriptionResult.next_billing_at)
    } catch (error) {
      console.error("[Upsell] Erro ao criar assinatura:", error)
      const msg = error instanceof PagarmeError ? error.message : "Falha ao criar assinatura"
      return NextResponse.json({ success: false, error: msg }, { status: 500 })
    }
 
    // ============================================
    // STEP 4: Salvar dados no Supabase
    // Atualizar tabela orders com subscription_id
    // ============================================
    console.log("[Upsell] Step 4: Salvando no Supabase...")
 
    try {
      // Atualizar o pedido original com o subscription_id
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          subscription_id: subscriptionId,
          customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)
 
      if (updateError) {
        console.error("[Upsell] Erro ao atualizar pedido no Supabase:", updateError)
        // Não bloqueia o fluxo — a assinatura já foi criada
      } else {
        console.log("[Upsell] Pedido atualizado com subscription_id no Supabase")
      }
 
      // Também atualizar na tabela pedidos (compatibilidade Looneca)
      const { error: pedidosError } = await supabase
        .from("pedidos")
        .update({
          subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        })
        .eq("id_pagamento", orderId)
 
      if (pedidosError) {
        console.error("[Upsell] Erro ao atualizar tabela pedidos:", pedidosError)
      }
    } catch (dbError) {
      console.error("[Upsell] Erro geral no Supabase (não bloqueante):", dbError)
    }
 
    // ============================================
    // SUCESSO
    // ============================================
    console.log("[Upsell] === ASSINATURA CRIADA COM SUCESSO ===")
 
    return NextResponse.json({
      success: true,
      subscriptionId,
      customerId,
      cardId,
      status: subscriptionStatus,
      message: "Assinatura criada com sucesso! Você terá 30 dias grátis para testar.",
    })
  } catch (error) {
    console.error("[Upsell] Erro geral:", error)
 
    if (error instanceof PagarmeError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.errors },
        { status: error.statusCode }
      )
    }
 
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
