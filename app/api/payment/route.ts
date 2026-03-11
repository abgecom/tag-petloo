import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import {
  pagarmeRequest,
  formatPhoneForPagarme,
  formatDocumentForPagarme,
  formatAddressForPagarme,
  formatNameForPagarme,
  PagarmeError,
} from "@/lib/pagarme/api"
import { PAGARME_CONFIG } from "@/lib/pagarme/config"

// ============================================
// TIPOS
// ============================================

interface PaymentRequestBody {
  amount: number // Valor em centavos
  paymentMethod: "credit_card" | "pix"
  customer: {
    name: string
    email: string
    cpf: string
    phone: string
  }
  shipping: {
    cep: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
  }
  items: Array<{
    name: string
    sku: string
    quantity: number
    price: number // Preço unitário em centavos
  }>
  card?: {
    number: string
    holder_name: string
    exp_month: number
    exp_year: number
    cvv: string
  }
  petName?: string
}

interface PagarmeCustomerResponse {
  id: string
  name: string
  email: string
  document: string
  document_type: string
}

interface PagarmeCardResponse {
  id: string
  first_six_digits: string
  last_four_digits: string
  brand: string
  holder_name: string
  exp_month: number
  exp_year: number
}

interface PagarmeOrderResponse {
  id: string
  code: string
  amount: number
  status: string
  charges?: Array<{
    id: string
    code: string
    amount: number
    status: string
    payment_method: string
    last_transaction?: {
      id: string
      status: string
      qr_code?: string
      qr_code_url?: string
      expires_at?: string
    }
  }>
}

interface PagarmeSubscriptionResponse {
  id: string
  code: string
  status: string
  start_at: string
  next_billing_at: string
  plan: {
    id: string
    name: string
  }
}

// ============================================
// VALIDAÇÃO
// ============================================

const VALID_AMOUNTS = [
  1887, 2939, 3929, 3960, 4919, 4950, 4990, 5909, 5940, 5980, 
  6042, 6930, 6970, 7920, 7960, 8910, 8950, 9940, 10930,
  11920, 12910, 13900, 7032, 8022,
]

function validatePayload(body: PaymentRequestBody): string | null {
  const requiredFields = ["amount", "paymentMethod", "customer", "shipping", "items"]
  
  for (const field of requiredFields) {
    if (!body[field as keyof PaymentRequestBody]) {
      return `Campo obrigatório ausente: ${field}`
    }
  }

  // Validar customer
  const customerFields = ["name", "email", "cpf", "phone"]
  for (const field of customerFields) {
    if (!body.customer[field as keyof typeof body.customer]) {
      return `Campo obrigatório do cliente ausente: ${field}`
    }
  }

  // Validar shipping
  const shippingFields = ["cep", "street", "number", "neighborhood", "city", "state"]
  for (const field of shippingFields) {
    if (!body.shipping[field as keyof typeof body.shipping]) {
      return `Campo obrigatório do endereço ausente: ${field}`
    }
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(body.customer.email)) {
    return "Email inválido"
  }

  // Validar valor
  if (!VALID_AMOUNTS.includes(body.amount)) {
    return `Valor inválido: R$ ${(body.amount / 100).toFixed(2)}`
  }

  // Validar cartão se for credit_card
  if (body.paymentMethod === "credit_card") {
    if (!body.card) {
      return "Dados do cartão são obrigatórios para pagamento com cartão de crédito"
    }
    const cardFields = ["number", "holder_name", "exp_month", "exp_year", "cvv"]
    for (const field of cardFields) {
      if (!body.card[field as keyof typeof body.card]) {
        return `Campo obrigatório do cartão ausente: ${field}`
      }
    }
  }

  return null
}

// ============================================
// HANDLERS DA PAGAR.ME
// ============================================

/**
 * Cria um cliente na Pagar.me
 */
