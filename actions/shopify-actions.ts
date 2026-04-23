"use server"

import { exportShopifyOrder, type CheckoutInput } from "@/lib/shopify-order-service"
import { supabase } from "@/lib/supabase"

/**
 * Server Action para exportar pedido para Shopify.
 *
 * Fluxo:
 * 1. Cria o pedido na Shopify (via exportShopifyOrder)
 * 2. Persiste o shopify_order_id retornado no Supabase, ligando-o ao order_id da Pagar.me
 *    — isso é o que permite o webhook atualizar a Shopify depois que o PIX for pago.
 *
 * Importante: o retorno e o comportamento externo dessa função são preservados 100%.
 * Qualquer falha no salvamento do shopify_order_id é logada mas NÃO interrompe o fluxo
 * (o pedido Shopify foi criado com sucesso, não podemos quebrar isso pro cliente).
 */
export async function exportOrderToShopify(input: CheckoutInput) {
  const result = await exportShopifyOrder(input)

  // Persistir shopify_order_id no Supabase (não bloqueante)
  if (result?.order?.id && input.paymentId) {
    try {
      console.log(
        `[Shopify Action] Tentando salvar shopify_order_id=${result.order.id} para order_id=${input.paymentId}`
      )

      const { data, error } = await supabase
        .from("orders")
        .update({
          shopify_order_id: String(result.order.id),
          shopify_order_name: result.order.name,
        })
        .eq("order_id", input.paymentId)
        .select("order_id")

      if (error) {
        console.error(
          `[Shopify Action] ❌ Erro ao salvar shopify_order_id para pedido ${input.paymentId}:`,
          error
        )
      } else if (!data || data.length === 0) {
        console.warn(
          `[Shopify Action] ⚠️ Nenhuma linha atualizada ao salvar shopify_order_id para pedido ${input.paymentId}. Pedido existe na tabela orders?`
        )
      } else {
        console.log(
          `[Shopify Action] ✅ shopify_order_id ${result.order.id} (${result.order.name}) salvo para pedido ${input.paymentId}`
        )
      }
    } catch (err) {
      console.error(
        `[Shopify Action] ❌ Exceção ao salvar shopify_order_id para pedido ${input.paymentId}:`,
        err
      )
      // Não propaga o erro — o pedido na Shopify foi criado com sucesso
    }
  } else {
    console.warn(
      "[Shopify Action] ⚠️ Pedido Shopify criado mas sem result.order.id ou input.paymentId. Não foi possível salvar a referência. ",
      { hasOrderId: !!result?.order?.id, hasPaymentId: !!input.paymentId }
    )
  }

  return result
}

export type { CheckoutInput }
