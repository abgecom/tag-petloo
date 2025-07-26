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

  console.log("🔔 Webhook recebido:", event.type, "ID:", event.id)

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("✅ Pagamento confirmado via webhook:", paymentIntent.id)
        console.log("💰 Valor:", paymentIntent.amount, "centavos")

        // Buscar dados do customer
        let customer: Stripe.Customer | null = null

        try {
          const customerData = await stripe.customers.retrieve(paymentIntent.customer as string)
          if (!customerData.deleted) {
            customer = customerData as Stripe.Customer
            console.log("👤 Customer encontrado:", customer.id)
          } else {
            console.error("❌ Customer foi deletado")
            break
          }
        } catch (customerError) {
          console.error("❌ Erro ao buscar customer:", customerError)
          break
        }

        if (!customer) {
          console.error("❌ Customer não encontrado")
          break
        }

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
          product_type: customer.metadata.product_type || "Tag Genérica",
          product_color: customer.metadata.product_color || "Não se aplica",
          product_quantity: Number.parseInt(customer.metadata.product_quantity || "1"),
          product_sku: customer.metadata.product_sku || "TAG-APP-DEFAULT",
          pet_name: customer.metadata.pet_name || "",
          payment_intent_id: paymentIntent.id,
          stripe_payment_status: paymentIntent.status,
          payment_confirmed_at: new Date().toISOString(),
          webhook_received_at: new Date().toISOString(),
          has_subscription: true,
          // Dados adicionais do pagamento
          payment_amount_received: paymentIntent.amount_received || paymentIntent.amount,
          payment_currency: paymentIntent.currency,
          payment_charges: paymentIntent.charges?.data?.length || 0,
        }

        console.log("=== ENVIANDO DADOS CONFIRMADOS PARA MAKE.COM (CARTÃO CONFIRMADO) ===")
        console.log("Dados:", JSON.stringify(orderDataForSheets, null, 2))

        // Enviar dados confirmados para Make.com
        try {
          const response = await fetch("https://hook.us2.make.com/qkwwr3qvpgkkobinbd28lzsq0k51tt6k", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Petloo-Webhook/1.0",
            },
            body: JSON.stringify(orderDataForSheets),
          })

          console.log("📡 Resposta do Make.com (webhook confirmado):", {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
          })

          if (response.ok) {
            console.log("✅ Dados do pagamento confirmado enviados para Make.com com sucesso!")

            // Tentar ler a resposta se for JSON
            try {
              const responseText = await response.text()
              if (responseText) {
                console.log("📋 Resposta do Make.com:", responseText)
              }
            } catch (readError) {
              console.log("📋 Resposta do Make.com recebida (não foi possível ler o conteúdo)")
            }
          } else {
            console.error("❌ Erro ao enviar para Make.com:", {
              status: response.status,
              statusText: response.statusText,
            })

            // Tentar ler a resposta de erro
            try {
              const errorText = await response.text()
              console.error("📋 Erro detalhado do Make.com:", errorText)
            } catch (readError) {
              console.error("📋 Não foi possível ler o erro do Make.com")
            }
          }
        } catch (error) {
          console.error("❌ Erro ao enviar dados confirmados para Make.com:", error)

          if (error instanceof TypeError && error.message.includes("fetch")) {
            console.error("🌐 Erro de rede ao conectar com Make.com")
          }
        }

        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("❌ Pagamento falhou:", paymentIntent.id)

        // Buscar dados do customer
        let customer: Stripe.Customer | null = null

        try {
          const customerData = await stripe.customers.retrieve(paymentIntent.customer as string)
          if (!customerData.deleted) {
            customer = customerData as Stripe.Customer
          }
        } catch (customerError) {
          console.error("❌ Erro ao buscar customer para falha:", customerError)
          break
        }

        if (!customer) {
          console.error("❌ Customer não encontrado para falha")
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
          product_type: customer.metadata.product_type || "Tag Genérica",
          product_color: customer.metadata.product_color || "Não se aplica",
          product_quantity: Number.parseInt(customer.metadata.product_quantity || "1"),
          product_sku: customer.metadata.product_sku || "TAG-APP-DEFAULT",
          pet_name: customer.metadata.pet_name || "",
          payment_intent_id: paymentIntent.id,
          stripe_payment_status: paymentIntent.status,
          failure_reason: paymentIntent.last_payment_error?.message || "Erro desconhecido",
          failure_code: paymentIntent.last_payment_error?.code || "unknown",
          payment_failed_at: new Date().toISOString(),
          webhook_received_at: new Date().toISOString(),
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
              "User-Agent": "Petloo-Webhook/1.0",
            },
            body: JSON.stringify(failedOrderData),
          })

          console.log("📡 Resposta do Make.com (falha):", {
            status: response.status,
            ok: response.ok,
          })

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

      case "payment_intent.requires_action": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("⚠️ Pagamento requer ação adicional:", paymentIntent.id)
        break
      }

      case "payment_intent.processing": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("🔄 Pagamento em processamento:", paymentIntent.id)
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

    return NextResponse.json({ received: true, event_type: event.type, event_id: event.id })
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        event_type: event.type,
        event_id: event.id,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Método não permitido. Use POST.",
      webhook_url: "/api/webhooks/stripe",
      status: "active",
    },
    { status: 405 },
  )
}

export async function PUT() {
  return NextResponse.json({ error: "Método não permitido. Use POST." }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Método não permitido. Use POST." }, { status: 405 })
}
