import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
  }

  console.log("🔔 Webhook recebido:", event.type)

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("✅ Pagamento confirmado via webhook:", paymentIntent.id)

        // Buscar dados do customer
        const customer = await stripe.customers.retrieve(paymentIntent.customer as string)

        if (customer.deleted) {
          console.error("❌ Customer foi deletado")
          break
        }

        console.log("👤 Customer encontrado:", customer.id)

        // Preparar dados para enviar ao Make.com com status "Confirmado"
        const orderDataForSheets = {
          order_id: paymentIntent.id,
          customer_id: customer.id,
          stripe_customer_id: customer.id,
          customer_name: customer.name || customer.metadata.name || "",
          customer_email: customer.email || "",
          customer_phone: customer.phone || customer.metadata.telefone || "",
          customer_cpf: customer.metadata.cpf || "",
          customer_address: `${customer.metadata.endereco || ""}, ${customer.metadata.numero || ""}${customer.metadata.complemento ? `, ${customer.metadata.complemento}` : ""}, ${customer.metadata.bairro || ""}`,
          customer_cep: customer.metadata.cep || "",
          customer_city: customer.metadata.cidade || "",
          customer_state: customer.metadata.estado || "",
          order_amount: paymentIntent.amount / 100, // Converter centavos para reais
          payment_method: "Cartão de Crédito",
          order_status: "Confirmado", // ✅ STATUS CONFIRMADO PARA CARTÃO
          product_type: customer.metadata.product_type || "",
          product_color: customer.metadata.product_color || "",
          product_quantity: Number.parseInt(customer.metadata.product_quantity || "1"),
          product_sku: customer.metadata.product_sku || "",
          pet_name: customer.metadata.pet_name || "",
          payment_intent_id: paymentIntent.id,
          stripe_payment_status: paymentIntent.status,
          has_subscription: true,
        }

        console.log("=== ENVIANDO DADOS ATUALIZADOS PARA MAKE.COM (CARTÃO CONFIRMADO) ===")
        console.log("Dados:", JSON.stringify(orderDataForSheets, null, 2))

        // Enviar dados atualizados para Make.com
        try {
          const response = await fetch("https://hook.us2.make.com/qkwwr3qvpgkkobinbd28lzsq0k51tt6k", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(orderDataForSheets),
          })

          console.log("📡 Resposta do Make.com (webhook):", response.status)

          if (response.ok) {
            console.log("✅ Dados do pagamento confirmado enviados para Make.com com sucesso!")
          } else {
            console.error("❌ Erro ao enviar para Make.com:", response.status)
          }
        } catch (error) {
          console.error("❌ Erro ao enviar dados atualizados para Make.com:", error)
        }

        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("❌ Pagamento falhou:", paymentIntent.id)

        // Buscar dados do customer
        const customer = await stripe.customers.retrieve(paymentIntent.customer as string)

        if (customer.deleted) {
          console.error("❌ Customer foi deletado")
          break
        }

        // Preparar dados para enviar ao Make.com com status "Pagamento Falhou"
        const failedOrderData = {
          order_id: paymentIntent.id,
          customer_id: customer.id,
          stripe_customer_id: customer.id,
          customer_name: customer.name || customer.metadata.name || "",
          customer_email: customer.email || "",
          customer_phone: customer.phone || customer.metadata.telefone || "",
          customer_cpf: customer.metadata.cpf || "",
          customer_address: `${customer.metadata.endereco || ""}, ${customer.metadata.numero || ""}${customer.metadata.complemento ? `, ${customer.metadata.complemento}` : ""}, ${customer.metadata.bairro || ""}`,
          customer_cep: customer.metadata.cep || "",
          customer_city: customer.metadata.cidade || "",
          customer_state: customer.metadata.estado || "",
          order_amount: paymentIntent.amount / 100,
          payment_method: "Cartão de Crédito",
          order_status: "Pagamento Falhou",
          product_type: customer.metadata.product_type || "",
          product_color: customer.metadata.product_color || "",
          product_quantity: Number.parseInt(customer.metadata.product_quantity || "1"),
          product_sku: customer.metadata.product_sku || "",
          pet_name: customer.metadata.pet_name || "",
          payment_intent_id: paymentIntent.id,
          stripe_payment_status: paymentIntent.status,
          failure_reason: paymentIntent.last_payment_error?.message || "Erro desconhecido",
          has_subscription: true,
        }

        console.log("=== ENVIANDO DADOS DE PAGAMENTO FALHOU PARA MAKE.COM ===")
        console.log("Dados:", JSON.stringify(failedOrderData, null, 2))

        // Enviar dados de falha para Make.com
        try {
          const response = await fetch("https://hook.us2.make.com/qkwwr3qvpgkkobinbd28lzsq0k51tt6k", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(failedOrderData),
          })

          console.log("📡 Resposta do Make.com (falha):", response.status)

          if (response.ok) {
            console.log("✅ Dados de pagamento falhou enviados para Make.com!")
          } else {
            console.error("❌ Erro ao enviar falha para Make.com:", response.status)
          }
        } catch (error) {
          console.error("❌ Erro ao enviar dados de falha para Make.com:", error)
        }

        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("✅ Pagamento de fatura bem-sucedido:", invoice.id)

        if (invoice.subscription) {
          console.log("🔄 Pagamento de assinatura confirmado:", invoice.subscription)
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("❌ Pagamento de fatura falhou:", invoice.id)

        if (invoice.subscription) {
          console.log("⚠️ Falha no pagamento da assinatura:", invoice.subscription)
        }
        break
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription
        console.log("🆕 Assinatura criada:", subscription.id)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        console.log("🔄 Assinatura atualizada:", subscription.id, "Status:", subscription.status)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        console.log("🗑️ Assinatura cancelada:", subscription.id)
        break
      }

      default:
        console.log(`🔔 Evento não tratado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método não permitido. Use POST." }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: "Método não permitido. Use POST." }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Método não permitido. Use POST." }, { status: 405 })
}
