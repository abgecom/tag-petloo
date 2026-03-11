"use server"

import { exportShopifyOrder, type CheckoutInput } from "@/lib/shopify-order-service"

/**
 * Server Action para exportar pedido para Shopify
 */
export async function exportOrderToShopify(input: CheckoutInput) {
  return exportShopifyOrder(input)
}

export type { CheckoutInput }
