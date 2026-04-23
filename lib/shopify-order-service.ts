/**
 * Shopify Order Service - Petloo
 * Servico para exportacao de pedidos para a Shopify
 * Baseado na estrutura do projeto Looneca, adaptado para Tag Petloo
 */

// ============================================
// CONFIGURACAO
// ============================================

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || ""
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || ""
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-01"

// Produto fixo - Tag Rastreamento Petloo
const PETLOO_PRODUCT = {
  product_id: 9992610513218,
  variant_id: 52272812097858,
  sku: "TAG-RASTREAMENTO-PETLOO",
  title: "Tag Rastreamento Petloo + App",
}

// ============================================
// TIPOS
// ============================================

export interface CheckoutInput {
  customer: {
    name: string
    email: string
    phone: string
    cpf: string
  }
  shipping: {
    cep: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    method?: string
    price?: number
  }
  items: Array<{
    quantity: number
    price: number
    type?: string
    color?: string
    petName?: string
  }>
  paymentMethod: "credit_card" | "pix"
  totalAmount: number
  paymentId: string
  paymentStatus: string
  petName?: string
  hasSubscription?: boolean
  hasLooapp?: boolean
  hasPersonalizationUpgrade?: boolean
  extraTagBump?: boolean
}

interface ShopifyCustomer {
  id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
}

interface ShopifyOrderResponse {
  order: {
    id: number
    name: string
    order_number: number
    created_at: string
    financial_status: string
    fulfillment_status: string | null
  }
}

// ============================================
// FUNCOES AUXILIARES
// ============================================

/**
 * Sleep para rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Separa nome completo em primeiro e ultimo nome
 */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(" ")
  const firstName = parts[0] || ""
  const lastName = parts.slice(1).join(" ") || firstName
  return { firstName, lastName }
}

/**
 * Formata telefone para padrao internacional
 */
function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "")
  if (clean.startsWith("55")) return `+${clean}`
  return `+55${clean}`
}

/**
 * Formata CEP
 */
function formatCep(cep: string): string {
  const clean = cep.replace(/\D/g, "")
  return clean.length === 8 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : clean
}

/**
 * Obtem codigo do estado
 */
function getProvinceCode(state: string): string {
  const stateMap: Record<string, string> = {
    AC: "AC", AL: "AL", AP: "AP", AM: "AM", BA: "BA", CE: "CE",
    DF: "DF", ES: "ES", GO: "GO", MA: "MA", MT: "MT", MS: "MS",
    MG: "MG", PA: "PA", PB: "PB", PR: "PR", PE: "PE", PI: "PI",
    RJ: "RJ", RN: "RN", RS: "RS", RO: "RO", RR: "RR", SC: "SC",
    SP: "SP", SE: "SE", TO: "TO",
  }
  return stateMap[state.toUpperCase()] || state.toUpperCase()
}

// ============================================
// FUNCOES DA API SHOPIFY
// ============================================

/**
 * Funcao generica para chamadas a API Shopify
 */
