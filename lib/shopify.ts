/**
 * Integração com Shopify
 * Funções para exportar pedidos do Petloo para a Shopify
 */

// ============================================
// CONFIGURAÇÃO
// ============================================

const SHOPIFY_CONFIG = {
  /**
   * URL da loja Shopify
   * Formato: https://{store-name}.myshopify.com
   */
  storeUrl: process.env.SHOPIFY_STORE_URL || "",

  /**
   * Token de acesso da API Admin
   * Gerado em Apps > Develop apps > Admin API access token
   */
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN || "",

  /**
   * Versão da API Shopify
   */
  apiVersion: "2024-01",
}

// ============================================
// TIPOS
// ============================================

/**
 * Dados do cliente para o pedido Shopify
 */
interface ShopifyCustomer {
  first_name: string
  last_name: string
  email: string
  phone?: string
}

/**
 * Endereço para o pedido Shopify
 */
interface ShopifyAddress {
  first_name: string
  last_name: string
  address1: string
  address2?: string
  city: string
  province: string
  province_code: string
  country: string
  country_code: string
  zip: string
  phone?: string
}

/**
 * Item do pedido Shopify
 */
interface ShopifyLineItem {
  title: string
  quantity: number
  price: string
  sku?: string
  variant_id?: number
  requires_shipping?: boolean
  taxable?: boolean
  properties?: Array<{
    name: string
    value: string
  }>
}

/**
 * Dados do pedido para exportação
 */
export interface OrderDataForShopify {
  // Dados do cliente
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_cpf: string

  // Endereço
  address_street: string
  address_number: string
  address_complement?: string
  address_neighborhood: string
  address_city: string
  address_state: string
  address_cep: string

  // Pedido
  order_id: string
  order_amount: number // Em centavos
  payment_method: "credit_card" | "pix"
  payment_status: "paid" | "pending"

  // Produto
  product_type: string
  product_color: string
  product_quantity: number
  product_sku: string
  pet_name?: string

  // Metadados opcionais
  subscription_id?: string
  notes?: string
}

/**
 * Resposta da API Shopify para criação de pedido
 */
interface ShopifyOrderResponse {
  order: {
    id: number
    admin_graphql_api_id: string
    name: string
    order_number: number
    created_at: string
    confirmed: boolean
    financial_status: string
    fulfillment_status: string | null
    total_price: string
  }
}

/**
 * Erro da API Shopify
 */
export class ShopifyError extends Error {
  public readonly statusCode: number
  public readonly errors: unknown

  constructor(message: string, statusCode: number, errors?: unknown) {
    super(message)
    this.name = "ShopifyError"
    this.statusCode = statusCode
    this.errors = errors
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Obtém o código do estado brasileiro para o Shopify
 */
function getProvinceCode(state: string): string {
  const stateMap: Record<string, string> = {
    AC: "AC",
    AL: "AL",
    AP: "AP",
    AM: "AM",
    BA: "BA",
    CE: "CE",
    DF: "DF",
    ES: "ES",
    GO: "GO",
    MA: "MA",
    MT: "MT",
    MS: "MS",
    MG: "MG",
    PA: "PA",
    PB: "PB",
    PR: "PR",
    PE: "PE",
    PI: "PI",
    RJ: "RJ",
    RN: "RN",
    RS: "RS",
    RO: "RO",
    RR: "RR",
    SC: "SC",
    SP: "SP",
    SE: "SE",
    TO: "TO",
  }

  const upperState = state.toUpperCase().trim()
  return stateMap[upperState] || upperState
}

/**
 * Formata nome completo em primeiro e último nome
 */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(" ")
  const firstName = parts[0] || ""
  const lastName = parts.slice(1).join(" ") || firstName

  return { firstName, lastName }
}

/**
 * Formata telefone para o padrão internacional
 */
function formatPhoneForShopify(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "")

  // Adiciona código do país se não tiver
  if (cleanPhone.startsWith("55")) {
    return `+${cleanPhone}`
  }

  return `+55${cleanPhone}`
}

/**
 * Formata CEP para o padrão brasileiro
 */
