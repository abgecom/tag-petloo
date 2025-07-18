export interface Order {
  id: string
  order_id: string
  customer_id?: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_cpf: string
  customer_address: string
  customer_cep: string
  customer_city: string
  customer_state: string
  order_amount: number
  payment_method: string
  order_status: string
  product_type: string
  product_color: string
  product_quantity: number
  product_sku: string
  pet_name?: string
  pix_code?: string
  pix_qr_code?: string
  pix_expiration_date?: string
  created_at: string
  updated_at: string
}

export interface OrderFilters {
  startDate?: string
  endDate?: string
  status?: string
  paymentMethod?: string
}

export interface OrderStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  paidOrders: number
  pendingOrders: number
}
