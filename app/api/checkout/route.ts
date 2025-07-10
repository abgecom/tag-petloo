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
