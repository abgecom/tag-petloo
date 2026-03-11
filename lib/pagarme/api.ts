/**
 * Utilitários de API da Pagar.me
 * Funções para comunicação com a API Pagar.me v5
 */

import { PAGARME_CONFIG } from "./config"

/**
 * Opções para requisições à API Pagar.me
 */
interface PagarmeRequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>
}

/**
 * Resposta genérica da API Pagar.me
 */
interface PagarmeResponse<T = unknown> {
  data: T
  success: boolean
  errors?: Array<{
    message: string
    code: string
  }>
}

/**
 * Erro customizado para a API Pagar.me
 */
export class PagarmeError extends Error {
  public readonly statusCode: number
  public readonly errors: Array<{ message: string; code: string }>

  constructor(
    message: string,
    statusCode: number,
    errors: Array<{ message: string; code: string }> = []
  ) {
    super(message)
    this.name = "PagarmeError"
    this.statusCode = statusCode
    this.errors = errors
  }
}

/**
 * Gera o header de autenticação Basic Auth para a Pagar.me
 * @returns String de autenticação Basic Auth
 */
function getAuthHeader(): string {
  const apiKey = process.env.PAGARME_API_KEY

  if (!apiKey) {
    throw new PagarmeError(
      "PAGARME_API_KEY não está configurada nas variáveis de ambiente",
      500
    )
  }

  // Pagar.me usa Basic Auth com a API key como username e senha vazia
  const credentials = Buffer.from(`${apiKey}:`).toString("base64")
  return `Basic ${credentials}`
}

/**
 * Função principal para fazer requisições à API da Pagar.me
 *
 * @param endpoint - Endpoint da API (ex: '/orders', '/customers')
 * @param options - Opções da requisição (method, body, headers, etc)
 * @returns Promise com a resposta da API
 *
 * @example
 * ```ts
 * // Criar um cliente
 * const customer = await pagarmeRequest('/customers', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'João', email: 'joao@email.com' })
 * })
 *
 * // Buscar um pedido
 * const order = await pagarmeRequest('/orders/or_123456')
 * ```
 */
export async function pagarmeRequest<T = unknown>(
  endpoint: string,
  options: PagarmeRequestOptions = {}
): Promise<T> {
  const url = `${PAGARME_CONFIG.baseUrl}${endpoint}`

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: getAuthHeader(),
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)

    // Parse da resposta
    const data = await response.json()

    // Verificar se houve erro
    if (!response.ok) {
      const errorMessage =
        data.message || data.errors?.[0]?.message || "Erro na requisição à Pagar.me"
      throw new PagarmeError(errorMessage, response.status, data.errors || [])
    }

    return data as T
  } catch (error) {
    // Re-throw PagarmeError
    if (error instanceof PagarmeError) {
      throw error
    }

    // Erro de rede ou parsing
    throw new PagarmeError(
      error instanceof Error ? error.message : "Erro desconhecido ao comunicar com Pagar.me",
      500
    )
  }
}

// ============================================
// FUNÇÕES DE FORMATAÇÃO
// ============================================

/**
 * Formata telefone para o padrão esperado pela Pagar.me
 * A Pagar.me espera: { country_code, area_code, number }
 *
 * @param phone - Telefone em qualquer formato (ex: "(11) 99999-9999", "11999999999")
 * @returns Objeto com telefone formatado para Pagar.me
 *
 * @example
 * ```ts
 * formatPhoneForPagarme("(11) 99999-9999")
 * // Retorna: { country_code: "55", area_code: "11", number: "999999999" }
 * ```
 */
export function formatPhoneForPagarme(phone: string): {
  country_code: string
  area_code: string
  number: string
} {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, "")

  // Remove o código do país se presente (55)
  const phoneWithoutCountry = cleanPhone.startsWith("55")
    ? cleanPhone.slice(2)
    : cleanPhone

  // Extrai DDD (2 primeiros dígitos) e número
  const areaCode = phoneWithoutCountry.slice(0, 2)
  const number = phoneWithoutCountry.slice(2)

  return {
    country_code: "55",
    area_code: areaCode,
    number: number,
  }
}

/**
 * Formata CPF/CNPJ para o padrão esperado pela Pagar.me
 * A Pagar.me espera apenas números, sem pontuação
 *
 * @param document - CPF ou CNPJ com ou sem formatação
 * @returns Objeto com document e type para a Pagar.me
 *
 * @example
 * ```ts
 * formatDocumentForPagarme("123.456.789-00")
 * // Retorna: { type: "cpf", number: "12345678900" }
 *
 * formatDocumentForPagarme("12.345.678/0001-90")
 * // Retorna: { type: "cnpj", number: "12345678000190" }
 * ```
 */
