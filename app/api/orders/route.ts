import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""

    const offset = (page - 1) * limit

    let query = supabase.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,order_id.ilike.%${search}%`)
    }

    // Apply status filter
    if (status && status !== "all") {
      query = query.eq("order_status", status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: orders, error, count } = await query

    if (error) {
      console.error("Erro ao buscar pedidos:", error)
      return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 })
    }

    // Get statistics
    const { data: stats } = await supabase.from("orders").select("order_status, order_amount")

    const statistics = {
      total: count || 0,
      pending: stats?.filter((s) => s.order_status === "pending").length || 0,
      paid: stats?.filter((s) => s.order_status === "paid").length || 0,
      revenue: stats?.reduce((sum, s) => sum + (s.order_amount || 0), 0) || 0,
    }

    return NextResponse.json({
      orders: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statistics,
    })
  } catch (error) {
    console.error("Erro na API de pedidos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("=== SALVANDO PEDIDO NO SUPABASE ===")
    console.log("Dados recebidos:", JSON.stringify(body, null, 2))

    // Validate required fields
    const requiredFields = [
      "order_id",
      "customer_name",
      "customer_email",
      "customer_phone",
      "customer_cpf",
      "customer_address",
      "customer_cep",
      "customer_city",
      "customer_state",
      "order_amount",
      "payment_method",
      "order_status",
      "product_type",
      "product_color",
      "product_quantity",
      "product_sku",
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`Campo obrigatório ausente: ${field}`)
        return NextResponse.json({ error: `Campo obrigatório ausente: ${field}` }, { status: 400 })
      }
    }

    // Insert order into Supabase
    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          order_id: body.order_id,
          customer_id: body.customer_id || null,
          customer_name: body.customer_name,
          customer_email: body.customer_email,
          customer_phone: body.customer_phone,
          customer_cpf: body.customer_cpf,
          customer_address: body.customer_address,
          customer_cep: body.customer_cep,
          customer_city: body.customer_city,
          customer_state: body.customer_state,
          order_amount: body.order_amount,
          payment_method: body.payment_method,
          order_status: body.order_status,
          product_type: body.product_type,
          product_color: body.product_color,
          product_quantity: body.product_quantity,
          product_sku: body.product_sku,
          pet_name: body.pet_name || null,
          pix_code: body.pix_code || null,
        },
      ])
      .select()

    if (error) {
      console.error("Erro ao inserir pedido no Supabase:", error)
      return NextResponse.json({ error: "Erro ao salvar pedido", details: error.message }, { status: 500 })
    }

    console.log("✅ Pedido salvo com sucesso:", data)
    return NextResponse.json({ success: true, data: data?.[0] })
  } catch (error) {
    console.error("Erro na API de criação de pedidos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
