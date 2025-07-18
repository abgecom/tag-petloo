import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { orderId } = params

    const { data: order, error } = await supabase.from("orders").select("*").eq("order_id", orderId).single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      }
      console.error("Erro ao buscar pedido:", error)
      return NextResponse.json({ error: "Erro ao buscar pedido" }, { status: 500 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Erro na API de pedido específico:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { orderId } = params
    const body = await request.json()

    const { data: order, error } = await supabase.from("orders").update(body).eq("order_id", orderId).select().single()

    if (error) {
      console.error("Erro ao atualizar pedido:", error)
      return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Erro na API de atualização de pedidos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
