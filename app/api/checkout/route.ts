import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

// Define the request body interface
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
  shipping_price: number // Value in cents
  // 🎯 NOVOS CAMPOS DO PRODUTO
  product_type: string
  product_color: string
  product_quantity: number
  product_sku: string
  pet_name?: string
}

// Define Price IDs based on shipping cost
const PRICE_IDS = {
  SHIPPING_1887: "price_1Rj0n7RtGASrDbfe40z60yvg", // R$ 18,87
  SHIPPING_2939: "price_1Rj0p5RtGASrDbfe9s1cHmhC", // R$ 29,39
  PERSONALIZED_ORANGE: "price_1RjRxWRtGASrDbfeP7jp0wb0", // Tag Laranja R$ 49,90
  PERSONALIZED_PURPLE: "price_1RjRyURtGASrDbfeuppcCqtm", // Tag Roxa R$ 49,90
  SUBSCRIPTION: "price_1RjOGMRtGASrDbfemNmh2FzT", // Monthly subscription
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CheckoutRequestBody = await request.json()

    console.log("=== DADOS RECEBIDOS NA API CHECKOUT ===")
    console.log("📦 Dados completos:", JSON.stringify(body, null, 2))

    // 🔧 CORREÇÃO: Expandir lista de valores válidos para incluir todos os cenários possíveis
    const validAmounts = [
      1887, // R$ 18,87 - Frete básico
      2939, // R$ 29,39 - Frete expresso
      3929, // R$ 39,29 - 2 tags genéricas (29,39 + 9,90)
      3960, // R$ 39,60 - 6 tags genéricas (5 x 9,90 = frete grátis)
      4919, // R$ 49,19 - 3 tags genéricas (29,39 + 19,80)
      4950, // R$ 49,50 - 7 tags genéricas (6 x 9,90 = frete grátis)
      4990, // R$ 49,90 - 1 tag personalizada
      5909, // R$ 59,09 - 4 tags genéricas (29,39 + 29,70)
      5940, // R$ 59,40 - 8 tags genéricas (7 x 9,90 = frete grátis)
      5980, // R$ 59,80 - 2 tags personalizadas (49,90 + 9,90)
      6042, // R$ 60,42 - Valor antigo (manter compatibilidade)
      6930, // R$ 69,30 - 9 tags genéricas (8 x 9,90 = frete grátis)
      6970, // R$ 69,70 - 3 tags personalizadas (49,90 + 9,90 + 9,90)
      7920, // R$ 79,20 - 10 tags genéricas (9 x 9,90 = frete grátis)
      7960, // R$ 79,60 - 4 tags personalizadas (49,90 + 9,90 + 9,90 + 9,90)
      8910, // R$ 89,10 - 11 tags genéricas (10 x 9,90 = frete grátis)
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

    // Validate required fields
    const requiredFields = [
      "name",
      "email",
      "cpf",
      "telefone",
      "cep",
      "endereco",
      "numero",
      "bairro",
      "cidade",
      "estado",
      "shipping_price",
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Campo obrigatório ausente: ${field}` }, { status: 400 })
      }
    }

    // Validate shipping price
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    console.log("=== DADOS COMPLETOS RECEBIDOS NA API CHECKOUT ===")
    console.log("🎯 DADOS DO PRODUTO:")
    console.log("Tipo:", body.product_type)
    console.log("Cor:", body.product_color)
    console.log("Quantidade:", body.product_quantity)
    console.log("SKU:", body.product_sku)
    console.log("Nome do Pet:", body.pet_name || "Não informado")
    console.log(
      "💰 Valor do checkout:",
      body.shipping_price,
      "centavos =",
      (body.shipping_price / 100).toFixed(2),
      "reais",
    )

    // Step 1: Create Customer in Stripe
    const customer = await stripe.customers.create({
      name: body.name,
      email: body.email,
      phone: body.telefone,
      metadata: {
        cpf: body.cpf,
        cep: body.cep,
        endereco: body.endereco,
        numero: body.numero,
        bairro: body.bairro,
        cidade: body.cidade,
        estado: body.estado,
        complemento: body.complemento || "",
        // 🎯 ADICIONAR METADADOS DO PRODUTO
        product_type: body.product_type,
        product_color: body.product_color,
        product_quantity: body.product_quantity.toString(),
        product_sku: body.product_sku,
        pet_name: body.pet_name || "", // Adicionar nome do pet
      },
    })

    console.log("✅ Customer criado:", customer.id)

    // Step 2: Create PaymentIntent for shipping cost (without payment method)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.shipping_price,
      currency: "brl",
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        type: "shipping",
        customer_name: body.name,
        customer_email: body.email,
        shipping_price: body.shipping_price.toString(),
        // 🎯 ADICIONAR METADADOS DO PRODUTO
        product_type: body.product_type,
        product_color: body.product_color,
        product_quantity: body.product_quantity.toString(),
        product_sku: body.product_sku,
        pet_name: body.pet_name || "",
      },
    })

    console.log("✅ PaymentIntent criado:", paymentIntent.id)

    // Step 3: Create Subscription with 30-day trial IMEDIATAMENTE
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: PRICE_IDS.SUBSCRIPTION,
        },
      ],
      trial_period_days: 30,
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        customer_name: body.name,
        customer_email: body.email,
        trial_start: new Date().toISOString(),
        // 🎯 ADICIONAR METADADOS DO PRODUTO
        product_type: body.product_type,
        product_color: body.product_color,
        product_quantity: body.product_quantity.toString(),
        product_sku: body.product_sku,
        pet_name: body.pet_name || "",
      },
    })

    console.log("✅ Subscription criada:", subscription.id)
    console.log("🎯 Status da subscription:", subscription.status)
    console.log("📅 Trial end:", subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null)

    // Salvar dados na planilha Google via Make.com
    try {
      const orderDataForSheets = {
        order_id: paymentIntent.id,
        customer_id: customer.id,
        stripe_customer_id: customer.id,
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
        pet_name: body.pet_name || "", // Adicionar nome do pet
        // 🔄 DADOS DA ASSINATURA CRIADA
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_price_id: PRICE_IDS.SUBSCRIPTION,
        trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        has_subscription: true,
      }

      console.log("=== ENVIANDO DADOS PARA MAKE.COM ===")
      console.log("Dados:", JSON.stringify(orderDataForSheets, null, 2))

      // Enviar para Make.com (não aguardar resposta para não bloquear)
      fetch("https://hook.us2.make.com/qkwwr3qvpgkkobinbd28lzsq0k51tt6k", {
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

      console.log("📊 Dados enviados para planilha Google com assinatura ativa")
    } catch (error) {
      console.warn("⚠️ Erro ao preparar dados para planilha:", error)
    }

    // Step 4: Return response with client_secret and success status
    return NextResponse.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      customer_id: customer.id,
      payment_intent_id: paymentIntent.id,
      subscription_id: subscription.id,
      subscription_status: subscription.status,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      message: "Checkout criado com sucesso! Frete será cobrado agora, assinatura do app iniciará com 30 dias grátis.",
    })
  } catch (error) {
    console.error("❌ Erro no checkout:", error)

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: "Erro no processamento do pagamento",
          details: error.message,
          type: error.type,
        },
        { status: 400 },
      )
    }

    // Handle other errors
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
