import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for the order table
export interface Order {
  id: number
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
  payment_method: "credit_card" | "pix"
  order_status: "pending" | "paid" | "shipped" | "delivered" | "cancelled"
  product_type: string
  product_color: string
  product_quantity: number
  product_sku: string
  pet_name?: string
  pix_code?: string
  created_at: string
  updated_at: string
}
