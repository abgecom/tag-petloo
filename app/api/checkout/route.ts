import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase"

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
  shipping_price: number
  product_type: string
  product_color: string
  product_quantity: number
  product_sku: string
  pet_name?: string
  payment_method_id: string // ✅ NOVO CAMPO OBRIGATÓRIO
}

const PRICE_IDS = {
  SUBSCRIPTION: "price_1RjOGMRtGASrDbfemNmh2FzT", // Assinatura App Petloo
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== INICIANDO CHECKOUT API ===")

    const body: CheckoutRequestBody = await request.json()
    console.log("Body recebido:", JSON.stringify(body, null, 2))

    const validAmounts = [
      1887, 2939, 3929, 3960, 4919, 4950, 4990, 5909, 5940, 5980, 6042, 6930, 6970, 7920, 7960, 8910, 8950, 9940, 10930,
      11920, 12910, 13900, 6042, 7032, 8022,
    ]

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
      "payment_method_id", // ✅ VALIDAR PAYMENT_METHOD_ID
    ]

    // Validar campos obrigatórios
    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`Campo obrigatório ausente: ${field}`)
        return NextResponse.json({ error: `Campo obrigatório ausente: ${field}` }, { status: 400 })
      }
    }

    // Validar valor
    if (!validAmounts.includes(body.shipping_price)) {
      console.error(`Valor inválido: ${body.shipping_price}`)
      return NextResponse.json(
        {
          error: `Valor inválido: R$ ${(body.shipping_price / 100).toFixed(2)}. Entre em contato com o suporte.`,
          received_value: body.shipping_price,
          valid_values: validAmounts,
        },
        { status: 400 },
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      console.error(`Email inválido: ${body.email}`)
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    console.log("=== CRIANDO CUSTOMER ===")

    // Criar customer
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
        product_type: body.product_type,
        product_color: body.product_color,
        product_quantity: body.product_quantity.toString(),
        product_sku: body.product_sku,
        pet_name: body.pet_name || "",
      },
    })

    console.log("✅ Customer criado:", customer.id)

    console.log("=== CRIANDO E CONFIRMANDO PAYMENTINTENT ===")

    // ✅ CRIAR E CONFIRMAR PAYMENTINTENT EM UMA ÚNICA OPERAÇÃO
    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.shipping_price,
      currency: "brl",
      customer: customer.id,
      payment_method: body.payment_method_id, // ✅ ANEXAR MÉTODO DE PAGAMENTO
      confirmation_method: "manual",
      confirm: true, // ✅ CONFIRMAR IMEDIATAMENTE
      return_url: `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/obrigado`,
      metadata: {
        type: "shipping",
        customer_name: body.name,
        customer_email: body.email,
        shipping_price: body.shipping_price.toString(),
        product_type: body.product_type,
        product_color: body.product_color,
        product_quantity: body.product_quantity.toString(),
        product_sku: body.product_sku,
        pet_name: body.pet_name || "",
      },
    })

    console.log("✅ PaymentIntent criado:", paymentIntent.id, "Status:", paymentIntent.status)

    // Verificar se o pagamento foi bem-sucedido
    if (paymentIntent.status !== "succeeded") {
      console.error("❌ Pagamento não foi confirmado:", paymentIntent.status)
      return NextResponse.json(
        {
          error: "Pagamento não foi processado",
          status: paymentIntent.status,
          requires_action: paymentIntent.status === "requires_action",
        },
        { status: 400 },
      )
    }

    console.log("=== CRIANDO ASSINATURA ===")

    // Criar assinatura apenas se o pagamento foi bem-sucedido
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: PRICE_IDS.SUBSCRIPTION }],
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
        product_type: body.product_type,
        product_color: body.product_color,
        product_quantity: body.product_quantity.toString(),
        product_sku: body.product_sku,
        pet_name: body.pet_name || "",
      },
    })

    console.log("✅ Assinatura criada:", subscription.id)

    // Salvar no Supabase apenas se tudo deu certo
    console.log("=== SALVANDO NO SUPABASE ===")
    try {
      const orderDataForSupabase = {
        order_id: paymentIntent.id,
        customer_id: customer.id,
        customer_name: body.name,
        customer_email: body.email,
        customer_phone: body.telefone,
        customer_cpf: body.cpf,
        customer_address: `${body.endereco}, ${body.numero}${body.complemento ? `, ${body.complemento}` : ""}, ${body.bairro}`,
        customer_cep: body.cep,
        customer_city: body.cidade,
        customer_state: body.estado,
        order_amount: body.shipping_price,
        payment_method: "credit_card" as const,
        order_status: "paid" as const, // ✅ JÁ CONFIRMADO
        product_type: body.product_type,
        product_color: body.product_color,
        product_quantity: body.product_quantity,
        product_sku: body.product_sku,
        pet_name: body.pet_name || null,
        pix_code: null,
      }

      const { data, error } = await supabase.from("orders").insert([orderDataForSupabase]).select()

      if (error) {
        console.error("❌ Erro ao salvar no Supabase:", error)
      } else {
        console.log("✅ Pedido salvo no Supabase:", data)
      }
    } catch (error) {
      console.error("❌ Erro ao salvar pedido de cartão no Supabase:", error)
    }

    // Enviar para Make.com apenas se tudo deu certo
    console.log("=== ENVIANDO PARA MAKE.COM ===")
    try {
      const orderDataForSheets = {
        order_id: paymentIntent.id,
        customer_id: customer.id,
        stripe_customer_id: customer.id,
        customer_name: body.name,
        customer_email: body.email,
        customer_phone: body.telefone,
        customer_cpf: body.cpf,
        customer_address: body.endereco,
        customer_number: body.numero,
        customer_complement: body.complemento || "",
        customer_neighborhood: body.bairro,
        customer_cep: body.cep,
        customer_city: body.cidade,
        customer_state: body.estado,
        order_amount: body.shipping_price / 100,
        payment_method: "Cartão de Crédito",
        order_status: "Confirmado", // ✅ JÁ CONFIRMADO
        product_type: body.product_type,
        product_color: body.product_color,
        product_quantity: body.product_quantity,
        product_sku: body.product_sku,
        pet_name: body.pet_name || "",
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_price_id: PRICE_IDS.SUBSCRIPTION,
        trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        has_subscription: true,
        created_at: new Date().toISOString(),
        payment_intent_id: paymentIntent.id,
        payment_confirmed: true, // ✅ CONFIRMAÇÃO EXPLÍCITA
      }

      const makeResponse = await fetch("https://hook.us2.make.com/qkwwr3qvpgkkobinbd28lzsq0k51tt6k", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Petloo-Checkout-API",
        },
        body: JSON.stringify(orderDataForSheets),
      })

      if (makeResponse.ok) {
        console.log("✅ Dados enviados para Make.com com sucesso")
      } else {
        console.warn("⚠️ Erro ao enviar para Make.com:", makeResponse.status)
      }
    } catch (error) {
      console.warn("⚠️ Erro ao preparar dados para planilha:", error)
    }

    console.log("=== CHECKOUT CONCLUÍDO COM SUCESSO ===")

    return NextResponse.json({
      success: true,
      payment_intent_id: paymentIntent.id,
      payment_status: paymentIntent.status,
      customer_id: customer.id,
      subscription_id: subscription.id,
      subscription_status: subscription.status,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      message: "Pagamento processado com sucesso! Frete cobrado e assinatura do app iniciada com 30 dias grátis.",
    })
  } catch (error) {
    console.error("❌ Erro no checkout:", error)

    // Garantir que sempre retornamos JSON
    if (error instanceof Stripe.errors.StripeError) {
      console.error("Stripe Error:", error.type, error.message)
      return NextResponse.json(
        {
          error: "Erro no processamento do pagamento",
          details: error.message,
          type: error.type,
        },
        { status: 400 },
      )
    }

    // Para qualquer outro erro, retornar JSON também
    console.error("Erro geral:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