function formatCepForShopify(cep: string): string {
  const cleanCep = cep.replace(/\D/g, "")
  return cleanCep.length === 8
    ? `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`
    : cleanCep
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

/**
 * Exporta um pedido para a Shopify
 *
 * Cria um pedido na loja Shopify com os dados do cliente e itens da compra.
 * Utiliza a API REST do Shopify Admin.
 *
 * @param orderData - Dados do pedido a ser exportado
 * @returns Promise com os dados do pedido criado na Shopify
 *
 * @example
 * ```ts
 * const shopifyOrder = await exportOrderToShopify({
 *   customer_name: "João Silva",
 *   customer_email: "joao@email.com",
 *   customer_phone: "11999999999",
 *   customer_cpf: "12345678900",
 *   address_street: "Rua das Flores",
 *   address_number: "123",
 *   address_neighborhood: "Centro",
 *   address_city: "São Paulo",
 *   address_state: "SP",
 *   address_cep: "01310100",
 *   order_id: "ord_123",
 *   order_amount: 4990, // R$ 49,90 em centavos
 *   payment_method: "credit_card",
 *   payment_status: "paid",
 *   product_type: "Tag Petloo",
 *   product_color: "Azul",
 *   product_quantity: 1,
 *   product_sku: "TAG-AZUL-001",
 *   pet_name: "Rex"
 * })
 * ```
 */
export async function exportOrderToShopify(
  orderData: OrderDataForShopify
): Promise<ShopifyOrderResponse> {
  // Validar configuração
  if (!SHOPIFY_CONFIG.storeUrl || !SHOPIFY_CONFIG.accessToken) {
    throw new ShopifyError(
      "Configuração do Shopify incompleta. Verifique SHOPIFY_STORE_URL e SHOPIFY_ACCESS_TOKEN.",
      500
    )
  }

  // Preparar dados do cliente
  const { firstName, lastName } = splitName(orderData.customer_name)

  const customer: ShopifyCustomer = {
    first_name: firstName,
    last_name: lastName,
    email: orderData.customer_email,
    phone: formatPhoneForShopify(orderData.customer_phone),
  }

  // Preparar endereço de entrega
  const shippingAddress: ShopifyAddress = {
    first_name: firstName,
    last_name: lastName,
    address1: `${orderData.address_street}, ${orderData.address_number}`,
    address2: orderData.address_complement || undefined,
    city: orderData.address_city,
    province: orderData.address_state,
    province_code: getProvinceCode(orderData.address_state),
    country: "Brazil",
    country_code: "BR",
    zip: formatCepForShopify(orderData.address_cep),
    phone: formatPhoneForShopify(orderData.customer_phone),
  }

  // Preparar itens do pedido
  const lineItems: ShopifyLineItem[] = [
    {
      title: orderData.product_type || "Tag Petloo + App",
      quantity: orderData.product_quantity,
      price: (orderData.order_amount / 100 / orderData.product_quantity).toFixed(2),
      sku: orderData.product_sku,
      requires_shipping: true,
      taxable: false,
      properties: [
        {
          name: "Cor",
          value: orderData.product_color,
        },
        ...(orderData.pet_name
          ? [
              {
                name: "Nome do Pet",
                value: orderData.pet_name,
              },
            ]
          : []),
      ],
    },
  ]

  // Montar payload do pedido
  const orderPayload = {
    order: {
      line_items: lineItems,
      customer: customer,
      billing_address: shippingAddress,
      shipping_address: shippingAddress,
      financial_status: orderData.payment_status === "paid" ? "paid" : "pending",
      fulfillment_status: null,
      send_receipt: true,
      send_fulfillment_receipt: true,
      note: orderData.notes || `Pedido importado do Petloo - ID: ${orderData.order_id}`,
      note_attributes: [
        {
          name: "petloo_order_id",
          value: orderData.order_id,
        },
        {
          name: "cpf",
          value: orderData.customer_cpf,
        },
        {
          name: "payment_method",
          value: orderData.payment_method,
        },
        ...(orderData.subscription_id
          ? [
              {
                name: "subscription_id",
                value: orderData.subscription_id,
              },
            ]
          : []),
        ...(orderData.pet_name
          ? [
              {
                name: "pet_name",
                value: orderData.pet_name,
              },
            ]
          : []),
      ],
      tags: [
        "petloo",
        orderData.payment_method,
        orderData.product_color.toLowerCase(),
        ...(orderData.pet_name ? ["personalizado"] : []),
      ].join(", "),
      // Taxas e frete (já inclusos no valor total)
      total_tax: "0.00",
      taxes_included: true,
    },
  }

  // Fazer requisição para a API Shopify
  const url = `${SHOPIFY_CONFIG.storeUrl}/admin/api/${SHOPIFY_CONFIG.apiVersion}/orders.json`

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_CONFIG.accessToken,
      },
      body: JSON.stringify(orderPayload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("❌ Erro ao criar pedido no Shopify:", data)
      throw new ShopifyError(
        data.errors?.base?.[0] || "Erro ao criar pedido no Shopify",
        response.status,
        data.errors
      )
    }

    console.log("✅ Pedido criado no Shopify:", data.order?.id)
    return data as ShopifyOrderResponse
  } catch (error) {
    if (error instanceof ShopifyError) {
      throw error
    }

    throw new ShopifyError(
      error instanceof Error ? error.message : "Erro desconhecido ao comunicar com Shopify",
      500
    )
  }
}

/**
 * Verifica se a configuração do Shopify está completa
 */
export function isShopifyConfigured(): boolean {
  return Boolean(SHOPIFY_CONFIG.storeUrl && SHOPIFY_CONFIG.accessToken)
}
