import { NextResponse, type NextRequest } from "next/server"

// Este endpoint será chamado pelo Make.com para armazenar os dados dos pedidos
// Aqui você pode salvar em um banco de dados, arquivo JSON, ou qualquer storage de sua escolha

let ordersStorage: any[] = []

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()

    console.log("=== DADOS RECEBIDOS DO MAKE.COM PARA STORAGE ===")
    console.log(JSON.stringify(orderData, null, 2))

    // Normalizar os dados para o formato do dashboard
    const normalizedOrder = {
      id: orderData.order_id || orderData.payment_intent_id || `order-${Date.now()}`,
      date: new Date().toISOString(),
      customer: {
        name: orderData.customer_name || "N/A",
        email: orderData.customer_email || "N/A",
        phone: orderData.customer_phone || "N/A",
        address: {
          street: orderData.customer_address || "N/A",
          city: orderData.customer_city || "N/A",
          state: orderData.customer_state || "N/A",
          zip: orderData.customer_cep || "N/A",
        },
      },
      total: orderData.order_amount || 0,
      status: orderData.order_status === "Confirmado" ? "Paid" : "Unpaid",
      items: [
        {
          id: orderData.product_sku || "PRODUTO-01",
          name: orderData.product_type || "Tag de Rastreamento",
          quantity: orderData.product_quantity || 1,
          price: orderData.order_amount || 0,
        },
      ],
    }

    // Armazenar o pedido (em produção, salvar em banco de dados)
    ordersStorage.push(normalizedOrder)

    // Manter apenas os últimos 1000 pedidos para não sobrecarregar a memória
    if (ordersStorage.length > 1000) {
      ordersStorage = ordersStorage.slice(-1000)
    }

    console.log("✅ Pedido armazenado no storage local")
    console.log("📊 Total de pedidos no storage:", ordersStorage.length)

    return NextResponse.json({ success: true, message: "Pedido armazenado com sucesso" })
  } catch (error) {
    console.error("❌ Erro ao armazenar pedido:", error)
    return NextResponse.json(
      { error: "Erro ao armazenar pedido", details: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}

export async function GET() {
  // Endpoint para recuperar todos os pedidos armazenados
  return NextResponse.json(ordersStorage)
}