async function createPagarmeCustomer(customer: PaymentRequestBody["customer"], shipping: PaymentRequestBody["shipping"]): Promise<PagarmeCustomerResponse> {
  const phone = formatPhoneForPagarme(customer.phone)
  const document = formatDocumentForPagarme(customer.cpf)
  const address = formatAddressForPagarme({
    street: shipping.street,
    number: shipping.number,
    complement: shipping.complement,
    neighborhood: shipping.neighborhood,
    city: shipping.city,
    state: shipping.state,
    cep: shipping.cep,
  })
  const { name, last_name } = formatNameForPagarme(customer.name)

  const customerData = {
    name: `${name} ${last_name}`,
    email: customer.email,
    document: document.number,
    document_type: document.type,
    type: "individual",
    phones: {
      mobile_phone: phone,
    },
    address,
  }

  console.log("=== CRIANDO CUSTOMER NA PAGAR.ME ===")
  console.log("Dados:", JSON.stringify(customerData, null, 2))

  const response = await pagarmeRequest<PagarmeCustomerResponse>(
    PAGARME_CONFIG.endpoints.customers,
    {
      method: "POST",
      body: JSON.stringify(customerData),
    }
  )

  console.log("Customer criado:", response.id)
  return response
}

/**
 * Cria um cartão no customer
 */
async function createPagarmeCard(
  customerId: string,
  card: NonNullable<PaymentRequestBody["card"]>,
  billingAddress: PaymentRequestBody["shipping"]
): Promise<PagarmeCardResponse> {
  const address = formatAddressForPagarme({
    street: billingAddress.street,
    number: billingAddress.number,
    complement: billingAddress.complement,
    neighborhood: billingAddress.neighborhood,
    city: billingAddress.city,
    state: billingAddress.state,
    cep: billingAddress.cep,
  })

  const cardData = {
    number: card.number.replace(/\s/g, ""),
    holder_name: card.holder_name,
    exp_month: card.exp_month,
    exp_year: card.exp_year,
    cvv: card.cvv,
    billing_address: address,
  }

  console.log("=== CRIANDO CARTÃO NA PAGAR.ME ===")
  console.log("Customer ID:", customerId)

  const response = await pagarmeRequest<PagarmeCardResponse>(
    `${PAGARME_CONFIG.endpoints.customers}/${customerId}${PAGARME_CONFIG.endpoints.cards}`,
    {
      method: "POST",
      body: JSON.stringify(cardData),
    }
  )

  console.log("Cartão criado:", response.id, `**** **** **** ${response.last_four_digits}`)
  return response
}

/**
 * Cria uma assinatura na Pagar.me
 */
async function createPagarmeSubscription(
  customerId: string,
  cardId: string
): Promise<PagarmeSubscriptionResponse> {
  const subscriptionData = {
    plan_id: PAGARME_CONFIG.subscription.planId,
    customer_id: customerId,
    card_id: cardId,
    payment_method: "credit_card",
    billing_type: "prepaid",
    // Trial de 30 dias
    start_at: new Date(Date.now() + PAGARME_CONFIG.subscription.trialDays * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      source: "petloo-checkout",
      trial_days: PAGARME_CONFIG.subscription.trialDays.toString(),
    },
  }

  console.log("=== CRIANDO ASSINATURA NA PAGAR.ME ===")
  console.log("Plan ID:", PAGARME_CONFIG.subscription.planId)
  console.log("Trial Days:", PAGARME_CONFIG.subscription.trialDays)

  const response = await pagarmeRequest<PagarmeSubscriptionResponse>(
    PAGARME_CONFIG.endpoints.subscriptions,
    {
      method: "POST",
      body: JSON.stringify(subscriptionData),
    }
  )

  console.log("Assinatura criada:", response.id, "Status:", response.status)
  return response
}

/**
 * Cria um pedido com pagamento por cartão de crédito
 */
