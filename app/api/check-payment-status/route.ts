import { type NextRequest, NextResponse } from "next/server"
import { confirmPaymentAndUpdateStatus } from "@/lib/order-actions"
import { supabase } from "@/lib/supabase"

interface AppmaxOrderData {
  id: string
  status: string
  payment_status: string
  payment_date: string
  transaction_id: string
  total: string
}

interface AppmaxResponse {
  success: boolean
  data: AppmaxOrderData
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID é obrigatório" }, { status: 400 })
    }

    // Otimização: verifica se o pedido já está pago no nosso DB
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("order_status, order_amount")
      .eq("order_id", orderId)
      .single()

    if (existingOrder?.order_status === "paid") {
      console.log(`[Check Status] Otimização: Pedido ${orderId} já está 'pago' no DB.`)
      return NextResponse.json({
        success: true,
        order_id: orderId,
        is_paid: true,
        status: "paid",
        amount: existingOrder.order_amount || 0,
      })
    }

    const appmaxToken = process.env.APPMAX_ACCESS_TOKEN
    if (!appmaxToken) {
      console.error("[Check Status] Erro Crítico: APPMAX_ACCESS_TOKEN não configurada.")
      return NextResponse.json({ success: false, error: "Token da Appmax não configurado" }, { status: 500 })
    }

    console.log(`[Check Status] Verificando Appmax para o pedido: ${orderId}`)

    // Corrigindo a URL e o método de autenticação da Appmax
    const appmaxResponse = await fetch(`https://admin.appmax.com.br/api/v3/order/${orderId}`, {
      method: "GET",
      headers: {
        "access-token": appmaxToken,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!appmaxResponse.ok) {
      const errorText = await appmaxResponse.text()
      console.error(`[Check Status] Erro na API Appmax: ${appmaxResponse.status}`, errorText)
      return NextResponse.json(
        { success: false, error: "Erro ao consultar pedido na Appmax" },
        { status: appmaxResponse.status },
      )
    }

    const appmaxData: AppmaxResponse = await appmaxResponse.json()
    console.log(`[Check Status] Resposta da Appmax para ${orderId}:`, JSON.stringify(appmaxData, null, 2))

    if (!appmaxData.success || !appmaxData.data) {
      return NextResponse.json({ success: false, error: "Dados do pedido não encontrados na Appmax" }, { status: 404 })
    }

    const { status, payment_date, transaction_id, total } = appmaxData.data

    // Verificação de status mais robusta
    const normalizedStatus = status ? status.trim().toLowerCase() : ""
    const isPaid = normalizedStatus === "aprovado" || normalizedStatus === "pago"

    console.log(
      `[Check Status] Análise do status para ${orderId}: Status Original: "${status}", Normalizado: "${normalizedStatus}", Considerado Pago: ${isPaid}`,
    )

    const amountInCents = total ? Math.round(Number.parseFloat(total) * 100) : 0

    // Se o pagamento foi confirmado, atualizar o Supabase
    if (isPaid) {
      console.log(`[Check Status] ✅ PAGAMENTO CONFIRMADO NA APPMAX PARA ${orderId}! Disparando atualização...`)
      await confirmPaymentAndUpdateStatus({
        order_id: orderId,
        payment_status: status,
        payment_date: payment_date,
        transaction_id: transaction_id,
      })
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      is_paid: isPaid,
      status: status,
      payment_status: appmaxData.data.payment_status,
      amount: amountInCents,
    })
  } catch (error) {
    console.error("[Check Status] Erro fatal na rota:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
