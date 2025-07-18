import type { Order } from "./types"

// Simulação de armazenamento em memória (em produção, use um banco de dados)
const orders: Order[] = []

export function saveOrder(orderData: Partial<Order>): Order {
  const order: Order = {
    id: orderData.id || generateId(),
    order_id: orderData.order_id || generateId(),
    customer_id: orderData.customer_id,
    customer_name: orderData.customer_name || "",
    customer_email: orderData.customer_email || "",
    customer_phone: orderData.customer_phone || "",
    customer_cpf: orderData.customer_cpf || "",
    customer_address: orderData.customer_address || "",
    customer_cep: orderData.customer_cep || "",
    customer_city: orderData.customer_city || "",
    customer_state: orderData.customer_state || "",
    order_amount: orderData.order_amount || 0,
    payment_method: orderData.payment_method || "",
    order_status: orderData.order_status || "Aguardando Pagamento",
    product_type: orderData.product_type || "",
    product_color: orderData.product_color || "",
    product_quantity: orderData.product_quantity || 1,
    product_sku: orderData.product_sku || "",
    pet_name: orderData.pet_name,
    pix_code: orderData.pix_code,
    pix_qr_code: orderData.pix_qr_code,
    pix_expiration_date: orderData.pix_expiration_date,
    created_at: orderData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Verificar se o pedido já existe
  const existingIndex = orders.findIndex((o) => o.order_id === order.order_id)
  if (existingIndex >= 0) {
    orders[existingIndex] = { ...orders[existingIndex], ...order, updated_at: new Date().toISOString() }
    return orders[existingIndex]
  } else {
    orders.push(order)
    return order
  }
}

export function getOrders(filters?: {
  startDate?: string
  endDate?: string
  status?: string
  paymentMethod?: string
}): Order[] {
  let filteredOrders = [...orders]

  if (filters?.startDate) {
    filteredOrders = filteredOrders.filter((order) => new Date(order.created_at) >= new Date(filters.startDate!))
  }

  if (filters?.endDate) {
    filteredOrders = filteredOrders.filter((order) => new Date(order.created_at) <= new Date(filters.endDate!))
  }

  if (filters?.status) {
    filteredOrders = filteredOrders.filter((order) => order.order_status === filters.status)
  }

  if (filters?.paymentMethod) {
    filteredOrders = filteredOrders.filter((order) => order.payment_method === filters.paymentMethod)
  }

  return filteredOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function getOrderById(id: string): Order | undefined {
  return orders.find((order) => order.id === id || order.order_id === id)
}

export function updateOrderStatus(orderId: string, status: string): Order | null {
  const orderIndex = orders.findIndex((o) => o.order_id === orderId || o.id === orderId)
  if (orderIndex >= 0) {
    orders[orderIndex].order_status = status
    orders[orderIndex].updated_at = new Date().toISOString()
    return orders[orderIndex]
  }
  return null
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}