async function createCreditCardOrder(
  body: PaymentRequestBody,
  customerId: string,
  cardId: string
): Promise<PagarmeOrderResponse> {
  const document = formatDocumentForPagarme(body.customer.cpf)
  const phone = formatPhoneForPagarme(body.customer.phone)
  const address = formatAddressForPagarme({
    street: body.shipping.street,
    number: body.shipping.number,
    complement: body.shipping.complement,
    neighborhood: body.shipping.neighborhood,
    city: body.shipping.city,
    state: body.shipping.state,
    cep: body.shipping.cep,
  })

  const orderData = {
    customer_id: customerId,
    items: body.items.map((item) => ({
      amount: item.price,
      description: item.name,
      quantity: item.quantity,
      code: item.sku,
    })),
    payments: [
      {
        payment_method: "credit_card",
        credit_card: {
          card_id: cardId,
          installments: 1,
          statement_descriptor: "PETLOO",
        },
        amount: body.amount,
      },
    ],
    shipping: {
      amount: 0,
      description: "Frete incluso",
      address,
    },
    metadata: {
      pet_name: body.petName || "",
      source: "petloo-checkout",
    },
  }

  console.log("=== CRIANDO PEDIDO CARTÃO NA PAGAR.ME ===")

  const response = await pagarmeRequest<PagarmeOrderResponse>(
    PAGARME_CONFIG.endpoints.orders,
    {
      method: "POST",
      body: JSON.stringify(orderData),
    }
  )

  console.log("Pedido criado:", response.id, "Status:", response.status)
  return response
}

/**
 * Cria um pedido com pagamento por PIX
 */
async function createPixOrder(body: PaymentRequestBody): Promise<PagarmeOrderResponse> {
  const document = formatDocumentForPagarme(body.customer.cpf)
  const phone = formatPhoneForPagarme(body.customer.phone)
  const { name, last_name } = formatNameForPagarme(body.customer.name)
  const address = formatAddressForPagarme({
    street: body.shipping.street,
    number: body.shipping.number,
    complement: body.shipping.complement,
    neighborhood: body.shipping.neighborhood,
    city: body.shipping.city,
    state: body.shipping.state,
    cep: body.shipping.cep,
  })

  const orderData = {
    customer: {
      name: `${name} ${last_name}`,
      email: body.customer.email,
      document: document.number,
      document_type: document.type,
      type: "individual",
      phones: {
        mobile_phone: phone,
      },
      address,
    },
    items: body.items.map((item) => ({
      amount: item.price,
      description: item.name,
      quantity: item.quantity,
      code: item.sku,
    })),
    payments: [
      {
        payment_method: "pix",
        pix: {
          expires_in: PAGARME_CONFIG.pix.expirationInSeconds,
          additional_information: PAGARME_CONFIG.pix.additionalInformation,
        },
        amount: body.amount,
      },
    ],
    shipping: {
      amount: 0,
      description: "Frete incluso",
      address,
    },
    metadata: {
      pet_name: body.petName || "",
      source: "petloo-checkout",
    },
  }

  console.log("=== CRIANDO PEDIDO PIX NA PAGAR.ME ===")

  const response = await pagarmeRequest<PagarmeOrderResponse>(
    PAGARME_CONFIG.endpoints.orders,
    {
      method: "POST",
      body: JSON.stringify(orderData),
    }
  )

  console.log("Pedido PIX criado:", response.id, "Status:", response.status)
  return response
}

// ============================================
// SALVAR NO SUPABASE
// ============================================

