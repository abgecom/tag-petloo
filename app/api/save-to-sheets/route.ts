import { type NextRequest, NextResponse } from "next/server"

// Interface para os dados do pedido
interface OrderData {
  order_id: string
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
  // Novos campos do produto
  product_type: string
  product_color: string
  product_quantity: number
  product_sku: string
  pet_name: string // Adicionar este campo
  // 💰 NOVOS CAMPOS DO PIX
  pix_code?: string // Código PIX copia e cola
  pix_qr_code?: string // QR Code em base64
  pix_expiration_date?: string // Data de expiração
}

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderData = await request.json()

    // URL do Webhook do Make.com (substitua pela sua URL)
    const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/qkwwr3qvpgkkobinbd28lzsq0k51tt6k"

    console.log("=== ENVIANDO DADOS PARA MAKE.COM ===")
    console.log("Dados:", JSON.stringify(orderData, null, 2))

    // 💰 LOG ESPECÍFICO PARA DADOS PIX
    if (orderData.pix_code) {
      console.log("💰 CÓDIGO PIX INCLUÍDO:")
      console.log("PIX Code:", orderData.pix_code ? "✅ Presente" : "❌ Ausente")
      console.log("PIX QR Code:", orderData.pix_qr_code ? "✅ Presente" : "❌ Ausente")
      console.log("PIX Expiration:", orderData.pix_expiration_date || "Não informado")
    }

    // Enviar dados para o Make.com
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      throw new Error(`Erro ao enviar para Make.com: ${response.status}`)
    }

    console.log("✅ Dados enviados para Make.com com sucesso!")

    return NextResponse.json({
      success: true,
      message: "Dados salvos na planilha com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro ao salvar na planilha:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao salvar dados na planilha",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