async function shopifyFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error("Configuracao Shopify incompleta")
  }

  // Garantir que a URL tenha o protocolo https://
  const baseUrl = SHOPIFY_STORE_URL.startsWith("http") 
    ? SHOPIFY_STORE_URL 
    : `https://${SHOPIFY_STORE_URL}`
  const url = `${baseUrl}/admin/api/${SHOPIFY_API_VERSION}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    console.error("Erro Shopify API:", data)
    throw new Error(data.errors?.base?.[0] || `Erro Shopify: ${response.status}`)
  }

  return data as T
}

/**
 * Busca cliente por email ou cria um novo
 */
async function findOrCreateCustomer(
  email: string,
  firstName: string,
  lastName: string,
  phone?: string
): Promise<ShopifyCustomer> {
  // Buscar cliente existente
  const searchResult = await shopifyFetch<{ customers: ShopifyCustomer[] }>(
    `/customers/search.json?query=email:${encodeURIComponent(email)}`
  )

  if (searchResult.customers && searchResult.customers.length > 0) {
    return searchResult.customers[0]
  }

  // Rate limiting
  await sleep(550)

  // Criar novo cliente
  const createResult = await shopifyFetch<{ customer: ShopifyCustomer }>(
    "/customers.json",
    {
      method: "POST",
      body: JSON.stringify({
        customer: {
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          verified_email: true,
          send_email_welcome: false,
        },
      }),
    }
  )

  return createResult.customer
}

/**
 * Salva CPF como metafield do cliente
 */
async function setCustomerCPF(customerId: number, cpf: string): Promise<void> {
  try {
    await shopifyFetch(`/customers/${customerId}/metafields.json`, {
      method: "POST",
      body: JSON.stringify({
        metafield: {
          namespace: "custom",
          key: "cpf",
          value: cpf,
          type: "single_line_text_field",
        },
      }),
    })
  } catch (error) {
    console.error("Erro ao salvar CPF como metafield:", error)
    // Nao bloqueia o fluxo
  }
}

/**
 * Monta o payload do pedido para Shopify
 */
function buildOrderPayload(
  input: CheckoutInput,
  customerId: number
): Record<string, unknown> {
  const { firstName, lastName } = splitName(input.customer.name)

  // Montar line_items com variant_id fixo
  const lineItems = input.items.map((item) => {
    const properties: Array<{ name: string; value: string }> = []

    // Tipo do produto
    properties.push({
      name: "Tipo",
      value: item.type || "Tag Rastreamento",
    })

    // Cor da tag
    if (item.color) {
      properties.push({
        name: "Cor",
        value: item.color,
      })
    }

    // Nome do pet (usa o do item ou o geral)
    const petName = item.petName || input.petName
    if (petName) {
      properties.push({
        name: "Nome do Pet",
        value: petName,
      })
    }

    // Quantidade
    properties.push({
      name: "Quantidade",
      value: item.quantity.toString(),
    })

    return {
      variant_id: PETLOO_PRODUCT.variant_id,
      quantity: item.quantity,
      price: (item.price / 100).toFixed(2),
      properties: properties,
    }
  })

  // Endereco de entrega
  const shippingAddress = {
    first_name: firstName,
    last_name: lastName,
    address1: `${input.shipping.street}, ${input.shipping.number}`,
    address2: input.shipping.complement || "",
    city: input.shipping.city,
    province: input.shipping.state,
    province_code: getProvinceCode(input.shipping.state),
    country: "Brazil",
    country_code: "BR",
    zip: formatCep(input.shipping.cep),
    phone: formatPhone(input.customer.phone),
  }

  // Note attributes
  const noteAttributes = [
    { name: "CPF", value: input.customer.cpf },
    { name: "ID Pagamento", value: input.paymentId },
    { name: "Metodo Pagamento", value: input.paymentMethod === "credit_card" ? "Cartao de Credito" : "PIX" },
    { name: "App Petloo", value: input.hasSubscription ? "Sim" : "Nao" },
  ]

  if (input.petName) {
    noteAttributes.push({ name: "Nome do Pet", value: input.petName })
  }
  if (input.hasLooapp) {
    noteAttributes.push({ name: "Looapp Completo", value: "Sim" })
  }
  if (input.hasPersonalizationUpgrade) {
    noteAttributes.push({ name: "Upgrade Personalização", value: "Sim" })
  }
  if (input.extraTagBump) {
    noteAttributes.push({ name: "Tag Extra (bump)", value: "Sim" })
  }

  // Tags do pedido
  const tags = [
    "petloo",
    "tag-rastreamento",
    "importado",
    input.paymentMethod === "credit_card" ? "cartao" : "pix",
  ]

  if (input.petName) {
    tags.push("personalizado")
  }

  // Financial status baseado no metodo de pagamento
  const financialStatus = input.paymentMethod === "credit_card" ? "paid" : "pending"

  // Shipping lines (frete)
  const shippingLines = []
  if (input.shipping.price && input.shipping.price > 0) {
    shippingLines.push({
      title: input.shipping.method || "Frete Expresso",
      price: (input.shipping.price / 100).toFixed(2),
      code: "FRETE",
    })
  }

  return {
    order: {
      customer: { id: customerId },
      line_items: lineItems,
      billing_address: shippingAddress,
      shipping_address: shippingAddress,
      shipping_lines: shippingLines,
      financial_status: financialStatus,
      fulfillment_status: null,
      send_receipt: true,
      send_fulfillment_receipt: true,
      note: `Pedido importado do Petloo - ID: ${input.paymentId}`,
      note_attributes: noteAttributes,
      tags: tags.join(", "),
      total_tax: "0.00",
      taxes_included: true,
    },
  }
}

// ============================================
// FUNCAO PRINCIPAL
// ============================================

/**
 * Exporta um pedido para a Shopify
 *
 * @param input - Dados do checkout
 * @returns Promise com os dados do pedido criado
 */
export async function exportShopifyOrder(
  input: CheckoutInput
): Promise<ShopifyOrderResponse> {
  console.log("Iniciando exportacao para Shopify...")

  // 1. Buscar ou criar cliente
  const { firstName, lastName } = splitName(input.customer.name)
  const customer = await findOrCreateCustomer(
    input.customer.email,
    firstName,
    lastName,
    formatPhone(input.customer.phone)
  )

  console.log("Cliente Shopify:", customer.id)

  // Rate limiting
  await sleep(550)

  // 2. Salvar CPF como metafield
  await setCustomerCPF(customer.id, input.customer.cpf)

  // Rate limiting
  await sleep(550)

  // 3. Montar e criar pedido
  const orderPayload = buildOrderPayload(input, customer.id)

  const result = await shopifyFetch<ShopifyOrderResponse>("/orders.json", {
    method: "POST",
    body: JSON.stringify(orderPayload),
  })

  console.log("Pedido Shopify criado:", result.order.name)

  return result
}

/**
 * Verifica se Shopify esta configurado
 */
export function isShopifyConfigured(): boolean {
  return Boolean(SHOPIFY_STORE_URL && SHOPIFY_ACCESS_TOKEN)
}

/**
 * Atualiza o financial_status de um pedido já existente na Shopify.
 *
 * Uso: quando o webhook da Pagar.me confirma o pagamento de um PIX,
 * chamamos essa função para mudar o pedido Shopify de "pending" para "paid".
 * Quando a Shopify muda para "paid", ela dispara automaticamente o email
 * de confirmação para o cliente.
 *
 * @param shopifyOrderId - ID numérico do pedido na Shopify (string para evitar perda de precisão em JS)
 * @param financialStatus - "paid", "pending", "refunded", "voided"
 */
export async function updateShopifyOrderFinancialStatus(
  shopifyOrderId: string,
  financialStatus: "paid" | "pending" | "refunded" | "voided"
): Promise<{ success: boolean; orderId: string; status: string }> {
  console.log(
    `[Shopify Service] Atualizando pedido ${shopifyOrderId} para financial_status=${financialStatus}`
  )

  const result = await shopifyFetch<{ order: { id: number; financial_status: string } }>(
    `/orders/${shopifyOrderId}.json`,
    {
      method: "PUT",
      body: JSON.stringify({
        order: {
          id: Number(shopifyOrderId),
          financial_status: financialStatus,
        },
      }),
    }
  )

  console.log(
    `[Shopify Service] ✅ Pedido ${shopifyOrderId} atualizado. Novo status: ${result.order.financial_status}`
  )

  return {
    success: true,
    orderId: String(result.order.id),
    status: result.order.financial_status,
  }
}