async function saveOrderToSupabase(
  body: PaymentRequestBody,
  orderId: string,
  customerId: string,
  orderStatus: "pending" | "paid",
  pixCode?: string
) {
  const orderData = {
    order_id: orderId,
    customer_id: customerId,
    customer_name: body.customer.name,
    customer_email: body.customer.email,
    customer_phone: body.customer.phone,
    customer_cpf: body.customer.cpf,
    customer_address: `${body.shipping.street}, ${body.shipping.number}${body.shipping.complement ? `, ${body.shipping.complement}` : ""}, ${body.shipping.neighborhood}`,
    customer_cep: body.shipping.cep,
    customer_city: body.shipping.city,
    customer_state: body.shipping.state,
    order_amount: body.amount,
    payment_method: body.paymentMethod,
    order_status: orderStatus,
    product_type: body.items[0]?.name || "Tag Petloo",
    product_color: body.items[0]?.sku?.split("-")[1] || "",
    product_quantity: body.items.reduce((acc, item) => acc + item.quantity, 0),
    product_sku: body.items[0]?.sku || "",
    pet_name: body.petName || null,
    pix_code: pixCode || null,
  }

  console.log("=== SALVANDO NO SUPABASE ===")
  console.log("Dados:", JSON.stringify(orderData, null, 2))

  const { data, error } = await supabase.from("orders").insert([orderData]).select()

  if (error) {
    console.error("Erro ao salvar no Supabase:", error)
    throw new Error(`Erro ao salvar pedido: ${error.message}`)
  }

  console.log("Pedido salvo no Supabase:", data)
  return data
}

// ============================================
// ENVIAR PARA WEBHOOKS (MAKE.COM)
// ============================================

async function sendToWebhooks(
  body: PaymentRequestBody,
  orderId: string,
  customerId: string,
  subscriptionId?: string,
  pixData?: {
    qrCode?: string
    copiaECola?: string
    expirationDate?: string
  }
) {
  const orderDataForSheets = {
    order_id: orderId,
    customer_id: customerId,
    customer_name: body.customer.name,
    customer_email: body.customer.email,
    customer_phone: body.customer.phone,
    customer_cpf: body.customer.cpf,
    customer_address: body.shipping.street,
    customer_number: body.shipping.number,
    customer_complement: body.shipping.complement || "",
    customer_neighborhood: body.shipping.neighborhood,
    customer_cep: body.shipping.cep,
    customer_city: body.shipping.city,
    customer_state: body.shipping.state,
    order_amount: body.amount / 100,
    payment_method: body.paymentMethod === "credit_card" ? "Cartão de Crédito" : "PIX",
    order_status: body.paymentMethod === "credit_card" ? "Confirmado" : "Aguardando Pagamento",
    product_type: body.items[0]?.name || "Tag Petloo",
    product_color: body.items[0]?.sku?.split("-")[1] || "",
    product_quantity: body.items.reduce((acc, item) => acc + item.quantity, 0),
    product_sku: body.items[0]?.sku || "",
    pet_name: body.petName || "",
    subscription_id: subscriptionId || null,
    has_subscription: body.paymentMethod === "credit_card",
    pix_code: pixData?.copiaECola || null,
    pix_qr_code: pixData?.qrCode || null,
    pix_expiration_date: pixData?.expirationDate || null,
    gateway: "pagarme",
    created_at: new Date().toISOString(),
  }

  console.log("=== ENVIANDO PARA WEBHOOKS ===")

  // Webhook principal
  try {
    await fetch("https://hook.us2.make.com/qkwwr3qvpgkkobinbd28lzsq0k51tt6k", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderDataForSheets),
    })
    console.log("Enviado para webhook principal")
  } catch (error) {
    console.warn("Erro ao enviar para webhook principal:", error)
  }

  // Webhook secundário (PIX)
  if (body.paymentMethod === "pix") {
    try {
      await fetch("https://hook.us2.make.com/uurnp4dlhggj07fwxhbuiqxbpms8c5k1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderDataForSheets),
      })
      console.log("Enviado para webhook PIX")
    } catch (error) {
      console.warn("Erro ao enviar para webhook PIX:", error)
    }
  }
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

