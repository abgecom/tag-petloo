import { type NextRequest, NextResponse } from "next/server"
import { updateOrderStatus } from "@/lib/order-storage"

export async function POST(request: NextRequest) {
  try {
    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId e status são obrigatórios" }, { status: 400 })
    }

    const updatedOrder = updateOrderStatus(orderId, status)

    if (!updatedOrder) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar status do pedido:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
