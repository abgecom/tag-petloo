import { NextResponse, type NextRequest } from "next/server"
import type { Order } from "@/lib/types"

// Buscar pedidos do storage local (que recebe dados do Make.com)
async function fetchStoredOrders(): Promise<Order[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/api/webhook-storage`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Storage API responded with status ${response.status}`)
    }

    const orders = await response.json()
    return orders || []
  } catch (error) {
    console.error("Error fetching stored orders:", error)
    return []
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get("orderId")

  if (orderId) {
    // Buscar pedido específico
    const orders = await fetchStoredOrders()
    const order = orders.find((o: Order) => o.id === orderId)

    if (order) {
      return NextResponse.json(order)
    }
    return new NextResponse("Order not found", { status: 404 })
  }

  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  // Define um período padrão (últimos 7 dias) se as datas não forem fornecidas
  const to = toParam ? new Date(toParam) : new Date()
  const from = fromParam ? new Date(fromParam) : new Date(new Date().setDate(to.getDate() - 6))

  // Garante que o dia 'to' seja incluído por completo
  to.setHours(23, 59, 59, 999)

  const orders = await fetchStoredOrders()

  // Filtrar por data
  const filteredOrders = orders.filter((order: Order) => {
    const orderDate = new Date(order.date)
    return orderDate >= from && orderDate <= to
  })

  // Ordena os pedidos por data, do mais recente para o mais antigo
  filteredOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return NextResponse.json(filteredOrders)
}