export function formatDocumentForPagarme(document: string): {
  type: "cpf" | "cnpj"
  number: string
} {
  // Remove todos os caracteres não numéricos
  const cleanDocument = document.replace(/\D/g, "")

  // Determina o tipo baseado no tamanho
  const type = cleanDocument.length === 11 ? "cpf" : "cnpj"

  return {
    type,
    number: cleanDocument,
  }
}

/**
 * Formata CEP para o padrão esperado pela Pagar.me
 * A Pagar.me espera apenas números
 *
 * @param cep - CEP com ou sem formatação (ex: "01310-100", "01310100")
 * @returns CEP apenas com números
 *
 * @example
 * ```ts
 * formatCepForPagarme("01310-100")
 * // Retorna: "01310100"
 * ```
 */
export function formatCepForPagarme(cep: string): string {
  return cep.replace(/\D/g, "")
}

/**
 * Converte valor em reais para centavos (formato Pagar.me)
 * A Pagar.me espera valores em centavos (integer)
 *
 * @param valueInReais - Valor em reais (ex: 19.90)
 * @returns Valor em centavos (ex: 1990)
 *
 * @example
 * ```ts
 * formatAmountForPagarme(19.90)
 * // Retorna: 1990
 * ```
 */
export function formatAmountForPagarme(valueInReais: number): number {
  return Math.round(valueInReais * 100)
}

/**
 * Converte valor em centavos para reais
 *
 * @param valueInCents - Valor em centavos (ex: 1990)
 * @returns Valor em reais (ex: 19.90)
 *
 * @example
 * ```ts
 * formatAmountFromPagarme(1990)
 * // Retorna: 19.90
 * ```
 */
export function formatAmountFromPagarme(valueInCents: number): number {
  return valueInCents / 100
}

/**
 * Formata endereço para o padrão esperado pela Pagar.me
 *
 * @param address - Objeto com dados do endereço
 * @returns Objeto formatado para a Pagar.me
 */
export function formatAddressForPagarme(address: {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  cep: string
  country?: string
}) {
  return {
    line_1: `${address.number}, ${address.street}, ${address.neighborhood}`,
    line_2: address.complement || undefined,
    zip_code: formatCepForPagarme(address.cep),
    city: address.city,
    state: address.state,
    country: address.country || "BR",
  }
}

/**
 * Formata nome completo separando primeiro e último nome
 *
 * @param fullName - Nome completo
 * @returns Objeto com name (primeiro nome + nome do meio) e last_name
 */
export function formatNameForPagarme(fullName: string): {
  name: string
  last_name: string
} {
  const parts = fullName.trim().split(" ")
  const firstName = parts[0] || ""
  const lastName = parts.slice(1).join(" ") || firstName

  return {
    name: firstName,
    last_name: lastName,
  }
}

// ============================================
// TIPOS PARA A API PAGAR.ME
// ============================================

/**
 * Tipo de cliente da Pagar.me
 */
export interface PagarmeCustomer {
  id: string
  name: string
  email: string
  document: string
  document_type: "cpf" | "cnpj"
  type: "individual" | "company"
  phones?: {
    mobile_phone?: {
      country_code: string
      area_code: string
      number: string
    }
    home_phone?: {
      country_code: string
      area_code: string
      number: string
    }
  }
  address?: {
    line_1: string
    line_2?: string
    zip_code: string
    city: string
    state: string
    country: string
  }
  metadata?: Record<string, string>
  created_at: string
  updated_at: string
}

/**
 * Tipo de pedido da Pagar.me
 */
export interface PagarmeOrder {
  id: string
  code: string
  amount: number
  currency: string
  status: "pending" | "paid" | "canceled" | "failed"
  customer: PagarmeCustomer
  items: Array<{
    amount: number
    description: string
    quantity: number
    code?: string
  }>
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
    }
  }>
  metadata?: Record<string, string>
  created_at: string
  updated_at: string
}

/**
 * Tipo de assinatura da Pagar.me
 */
export interface PagarmeSubscription {
  id: string
  code: string
  status: "active" | "canceled" | "pending" | "failed"
  start_at: string
  next_billing_at: string
  billing_day: number
  interval: "day" | "week" | "month" | "year"
  interval_count: number
  plan: {
    id: string
    name: string
  }
  customer: PagarmeCustomer
  metadata?: Record<string, string>
  created_at: string
  updated_at: string
}

// ============================================
// EXPORTS
// ============================================

export type { PagarmeRequestOptions, PagarmeResponse }
