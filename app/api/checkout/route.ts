import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

interface CheckoutRequestBody {
  name: string
  email: string
  cpf: string
  telefone: string
  cep: string
  endereco: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  complemento?: string
  shipping_price: number // Valor em centavos
  // 🎯 NOVOS CAMPOS DO PRODUTO
  product_type: string
  product_color: string
  product_quantity: number
  product_sku: string
  pet_name?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequestBody = await request.json()

    console.log("=== DADOS RECEBIDOS NA API CHECKOUT ===")
    console.log("📦 Dados completos:", JSON.stringify(body, null, 2))

    // Validar campos obrigatórios
    const requiredFields = ["name", "email", "cpf", "telefone", "shipping_price"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Campo obrigatório ausente: ${field}` }, { status: 400 })
      }
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    console.log(
      "💰 Valor do checkout:",
      body.shipping_price,
      "centavos =",
      (body.shipping_price / 100).toFixed(2),
      "reais",
    )

    // Dividir nome em primeiro e último nome
    const nameParts = body.name.trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    // Criar PaymentIntent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.shipping_price, // Valor em centavos
      currency: "brl",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customer_name: body.name,
        customer_email: body.email,
        customer_cpf: body.cpf,
        customer_phone: body.telefone,
        customer_address: `${body.endereco}, ${body.numero}${body.complemento ? `, ${body.complemento}` : ""}, ${body.bairro}`,
        customer_cep: body.cep,
        customer_city: body.cidade,
        customer_state: body.estado,
        product_type: body.product_type,
        product_color: body.product_color,
        product_quantity: body.product_quantity.toString(),
        product_sku: body.product_sku,
        pet_name: body.pet_name || "",
      },
    })

    console.log("✅ PaymentIntent criado:", paymentIntent.id)

    // Preparar dados para salvar no dashboard e enviar para webhooks
    const orderDataForSheets = {
      order_id: paymentIntent.id,
      customer_id: paymentIntent.id, // Usar PaymentIntent ID como customer_id para cartão
      customer_name: body.name,
      customer_email: body.email,
      customer_phone: body.telefone,
      customer_cpf: body.cpf,
      customer_address: `${body.endereco}, ${body.numero}${body.complemento ? `, ${body.complemento}` : ""}, ${body.bairro}`,
      customer_cep: body.cep,
      customer_city: body.cidade,
      customer_state: body.estado,
      order_amount: body.shipping_price / 100, // Converter centavos para reais
      payment_method: "Cartão de Crédito",
      order_status: "Aguardando Pagamento",
      product_type: body.product_type,
      product_color: body.product_color,
      product_quantity: body.product_quantity,
      product_sku: body.product_sku,
      pet_name: body.pet_name || "",
    }

    // 🆕 SALVAR NO DASHBOARD LOCAL
    try {
      console.log("💾 Salvando pedido no dashboard local...")
      await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/api/save-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderDataForSheets),
      })
      console.log("✅ Pedido salvo no dashboard local!")
    } catch (dashboardError) {
      console.warn("⚠️ Erro ao salvar no dashboard local (não crítico):", dashboardError)
    }

    // Enviar dados para webhooks do Make.com (não bloquear a resposta)
    try {
      console.log("=== ENVIANDO DADOS PARA WEBHOOKS MAKE.COM ===")
      console.log("Dados:", JSON.stringify(orderDataForSheets, null, 2))

      // Webhook 1: Salvar pedido na planilha
      console.log("📤 Enviando para Webhook de Pedidos (Planilha)...")
      fetch("https://hook.us2.make.com/qkwwr3qvpgkkobinbd28lzsq0k51tt6k", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderDataForSheets),
      })
        .then((response) => {
          console.log("📡 Resposta do Webhook de Pedidos:", response.status)
          if (response.ok) console.log("✅ Dados do pedido enviados para planilha com sucesso!")
        })
        .catch((error) => {
          console.warn("⚠️ Erro ao enviar para Webhook de Pedidos (não crítico):", error)
        })
    } catch (error) {
      console.warn("⚠️ Erro ao preparar dados para webhooks:", error)
    }

    // Retornar client_secret para o frontend
    return NextResponse.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      order_id: paymentIntent.id,
      amount: body.shipping_price,
      message: "PaymentIntent criado com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro na API Checkout:", error)

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Método não permitido. Use POST." }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: "Método não permitido. Use POST." }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Método não permitido. Use POST." }, { status: 405 })
}
