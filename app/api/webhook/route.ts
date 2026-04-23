import { type NextRequest, NextResponse } from "next/server"
import { confirmPaymentAndUpdateStatus } from "@/lib/order-actions"

// ============================================
// WEBHOOK DA PAGAR.ME
// Responsável por: receber eventos de pagamento confirmado
// e disparar a atualização do status (Supabase + Shopify + Make.com).
//
// IMPORTANTE: a criação de assinatura PIX foi REMOVIDA deste webhook por
// decisão do dono do projeto — ela nunca funcionou na prática (Pagar.me
// rejeita subscription sem cartão) e gerava exceção que bloqueava o resto
// do fluxo. A criação de assinatura para pedidos de cartão continua sendo
// feita em /api/payment/route.ts (não é tocada aqui).
// ============================================

interface PagarmeWebhookPayload {
  id: string
  type: string
  created_at: string
  data: {
    id: string
    code?: string
    status: string
    amount?: number
    customer?: {
      id: string
      name?: string
      email?: string
      document?: string
    }
    charges?: Array<{
      id: string
      status: string
      payment_method: string
      paid_at?: string
      last_transaction?: {
        id?: string
        status?: string
      }
    }>
    metadata?: Record<string, string>
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: PagarmeWebhookPayload = await request.json()

    console.log("=== WEBHOOK PAGAR.ME RECEBIDO ===")
    console.log("Evento:", payload.type)
    console.log("Order ID:", payload.data?.id)
    console.log("Status:", payload.data?.status)

    // ============================================
    // Roteamento por tipo de evento
    // ============================================
    if (payload.type !== "order.paid") {
      console.log(`[Webhook] Evento "${payload.type}" não tratado — respondendo 200 OK.`)
      return NextResponse.json({ received: true, handled: false, reason: "event_not_handled" })
    }

    const order = payload.data
    const orderId = order?.id

    if (!orderId) {
      console.error("[Webhook] ❌ Payload order.paid sem order_id. Ignorando.")
      return NextResponse.json({ received: true, handled: false, reason: "missing_order_id" })
    }

    // ============================================
    // Identificar se é PIX ou cartão
    // ============================================
    const pixChargePaid = order.charges?.find(
      (c) => c.payment_method === "pix" && c.status === "paid"
    )
    const cardChargePaid = order.charges?.find(
      (c) => c.payment_method === "credit_card" && c.status === "paid"
    )

    // Para cartão: o /api/payment já salvou como "paid" no ato da cobrança,
    // então o webhook é apenas redundância. Não precisamos fazer nada aqui.
    if (cardChargePaid && !pixChargePaid) {
      console.log(
        `[Webhook] Pedido ${orderId} é cartão já processado em /api/payment. Ignorando (esperado).`
      )
      return NextResponse.json({
        received: true,
        handled: false,
        reason: "credit_card_already_handled",
      })
    }

    // Se não é PIX pago, ignora.
    if (!pixChargePaid) {
      console.log(
        `[Webhook] Pedido ${orderId} não tem charge PIX com status "paid". Ignorando.`
      )
      return NextResponse.json({
        received: true,
        handled: false,
        reason: "not_pix_paid",
      })
    }

    // ============================================
    // É PIX PAGO — disparar confirmação
    // ============================================
    console.log(`[Webhook] 💰 PIX PAGO CONFIRMADO para pedido ${orderId}. Disparando atualização...`)

    const paymentDate = pixChargePaid.paid_at || new Date().toISOString()
    const transactionId = pixChargePaid.last_transaction?.id || pixChargePaid.id || orderId

    try {
      const result = await confirmPaymentAndUpdateStatus({
        order_id: orderId,
        payment_status: "pix_paid",
        payment_date: paymentDate,
        transaction_id: transactionId,
      })

      console.log(`[Webhook] Resultado confirmPaymentAndUpdateStatus:`, result)

      return NextResponse.json({
        received: true,
        handled: true,
        order_id: orderId,
        result,
      })
    } catch (updateError) {
      console.error(
        `[Webhook] ❌ Erro ao executar confirmPaymentAndUpdateStatus para pedido ${orderId}:`,
        updateError
      )
      // Retornar 200 mesmo assim para a Pagar.me NÃO ficar retentando
      // (o erro foi logado, e a gente pode processar manualmente se necessário).
      return NextResponse.json(
        {
          received: true,
          handled: false,
          reason: "internal_error",
          error: updateError instanceof Error ? updateError.message : "unknown",
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error("[Webhook] ❌ Erro fatal ao processar webhook Pagar.me:", error)
    // Retorna 200 para não ficar em loop de retry da Pagar.me por erro nosso
    return NextResponse.json(
      {
        received: true,
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 200 }
    )
  }
}
