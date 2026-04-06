import { type NextRequest, NextResponse } from "next/server"
import { confirmPaymentAndUpdateStatus } from "@/lib/order-actions"

interface UpdateRequestBody {
  order_id: string
  order_status: string // Ex: "Pago"
  payment_status?: string
  payment_date?: string
  transaction_id?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== API UPDATE-ORDER-STATUS CHAMADA ===")

    const updateData: UpdateRequestBody = await request.json()
    console.log("Dados recebidos:", JSON.stringify(updateData, null, 2))

    if (!updateData.order_id || !updateData.order_status) {
      return NextResponse.json({ success: false, error: "order_id e order_status são obrigatórios" }, { status: 400 })
    }

    // Se o status for "Pago", usamos a nossa função centralizada para garantir
    // que o status seja atualizado tanto no Supabase quanto no Make.com.
    if (updateData.order_status === "Pago") {
      await confirmPaymentAndUpdateStatus({
        order_id: updateData.order_id,
        payment_status: updateData.payment_status,
        payment_date: updateData.payment_date,
        transaction_id: updateData.transaction_id,
      })
    } else {
      // Aqui, você poderia adicionar lógica para outros status no futuro.
      console.warn(
        `Status de atualização "${updateData.order_status}" recebido, mas apenas "Pago" aciona a atualização completa.`,
      )
    }

    return NextResponse.json({
      success: true,
      message: "Processo de atualização de status recebido.",
      order_id: updateData.order_id,
    })
  } catch (error) {
    console.error("❌ Erro geral na API update-order-status:", error)
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
