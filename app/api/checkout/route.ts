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

    // 🔧 CORREÇÃO: Expandir lista de valores válidos para incluir todos os cenários possíveis
    const validAmounts = [
      1887, // R$ 18,87 - Frete básico
      2939, // R$ 29,39 - Frete expresso
      3929, // R$ 39,29 - 2 tags genéricas (29,39 + 9,90)
      3960, // R$ 39,60 - 5 tags genéricas (4 x 9,90 = frete grátis)
      4919, // R$ 49,19 - 3 tags genéricas (29,39 + 19,80)
      4950, // R$ 49,50 - 6 tags genéricas (5 x 9,90 = frete grátis)
      4990, // R$ 49,90 - 1 tag personalizada
      5909, // R$ 59,09 - 4 tags genéricas (29,39 + 29,70)
      5940, // R$ 59,40 - 7 tags genéricas (6 x 9,90 = frete grátis)
      5980, // R$ 59,80 - 2 tags personalizadas (49,90 + 9,90)
      6042, // R$ 60,42 - Valor antigo (manter compatibilidade)
      6930, // R$ 69,30 - 8 tags genéricas (7 x 9,90 = frete grátis)
      6970, // R$ 69,70 - 3 tags personalizadas (49,90 + 9,90 + 9,90)
      7920, // R$ 79,20 - 9 tags genéricas (8 x 9,90 = frete grátis)
      7960, // R$ 79,60 - 4 tags personalizadas (49,90 + 9,90 + 9,90 + 9,90)
      8910, // R$ 89,10 - 10 tags genéricas (9 x 9,90 = frete grátis)
      8950, // R$ 89,50 - 5 tags personalizadas
      9940, // R$ 99,40 - 6 tags personalizadas
      10930, // R$ 109,30 - 7 tags personalizadas
      11920, // R$ 119,20 - 8 tags personalizadas
      12910, // R$ 129,10 - 9 tags personalizadas
      13900, // R$ 139,00 - 10 tags personalizadas
      // Adicionar valores com frete expresso (+1052 centavos = +R$ 10,52)
      6042, // R$ 60,42 - 1 tag + frete expresso (4990 + 1052)
      7032, // R$ 70,32 - 2 tags + frete expresso (5980 + 1052)
      8022, // R$ 80,22 - 3 tags + frete expresso (6970 + 1052)
    ]

    // Validar valor
    if (!validAmounts.includes(body.shipping_price)) {
      console.error("❌ Valor inválido recebido:", body.shipping_price)
      console.error("💡 Valores válidos:", validAmounts)
      return NextResponse.json(
        {
          error: `Valor inválido: R$ ${(body.shipping_price / 100).toFixed(2)}. Entre em contato com o suporte.`,
          received_value: body.shipping_price,
          valid_values: validAmounts,
        },
        { status: 400 },
      )
    }

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

    // Criar Payment Intent no Stripe
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
        // 🎯 ADICIONAR DADOS DO PRODUTO
        product_type: body.product_type,
        product_color: body.product_color,
        product_quantity: body.product_quantity.toString(),
        product_sku: body.product_sku,
        pet_name: body.pet_name || "",
      },
    })

    console.log("✅ Payment Intent criado:", paymentIntent.id)

    // Salvar dados na planilha Google via Make.com
    try {
      const orderDataForSheets = {
        payment_intent_id: paymentIntent.id,
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
        // 🎯 USAR DADOS REAIS DO PRODUTO
        product_type: body.product_type,
        product_color: body.product_color,
        product_quantity: body.product_quantity,
        product_sku: body.product_sku,
        pet_name: body.pet_name || "",
      }

      console.log("=== ENVIANDO DADOS PARA MAKE.COM ===")
      console.log("Dados:", JSON.stringify(orderDataForSheets, null, 2))

      // Enviar para Make.com (não aguardar resposta para não bloquear)
      fetch("https://hook.us2.make.com/your-webhook-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderDataForSheets),
      })
        .then((response) => {
          console.log("📡 Resposta do Make.com:", response.status)
          return response.text()
        })
        .then((data) => {
          console.log("✅ Dados enviados para Make.com com sucesso!")
        })
        .catch((error) => {
          console.warn("⚠️ Erro ao enviar para Make.com (não crítico):", error)
        })
    } catch (error) {
      console.warn("⚠️ Erro ao preparar dados para planilha:", error)
    }

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: body.shipping_price,
      message: "Payment Intent criado com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro na API checkout:", error)

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
