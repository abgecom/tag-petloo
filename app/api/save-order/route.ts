import { type NextRequest, NextResponse } from "next/server"
import { saveOrder } from "@/lib/order-storage"

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()

    console.log("📦 Salvando pedido no dashboard:", orderData)

    const savedOrder = saveOrder(orderData)

    return NextResponse.json({
      success: true,
      order: savedOrder,
    })
  } catch (error) {
    console.error("❌ Erro ao salvar pedido:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