export async function POST(request: NextRequest) {
  try {
    console.log("=== INICIANDO PAYMENT API (PAGAR.ME) ===")

    const body: PaymentRequestBody = await request.json()
    console.log("Payload recebido:", JSON.stringify(body, null, 2))

    // Validar payload
    const validationError = validatePayload(body)
    if (validationError) {
      console.error("Erro de validação:", validationError)
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // ============================================
    // FLUXO PIX
    // ============================================
    if (body.paymentMethod === "pix") {
      console.log("=== FLUXO PIX ===")

      // 1. Criar pedido PIX
      const order = await createPixOrder(body)
      
      // Extrair dados do PIX
      const pixCharge = order.charges?.[0]
      const pixTransaction = pixCharge?.last_transaction
      const pixQrCode = pixTransaction?.qr_code
      const pixQrCodeUrl = pixTransaction?.qr_code_url
      const pixExpiresAt = pixTransaction?.expires_at

      if (!pixQrCode) {
        throw new Error("Falha ao gerar QR Code do PIX")
      }

      // 2. Salvar no Supabase
      await saveOrderToSupabase(body, order.id, "", "pending", pixQrCode)

      // 3. Enviar para webhooks
      await sendToWebhooks(body, order.id, "", undefined, {
        qrCode: pixQrCodeUrl,
        copiaECola: pixQrCode,
        expirationDate: pixExpiresAt,
      })

      console.log("=== PIX CONCLUÍDO COM SUCESSO ===")

      return NextResponse.json({
        success: true,
        orderId: order.id,
        paymentMethod: "pix",
        pix: {
          qrcode: pixQrCodeUrl,
          copiacola: pixQrCode,
          expiration_date: pixExpiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
        message: "PIX gerado com sucesso",
      })
    }

    // ============================================
    // FLUXO CARTÃO DE CRÉDITO
    // ============================================
    console.log("=== FLUXO CARTÃO DE CRÉDITO ===")

    // REGRA DE NEGÓCIO CRÍTICA: Criar assinatura é OBRIGATÓRIO para cartão

    // 1. Criar Customer na Pagar.me
    const customer = await createPagarmeCustomer(body.customer, body.shipping)

    // 2. Criar Cartão no Customer
    const card = await createPagarmeCard(customer.id, body.card!, body.shipping)

    // 3. Criar Assinatura (OBRIGATÓRIO)
    let subscription: PagarmeSubscriptionResponse
    try {
      subscription = await createPagarmeSubscription(customer.id, card.id)
    } catch (error) {
      console.error("Erro ao criar assinatura:", error)
      throw new Error("Falha ao criar assinatura. Pagamento cancelado.")
    }

    // 4. Criar Pedido com pagamento
    const order = await createCreditCardOrder(body, customer.id, card.id)

    // Verificar status do pagamento
    const chargeStatus = order.charges?.[0]?.status
    if (chargeStatus !== "paid" && chargeStatus !== "pending") {
      console.error("Pagamento não aprovado. Status:", chargeStatus)
      return NextResponse.json(
        {
          error: "Pagamento não aprovado",
          status: chargeStatus,
        },
        { status: 400 }
      )
    }

    // 5. Salvar no Supabase
    await saveOrderToSupabase(
      body,
      order.id,
      customer.id,
      chargeStatus === "paid" ? "paid" : "pending"
    )

    // 6. Enviar para webhooks
    await sendToWebhooks(body, order.id, customer.id, subscription.id)

    console.log("=== CHECKOUT CARTÃO CONCLUÍDO COM SUCESSO ===")

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentMethod: "credit_card",
      customerId: customer.id,
      cardId: card.id,
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      trialEndsAt: subscription.start_at,
      message: "Pagamento processado com sucesso! Assinatura do app iniciada com 30 dias grátis.",
    })
  } catch (error) {
    console.error("Erro na API de pagamento:", error)

    if (error instanceof PagarmeError) {
      return NextResponse.json(
        {
          error: "Erro no processamento do pagamento",
          details: error.message,
          errors: error.errors,
        },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
