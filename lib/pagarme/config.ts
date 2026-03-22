/**
 * Configurações da Pagar.me
 * Gateway de pagamento para processamento de transações
 */

export const PAGARME_CONFIG = {
  /**
   * URL base da API Pagar.me v5
   */
  baseUrl: "https://api.pagar.me/core/v5",

  /**
   * Endpoints da API
   */
  endpoints: {
    orders: "/orders",
    customers: "/customers",
    cards: "/cards",
    subscriptions: "/subscriptions",
    charges: "/charges",
    recipients: "/recipients",
    plans: "/plans",
  },

  /**
   * Configuração de assinatura do App Petloo
   * Plan ID fixo para assinatura mensal
   */
  subscription: {
    /**
     * ID do plano de assinatura na Pagar.me
     * Mesmo plano utilizado no projeto Looneca
     */
    planId: "plan_L7MjQlXiNpSyaGA9",

    /**
     * Período de trial em dias
     */
    trialDays: 30,

    /**
     * Ciclo de cobrança (mensal)
     */
    interval: "month",

    /**
     * Número de ciclos (0 = infinito)
     */
    intervalCount: 1,

    /**
     * Moeda
     */
    currency: "BRL",

    /**
     * Valor mensal da assinatura em centavos (R$ 30,90)
     * Cobrado após o trial de 30 dias
     */
    monthlyPrice: 3090,

    /**
     * Descrição que aparece na fatura do cartão do cliente
     */
    statementDescriptor: "LOOAPP",
  },

  /**
   * Configurações de timeout e retry
   */
  requestOptions: {
    timeout: 30000, // 30 segundos
    retries: 3,
  },

  /**
   * Configurações de PIX
   */
  pix: {
    /**
     * Tempo de expiração do PIX em segundos (30 minutos)
     */
    expirationInSeconds: 1800,

    /**
     * Instruções para o pagador
     */
    additionalInformation: [
      {
        name: "Petloo",
        value: "Tag de rastreamento + App",
      },
    ],
  },
} as const

/**
 * Tipo para as configurações
 */
export type PagarmeConfig = typeof PAGARME_CONFIG
