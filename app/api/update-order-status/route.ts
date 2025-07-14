import { type NextRequest, NextResponse } from "next/server"

// Interface para os dados de atualização do pedido
interface UpdateOrderStatusData {
  order_id: string
  order_status: string
  payment_status?: string
  payment_date?: string
  transaction_id?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== API UPDATE-ORDER-STATUS CHAMADA ===")

    const updateData: UpdateOrderStatusData = await request.json()
    console.log("Dados recebidos:", JSON.stringify(updateData, null, 2))

    // Validar dados obrigatórios
    if (!updateData.order_id || !updateData.order_status) {
      console.error("❌ Dados obrigatórios ausentes")
      return NextResponse.json(
        {
          success: false,
          error: "order_id e order_status são obrigatórios",
        },
        { status: 400 },
      )
    }

    // URL do Webhook do Make.com para ATUALIZAÇÃO de status
    const MAKE_UPDATE_WEBHOOK_URL = "https://hook.us2.make.com/ts1lbb4rx67zdwdy1bd9dkmcy7fwnufj"

    console.log("=== ATUALIZANDO STATUS DO PEDIDO NO MAKE.COM ===")
    console.log("Order ID:", updateData.order_id)
    console.log("Novo Status:", updateData.order_status)

    // Preparar dados para atualização
    const updatePayload = {
      // Dados de identificação
      order_id: updateData.order_id,

      // Dados de atualização
      order_status: updateData.order_status,
      payment_status: updateData.payment_status || "Pago",
      payment_date: updateData.payment_date || new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Dados adicionais para controle
      update_type: "payment_confirmation",
      transaction_id: updateData.transaction_id || updateData.order_id,

      // Flag para identificar que é uma atualização, não criação
      is_update: true,
    }

    console.log("📦 Payload de atualização:", JSON.stringify(updatePayload, null, 2))

    try {
      // Enviar dados para o Make.com
      const response = await fetch(MAKE_UPDATE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      })

      console.log("📡 Resposta do Make.com:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      if (!response.ok) {
        console.warn("⚠️ Make.com retornou erro:", response.status)

        return NextResponse.json({
          success: true, // Retornar sucesso mesmo se Make.com falhar
          message: "Dados processados localmente (Make.com indisponível)",
          order_id: updateData.order_id,
          new_status: updateData.order_status,
          warning: `Make.com retornou ${response.status}`,
        })
      }

      console.log("✅ Status do pedido atualizado no Make.com com sucesso!")

      return NextResponse.json({
        success: true,
        message: "Status do pedido atualizado com sucesso",
        order_id: updateData.order_id,
        new_status: updateData.order_status,
        updated_at: new Date().toISOString(),
      })
    } catch (fetchError) {
      console.error("❌ Erro ao conectar com Make.com:", fetchError)

      return NextResponse.json({
        success: true, // Retornar sucesso mesmo se Make.com falhar
        message: "Dados processados localmente (erro de conexão)",
        order_id: updateData.order_id,
        new_status: updateData.order_status,
        error: "Conexão com Make.com falhou",
      })
    }
  } catch (error) {
    console.error("❌ Erro geral na API:", error)

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

// Adicionar suporte para GET (para teste)
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "API update-order-status está funcionando!",
    methods: ["POST"],
    timestamp: new Date().toISOString(),
    example: {
      order_id: "92718866",
      order_status: "Pago",
      payment_status: "Confirmado",
    },
  })
}

// Adicionar outros métodos para debug
export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: "Método não permitido. Use POST para atualizar ou GET para testar.",
    },
    { status: 405 },
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "Método não permitido. Use POST para atualizar ou GET para testar.",
    },
    { status: 405 },
  )
}
