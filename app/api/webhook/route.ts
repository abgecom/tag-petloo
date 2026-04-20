import { type NextRequest, NextResponse } from "next/server"
import { pagarmeRequest } from "@/lib/pagarme/api"
import { PAGARME_CONFIG } from "@/lib/pagarme/config"
import { supabase } from "@/lib/supabase"
import { dispatchSellflux } from "@/lib/sellflux"

// ============================================
// WEBHOOK DA PAGAR.ME
// Recebe notificações de eventos e cria assinatura
// após confirmação de pagamento PIX
// ============================================

interface PagarmeWebhookPayload {
  id: string
  type: string
  created_at: string
  data: {
    id: string
    code: string
    status: string
    amount: number
    customer?: {
      id: string
      name: string
      email: string
      document: string
    }
    charges?: Array<{
      id: string
      status: string
      payment_method: string
      last_transaction?: {
        status: string
      }
    }>
    metadata?: Record<string, string>
  }
}

interface PagarmeSubscriptionResponse {
  id: string
  status: string
  plan: { id: string; name: string }
}

/**
 * Cria uma assinatura via cartão de crédito do customer
 * Para PIX: o customer não tem cartão — cria a assinatura com trial
 * e o cliente deverá adicionar cartão ao final do trial.
 * Por ora, usamos o endpoint de subscriptions sem card_id (trial gratuito).
 */
async function createSubscriptionForPixCustomer(
  customerId: string
): Promise<PagarmeSubscriptionResponse> {
  const planId = process.env.PETLOO_PLAN_ID || PAGARME_CONFIG.subscription.planId

  const subscriptionData = {
    plan_id: planId,
    customer_id: customerId,
    payment_method: "credit_card",
    metadata: {
      source: "petloo-webhook-pix",
      trial_days: PAGARME_CONFIG.subscription.trialDays.toString(),
    },
  }

  console.log("=== CRIANDO ASSINATURA PIX NA PAGAR.ME ===")
  console.log("Customer ID:", customerId)
  console.log("Plan ID:", planId)

  const response = await pagarmeRequest<PagarmeSubscriptionResponse>(
    PAGARME_CONFIG.endpoints.subscriptions,
    {
      method: "POST",
      body: JSON.stringify(subscriptionData),
    }
  )

  console.log("Assinatura criada:", response.id, "Status:", response.status)
  return response
}

/**
 * Verifica assinatura duplicada no Supabase (evita criar 2x pelo mesmo pedido)
 */
async function subscriptionAlreadyExists(orderId: string): Promise<boolean> {
  const { data } = await supabase
    .from("orders")
    .select("subscription_id")
    .eq("order_id", orderId)
    .single()

  return !!data?.subscription_id
}

/**
 * Salva o subscription_id no pedido existente
 */
async function saveSubscriptionToOrder(orderId: string, subscriptionId: string) {
  const { error } = await supabase
    .from("orders")
    .update({ subscription_id: subscriptionId, order_status: "paid" })
    .eq("order_id", orderId)

  if (error) {
    console.error("Erro ao salvar subscription no pedido:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== WEBHOOK PAGAR.ME RECEBIDO ===")

    const payload: PagarmeWebhookPayload = await request.json()
    console.log("Evento:", payload.type)
    console.log("Dados:", JSON.stringify(payload.data, null, 2))

    // Verificar assinatura do webhook (opcional mas recomendado)
    const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get("x-hub-signature")
      if (!signature) {
        console.warn("Webhook sem assinatura — ignorando validação")
      }
      // TODO: validar HMAC SHA256 se necessário
    }

    // ============================================
    // EVENTO: order.paid — PIX confirmado
    // ============================================
    if (payload.type === "order.paid") {
      const order = payload.data
      console.log("=== PEDIDO PAGO ===", order.id, "Status:", order.status)

      // Verificar se é pagamento PIX
      const pixCharge = order.charges?.find(
        (c) => c.payment_method === "pix" && c.status === "paid"
      )

      if (!pixCharge) {
        console.log("Não é pagamento PIX ou ainda não pago — ignorando")
        return NextResponse.json({ received: true })
      }

      const customerId = order.customer?.id
      if (!customerId) {
        console.error("Customer ID não encontrado no payload")
        return NextResponse.json({ error: "Customer ID ausente" }, { status: 400 })
      }

      // Evitar duplicatas
      const alreadyDone = await subscriptionAlreadyExists(order.id)
      if (alreadyDone) {
        console.log("Assinatura já existe para pedido:", order.id, "— ignorando")
        return NextResponse.json({ received: true, skipped: "duplicate" })
      }

      // Criar assinatura
      const subscription = await createSubscriptionForPixCustomer(customerId)

      // Salvar subscription_id no pedido
      await saveSubscriptionToOrder(order.id, subscription.id)

      // Disparar Sellflux — confirmação de pagamento PIX
      const { data: orderData } = await supabase
        .from("orders")
        .select("customer_name, customer_email, customer_phone, order_amount, product_type, product_quantity, pet_sizes, device_type")
        .eq("order_id", order.id)
        .single()

      if (orderData) {
        dispatchSellflux({
          name: order.customer?.name || orderData.customer_name,
          email: order.customer?.email || orderData.customer_email,
          phone: orderData.customer_phone,
          ID: order.id,
          produtos_lista: orderData.product_type || "Tag Petloo",
          valor_total: (orderData.order_amount / 100).toFixed(2),
          quantidade_itens: orderData.product_quantity || 1,
          tamanho_pet: orderData.pet_sizes || "",
          sistema_operacional: orderData.device_type || "",
          payment_method: "pix",
          payment_status: "paid",
          subscription_id: subscription.id,
          subscription_status: subscription.status,
          data_pedido: new Date().toISOString(),
        }).catch(() => {})
      }

      console.log("=== ASSINATURA PIX CRIADA COM SUCESSO ===")
      console.log("Order:", order.id, "Subscription:", subscription.id)

      return NextResponse.json({
        received: true,
        orderId: order.id,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      })
    }

    // Outros eventos — apenas confirmar recebimento
    console.log("Evento não tratado:", payload.type, "— ignorando")
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error("Erro no webhook Pagar.me:", error)
    return NextResponse.json(
      {
        error: "Erro interno no webhook",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}
