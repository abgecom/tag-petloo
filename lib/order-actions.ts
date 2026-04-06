import { supabase } from "@/lib/supabase"

interface UpdateOrderData {
  order_id: string
  payment_status?: string
  payment_date?: string
  transaction_id?: string
}

/**
 * Atualiza o status de um pedido para 'paid' no Supabase e notifica o Make.com.
 * Esta é a função central para confirmar pagamentos.
 */
export async function confirmPaymentAndUpdateStatus(
  updateData: UpdateOrderData,
): Promise<{ success: boolean; message: string }> {
  console.log(`[Order Action] Iniciando atualização para PAGO para o pedido: ${updateData.order_id}`)

  let dbSuccess = false

  // 1. Atualizar o status no Supabase para 'paid'
  try {
    console.log(`[Order Action] Tentando atualizar o pedido ${updateData.order_id} no Supabase...`)
    const { data, error } = await supabase
      .from("orders")
      .update({
        order_status: "paid", // AQUI ESTÁ A ATUALIZAÇÃO CRÍTICA
        transaction_id: updateData.transaction_id,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", updateData.order_id)
      .select() // .select() retorna os dados atualizados

    if (error) {
      console.error(`[Order Action] ❌ Erro ao atualizar o pedido ${updateData.order_id} no Supabase:`, error)
    } else if (data && data.length > 0) {
      console.log(
        `[Order Action] ✅ Pedido ${updateData.order_id} atualizado para 'paid' com sucesso no Supabase!`,
        data[0],
      )
      dbSuccess = true
    } else {
      console.warn(
        `[Order Action] ⚠️ Nenhuma linha foi atualizada para o pedido ${updateData.order_id}. O pedido existe?`,
      )
    }
  } catch (dbError) {
    console.error(
      `[Order Action] ❌ Erro catastrófico na conexão com Supabase para o pedido ${updateData.order_id}:`,
      dbError,
    )
  }

  // 2. Notificar o Make.com (mantendo a funcionalidade existente)
  if (dbSuccess) {
    console.log(`[Order Action] Disparando webhook para Make.com para o pedido ${updateData.order_id}...`)
    const MAKE_UPDATE_WEBHOOK_URL = "https://hook.us2.make.com/ts1lbb4rx67zdwdy1bd9dkmcy7fwnufj"
    const updatePayload = {
      order_id: updateData.order_id,
      order_status: "Pago", // Usar o termo em português para o Make.com
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
          `[Order Action] ⚠️ Make.com retornou um erro (${response.status}) para o pedido ${updateData.order_id}.`,
        )
      } else {
        console.log(`[Order Action] ✅ Webhook para Make.com enviado com sucesso para o pedido ${updateData.order_id}.`)
      }
    } catch (fetchError) {
      console.error(
        `[Order Action] ❌ Erro ao enviar webhook para Make.com para o pedido ${updateData.order_id}:`,
        fetchError,
      )
    }
  } else {
    console.log(
      `[Order Action] Webhook para Make.com não foi disparado pois a atualização no DB falhou para o pedido ${updateData.order_id}.`,
    )
  }

  if (!dbSuccess) {
    return { success: false, message: "Falha ao atualizar o banco de dados." }
  }

  return { success: true, message: "Processo de atualização de pagamento concluído." }
}
