import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log("🔔 Webhook recebido:", event.type)

    // Processar eventos relevantes
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`🔔 Evento não processado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Erro no webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

// Processar pagamento da tag confirmado
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log("💳 Pagamento confirmado:", paymentIntent.id)

    if (!paymentIntent.customer) {
      console.warn("⚠️ Payment Intent sem customer associado")
      return
    }

    // Buscar customer
    const customer = (await stripe.customers.retrieve(paymentIntent.customer as string)) as Stripe.Customer

    if (!customer.metadata?.pending_subscription) {
      console.log("ℹ️ Customer não tem assinatura pendente")
      return
    }

    const subscriptionPriceId = customer.metadata.subscription_price_id

    if (!subscriptionPriceId) {
      console.error("❌ Price ID da assinatura não encontrado")
      return
    }

    console.log("🔄 Criando assinatura para customer:", customer.id)

    // Criar assinatura
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: subscriptionPriceId,
        },
      ],
      trial_period_days: 30, // 30 dias grátis
      metadata: {
        created_from_purchase: "true",
        purchase_payment_intent: paymentIntent.id,
        product_type: customer.metadata.product_type || "",
        pet_name: customer.metadata.pet_name || "",
      },
    })

    console.log("✅ Assinatura criada:", subscription.id)

    // Remover flag de assinatura pendente
    await stripe.customers.update(customer.id, {
      metadata: {
        ...customer.metadata,
        pending_subscription: "false",
        subscription_id: subscription.id,
        subscription_status: subscription.status,
      },
    })

    // Atualizar dados na planilha via Make.com
    try {
      const updateData = {
        stripe_customer_id: customer.id,
        payment_intent_id: paymentIntent.id,
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_created_at: new Date().toISOString(),
        order_status: "Pago",
        payment_status: "Confirmado",
        trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      }

      console.log("📤 Atualizando dados da assinatura no Make.com:", updateData)

      fetch("https://hook.us2.make.com/ts1lbb4rx67zdwdy1bd9dkmcy7fwnufj", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })
        .then((response) => {
          console.log("📡 Resposta do Make.com (assinatura):", response.status)
        })
        .catch((error) => {
          console.warn("⚠️ Erro ao atualizar assinatura no Make.com:", error)
        })
    } catch (error) {
      console.warn("⚠️ Erro ao preparar dados da assinatura:", error)
    }
  } catch (error) {
    console.error("❌ Erro ao processar pagamento confirmado:", error)
  }
}

// Processar pagamento de fatura da assinatura
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log("🧾 Fatura paga:", invoice.id)

    if (!invoice.subscription) {
      console.log("ℹ️ Fatura não é de assinatura")
      return
    }

    // Atualizar status na planilha
    const updateData = {
      subscription_id: invoice.subscription,
      invoice_id: invoice.id,
      invoice_status: "paid",
      invoice_amount: invoice.amount_paid / 100, // Converter centavos para reais
      invoice_paid_at: new Date().toISOString(),
    }

    fetch("https://hook.us2.make.com/ts1lbb4rx67zdwdy1bd9dkmcy7fwnufj", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    })
      .then((response) => {
        console.log("📡 Fatura atualizada no Make.com:", response.status)
      })
      .catch((error) => {
        console.warn("⚠️ Erro ao atualizar fatura no Make.com:", error)
      })
  } catch (error) {
    console.error("❌ Erro ao processar fatura paga:", error)
  }
}

// Processar assinatura criada
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("📅 Assinatura criada:", subscription.id, "Status:", subscription.status)
}

// Processar assinatura atualizada
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("🔄 Assinatura atualizada:", subscription.id, "Status:", subscription.status)

  // Atualizar status na planilha
  const updateData = {
    subscription_id: subscription.id,
    subscription_status: subscription.status,
    subscription_updated_at: new Date().toISOString(),
  }

  fetch("https://hook.us2.make.com/ts1lbb4rx67zdwdy1bd9dkmcy7fwnufj", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  }).catch((error) => {
    console.warn("⚠️ Erro ao atualizar status da assinatura:", error)
  })
}

// Processar assinatura cancelada
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("❌ Assinatura cancelada:", subscription.id)

  // Atualizar status na planilha
  const updateData = {
    subscription_id: subscription.id,
    subscription_status: "canceled",
    subscription_canceled_at: new Date().toISOString(),
  }

  fetch("https://hook.us2.make.com/ts1lbb4rx67zdwdy1bd9dkmcy7fwnufj", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  }).catch((error) => {
    console.warn("⚠️ Erro ao atualizar cancelamento da assinatura:", error)
  })
}
