import { NextResponse } from "next/server"
import { dispatchSellflux, type SellfluxLeadData } from "@/lib/sellflux"

// ============================================
// INTEGRAÇÃO SELLFLUX — TAG PETLOO
// Endpoint HTTP para receber dados normalizados
// e repassar ao webhook do Sellflux.
//
// Campos: tamanho_pet (p/m/g) e sistema_operacional (ios/android)
// substituem raca_pet do fluxo Looneca.
// ============================================

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SellfluxLeadData

    if (!body.name || !body.email || !body.ID) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes: name, email, ID" },
        { status: 400 }
      )
    }

    await dispatchSellflux(body)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Sellflux] Erro interno:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
