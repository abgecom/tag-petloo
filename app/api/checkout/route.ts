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
  shipping_price: number // Value in cents: 1887 or 2990
}

// Define Price IDs based on shipping cost
const PRICE_IDS = {
  SHIPPING_1887: "price_1Rj0n7RtGASrDbfe40z60yvg", // R$ 18,87
  SHIPPING_2939: "price_1Rj0p5RtGASrDbfe9s1cHmhC", // R$ 29,39
  PERSONALIZED_ORANGE: "price_1RjRxWRtGASrDbfeP7jp0wb0", // Tag Laranja R$ 39,90
  PERSONALIZED_PURPLE: "price_1RjRyURtGASrDbfeuppcCqtm", // Tag Roxa R$ 39,90
  SUBSCRIPTION: "price_1RjOGMRtGASrDbfemNmh2FzT", // Monthly subscription
}

// Função para determinar o tipo e cor do produto
function getProductInfo(shippingPrice: number) {
  switch (shippingPrice) {
    case 1887: // R$ 18,87 - Frete padrão
      return {
        type: "Tag Genérica",
        color: "Não se aplica",
        name: "Tag rastreamento Petloo + App (Frete Padrão)",
        sku: "TAG-APP-1887",
      }
    case 2939: // R$ 29,39 - Frete expresso
      return {
        type: "Tag Genérica",
        color: "Não se aplica",
        name: "Tag rastreamento Petloo + App (Frete Expresso)",
        sku: "TAG-APP-2939",
      }
    case 3990: // R$ 39,90 - Tag personalizada frete grátis
      return {
        type: "Tag Personalizada",
        color: "A definir", // Será atualizado depois
        name: "Tag Personalizada + App (Frete Grátis)",
        sku: "TAG-PERSONALIZADA-FREE-3990",
      }
    case 5042: // R$ 50,42 - Tag personalizada frete expresso
      return {
        type: "Tag Personalizada",
        color: "A definir", // Será atualizado depois
        name: "Tag Personalizada + App (Frete Expresso)",
        sku: "TAG-PERSONALIZADA-EXPRESS-5042",
      }
    default:
      return {
        type: "Produto Desconhecido",
        color: "Não se aplica",
        name: "Produto não identificado",
        sku: `UNKNOWN-${shippingPrice}`,
      }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CheckoutRequestBody = await request.json()

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
    if (![1887, 2939, 3990, 5042].includes(body.shipping_price)) {
      return NextResponse.json(
        { error: "Valor inválido. Deve ser 1887, 2939, 3990 ou 5042 centavos." },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    // Obter informações do produto
    const productInfo = getProductInfo(body.shipping_price)

    // Tentar obter cor específica do sessionStorage se for produto personalizado
    if (typeof window !== "undefined" && (body.shipping_price === 3990 || body.shipping_price === 5042)) {
      try {
        const personalizedData = sessionStorage.getItem("personalizedProduct")
        if (personalizedData) {
          const data = JSON.parse(personalizedData)
          if (data.color) {
            productInfo.color = data.color === "orange" ? "Laranja" : data.color === "purple" ? "Roxa" : data.color
            productInfo.sku = `TAG-PERSONALIZADA-${data.color.toUpperCase()}-${body.shipping_price === 3990 ? "FREE" : "EXPRESS"}`
          }
        }
      } catch (error) {
        console.warn("Não foi possível obter cor do produto personalizado:", error)
      }
    }

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
      },
    })

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
      },
    })

    // Salvar dados na planilha Google via Make.com
    try {
      const orderDataForSheets = {
        order_id: paymentIntent.id,
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
        order_status: "Processando",
        // Novos campos do produto
        product_type: productInfo.type,
        product_color: productInfo.color,
        product_quantity: 1,
        product_sku: productInfo.sku,
      }

      // Enviar para API de planilha (não aguardar resposta)
      fetch(`${request.url.replace("/api/checkout", "/api/save-to-sheets")}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderDataForSheets),
      }).catch((error) => {
        console.warn("⚠️ Erro ao salvar na planilha (não crítico):", error)
      })

      console.log("📊 Dados enviados para planilha Google")
    } catch (error) {
      console.warn("⚠️ Erro ao preparar dados para planilha:", error)
    }

    // Step 3: Create Subscription with 30-day trial
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
      },
    })

    // Step 4: Return response with client_secret and success status
    return NextResponse.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      customer_id: customer.id,
      payment_intent_id: paymentIntent.id,
      subscription_id: subscription.id,
      subscription_status: subscription.status,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      message: "Checkout criado com sucesso. Frete será cobrado agora, assinatura iniciará após 30 dias.",
    })
  } catch (error) {
    console.error("Erro no checkout:", error)

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
