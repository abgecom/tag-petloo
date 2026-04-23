import { supabase } from "@/lib/supabase"
import { updateShopifyOrderFinancialStatus } from "@/lib/shopify-order-service"

interface UpdateOrderData {
  order_id: string
  payment_status?: string
  payment_date?: string
  transaction_id?: string
}

/**
 * Atualiza o status de um pedido para 'paid' no Supabase, atualiza a Shopify
 * e notifica o Make.com. Esta é a função central para confirmar pagamentos.
 *
 * Princípio: cada bloco é independente. Uma falha em qualquer etapa não
 * derruba as outras. Prioridade máxima: Supabase + Shopify (para o cliente
 * receber o email). Make.com é notificação paralela.
 */
export async function confirmPaymentAndUpdateStatus(
  updateData: UpdateOrderData,
): Promise<{ success: boolean; message: string }> {
  console.log(`[Order Action] Iniciando atualização para PAGO para o pedido: ${updateData.order_id}`)

  let dbSuccess = false
  let shopifyOrderId: string | null = null

  // ============================================
  // 1. Atualizar status no Supabase para 'paid'
  //    e capturar o shopify_order_id (se existir)
  // ============================================
  try {
    console.log(`[Order Action] Atualizando pedido ${updateData.order_id} no Supabase...`)
    const { data, error } = await supabase
      .from("orders")
      .update({
        order_status: "paid",
        transaction_id: updateData.transaction_id,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", updateData.order_id)
      .select("order_id, shopify_order_id")

    if (error) {
      console.error(
        `[Order Action] ❌ Erro ao atualizar pedido ${updateData.order_id} no Supabase:`,
        error
      )
    } else if (data && data.length > 0) {
      console.log(
        `[Order Action] ✅ Pedido ${updateData.order_id} atualizado para 'paid' no Supabase`
      )
      dbSuccess = true
      shopifyOrderId = data[0].shopify_order_id || null

      if (!shopifyOrderId) {
        console.warn(
          `[Order Action] ⚠️ Pedido ${updateData.order_id} não tem shopify_order_id no Supabase. Shopify não será atualizada.`
        )
      }
    } else {
      console.warn(
        `[Order Action] ⚠️ Nenhuma linha atualizada para pedido ${updateData.order_id}. O pedido existe?`
      )
    }
  } catch (dbError) {
    console.error(
      `[Order Action] ❌ Erro catastrófico na conexão com Supabase para pedido ${updateData.order_id}:`,
      dbError
    )
  }

  // ============================================
  // 2. Atualizar financial_status na Shopify
  //    (bloco isolado — falha aqui NÃO quebra o resto)
  // ============================================
  if (dbSuccess && shopifyOrderId) {
    try {
      console.log(
        `[Order Action] Atualizando Shopify order ${shopifyOrderId} para "paid"...`
      )
      await updateShopifyOrderFinancialStatus(shopifyOrderId, "paid")

      // Registrar timestamp de sincronização (best-effort, não bloqueante)
      await supabase
        .from("orders")
        .update({ shopify_synced_at: new Date().toISOString() })
        .eq("order_id", updateData.order_id)

      console.log(
        `[Order Action] ✅ Shopify order ${shopifyOrderId} atualizada. Cliente vai receber email de confirmação.`
      )
    } catch (shopifyError) {
      console.error(
        `[Order Action] ❌ Erro ao atualizar Shopify order ${shopifyOrderId} para pedido ${updateData.order_id}:`,
        shopifyError
      )
      // Não propaga — o Supabase já está correto, o Make.com ainda será notificado
    }
  }

  // ============================================
  // 3. Notificar Make.com (mantido exatamente como estava)
  // ============================================
  if (dbSuccess) {
    console.log(`[Order Action] Disparando webhook para Make.com para o pedido ${updateData.order_id}...`)
    const MAKE_UPDATE_WEBHOOK_URL = "https://hook.us2.make.com/ts1lbb4rx67zdwdy1bd9dkmcy7fwnufj"
    const updatePayload = {
      order_id: updateData.order_id,
      order_status: "Pago",
      payment_status: updateData.payment_status || "Confirmado",
      payment_date: updateData.payment_date || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      update_type: "payment_confirmation",
      transaction_id: updateData.transaction_id || updateData.order_id,
      is_update: true,
    }

    try {
      const response = await fetch(MAKE_UPDATE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) {
        console.warn(
          `[Order Action] ⚠️ Make.com retornou erro (${response.status}) para pedido ${updateData.order_id}.`
        )
      } else {
        console.log(`[Order Action] ✅ Webhook Make.com enviado para pedido ${updateData.order_id}.`)
      }
    } catch (fetchError) {
      console.error(
        `[Order Action] ❌ Erro ao enviar webhook Make.com para pedido ${updateData.order_id}:`,
        fetchError
      )
    }
  } else {
    console.log(
      `[Order Action] Make.com não foi notificado pois a atualização no DB falhou para pedido ${updateData.order_id}.`
    )
  }

  if (!dbSuccess) {
    return { success: false, message: "Falha ao atualizar o banco de dados." }
  }

  return { success: true, message: "Processo de atualização de pagamento concluído." }
}
