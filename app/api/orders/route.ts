import { type NextRequest, NextResponse } from "next/server"
import { getOrders } from "@/lib/order-storage"
import type { OrderFilters, OrderStats } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters: OrderFilters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      status: searchParams.get("status") || undefined,
      paymentMethod: searchParams.get("paymentMethod") || undefined,
    }

    const orders = getOrders(filters)

    // Calcular estatísticas
    const stats: OrderStats = {
      totalOrders: orders.length,
      totalRevenue: orders
        .filter((order) => order.order_status === "Pago")
        .reduce((sum, order) => sum + order.order_amount, 0),
      averageOrderValue:
        orders.length > 0 ? orders.reduce((sum, order) => sum + order.order_amount, 0) / orders.length : 0,
      paidOrders: orders.filter((order) => order.order_status === "Pago").length,
      pendingOrders: orders.filter((order) => order.order_status === "Aguardando Pagamento").length,
    }

    return NextResponse.json({
      orders,
      stats,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar pedidos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
