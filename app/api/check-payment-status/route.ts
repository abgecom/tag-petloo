import { type NextRequest, NextResponse } from "next/server"

// Interface para resposta da Appmax
interface AppmaxPaymentStatusResponse {
  success: boolean
  data: {
    id: string
    status: string
    payment_status?: string
    total: number
    customer_id: number
    transaction_status?: string
    order_status?: string
    payment_method_status?: string
  }
  message?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID é obrigatório",
        },
        { status: 400 },
      )
    }

    // Check if Appmax access token is configured
    const appmaxToken = process.env.APPMAX_ACCESS_TOKEN
    if (!appmaxToken) {
      console.error("APPMAX_ACCESS_TOKEN não configurada no ambiente")
      return NextResponse.json(
        {
          success: false,
          error: "Token da Appmax não configurado",
        },
        { status: 500 },
      )
    }

    console.log(`=== VERIFICANDO STATUS DO PAGAMENTO - ORDER ID: ${orderId} ===`)

    // Fazer requisição para Appmax API
    const appmaxResponse = await fetch(`https://admin.appmax.com.br/api/v3/order/${orderId}`, {
      method: "GET",
      headers: {
        "access-token": appmaxToken,
      },
    })

    if (!appmaxResponse.ok) {
      console.error("=== ERRO NA CONSULTA DO PEDIDO ===")
      console.error("Status Code:", appmaxResponse.status)

      return NextResponse.json(
        {
          success: false,
          error: "Erro ao consultar status do pedido",
          status_code: appmaxResponse.status,
        },
        { status: 500 },
      )
    }

    const appmaxData: AppmaxPaymentStatusResponse = await appmaxResponse.json()

    console.log("=== RESPOSTA STATUS PAGAMENTO ===")
    console.log("Status:", appmaxResponse.status)
    console.log("Data:", JSON.stringify(appmaxData, null, 2))

    if (!appmaxData.success || !appmaxData.data) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados do pedido não encontrados",
        },
        { status: 404 },
      )
    }

    const { status, payment_status, total } = appmaxData.data

    // Determinar se o pagamento foi aprovado - VERSÃO CORRIGIDA COM PORTUGUÊS
    const orderStatus = status?.toLowerCase() || ""
    const paymentStatus = payment_status?.toLowerCase() || ""

    // Lista de status que indicam pagamento aprovado/confirmado (PORTUGUÊS + INGLÊS)
    const approvedStatuses = [
      // Status em inglês
      "paid",
      "processing",
      "approved",
      "complete",
      "completed",
      "success",
      "successful",
      "confirmed",
      "active",
      // Status em português (ADICIONADO!)
      "aprovado",
      "pago",
      "confirmado",
      "ativo",
      "processando",
      "sucesso",
      "completo",
      "finalizado",
    ]

    let isPaid = approvedStatuses.includes(orderStatus) || approvedStatuses.includes(paymentStatus)

    console.log("=== ANÁLISE DETALHADA DO STATUS (CORRIGIDA) ===")
    console.log("Order Status (original):", status)
    console.log("Order Status (lowercase):", orderStatus)
    console.log("Payment Status (original):", payment_status)
    console.log("Payment Status (lowercase):", paymentStatus)
    console.log("Status aprovados aceitos:", approvedStatuses)
    console.log("Order Status é aprovado:", approvedStatuses.includes(orderStatus))
    console.log("Payment Status é aprovado:", approvedStatuses.includes(paymentStatus))
    console.log("Is Paid (FINAL):", isPaid)

    // Se ainda não foi detectado como pago, vamos verificar campos adicionais
    if (!isPaid && appmaxData.data) {
      const additionalFields = {
        transaction_status: appmaxData.data.transaction_status,
        order_status: appmaxData.data.order_status,
        payment_method_status: appmaxData.data.payment_method_status,
      }

      console.log("🔍 Verificando campos adicionais:", additionalFields)

      // Verificar se algum campo adicional indica aprovação
      const additionalApproved = Object.values(additionalFields).some(
        (value) => value && approvedStatuses.includes(value.toString().toLowerCase()),
      )

      if (additionalApproved) {
        console.log("✅ Pagamento aprovado detectado em campos adicionais!")
        isPaid = true
      }
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      status: status,
      payment_status: payment_status || "pending",
      is_paid: isPaid,
      amount: total,
      message: isPaid ? "Pagamento confirmado!" : "Pagamento pendente",
    })
  } catch (error) {
    console.error("=== ERRO GERAL NO CHECK-PAYMENT-STATUS ===")
    console.error("Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Método não permitido. Use GET.",
    },
    { status: 405 },
  )
}
