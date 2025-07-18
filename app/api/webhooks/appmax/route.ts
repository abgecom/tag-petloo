import crypto from "crypto"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  // 1. Validação de Segurança com o Webhook Secret
  const secret = process.env.APPMAX_WEBHOOK_SECRET
  const signature = request.headers.get("x-appmax-signature")

  if (!secret) {
    console.error("[Webhook] Erro Crítico: APPMAX_WEBHOOK_SECRET não está configurado.")
    // Em produção, é crucial ter o segredo. Retornamos 500 para indicar um erro de configuração do servidor.
    return new Response("Webhook secret não configurado no servidor.", { status: 500 })
  }

  // Se a assinatura não for enviada, a requisição é inválida.
  if (!signature) {
    console.warn("[Webhook] Requisição bloqueada: Nenhuma assinatura 'x-appmax-signature' encontrada.")
    return new Response("Assinatura não fornecida.", { status: 401 })
  }

  try {
    const bodyText = await request.clone().text() // Clona o request para poder ler o corpo duas vezes
    const expectedSignature = crypto.createHmac("sha256", secret).update(bodyText).digest("hex")

    if (signature !== expectedSignature) {
      console.warn("[Webhook] Requisição bloqueada: Assinatura inválida.")
      return new Response("Assinatura inválida.", { status: 403 })
    }
    console.log("[Webhook] ✅ Assinatura validada com sucesso!")
  } catch (e) {
    console.error("[Webhook] Erro ao processar o corpo da requisição para validação:", e)
    return new Response("Erro interno ao validar a assinatura.", { status: 500 })
  }

  // Se a validação passou, podemos processar o corpo do webhook com segurança.
  const data = await request.json()

  console.log("[Webhook] Dados recebidos:", data)

  return NextResponse.json({ received: true, data })
}
