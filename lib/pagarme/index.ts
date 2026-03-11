/**
 * Módulo Pagar.me
 * Exporta todas as funções e configurações do gateway de pagamento Pagar.me
 */

// Configurações
export { PAGARME_CONFIG } from "./config"
export type { PagarmeConfig } from "./config"

// API e funções de requisição
export {
  pagarmeRequest,
  PagarmeError,
} from "./api"

// Funções de formatação
export {
  formatPhoneForPagarme,
  formatDocumentForPagarme,
  formatCepForPagarme,
  formatAmountForPagarme,
  formatAmountFromPagarme,
  formatAddressForPagarme,
  formatNameForPagarme,
} from "./api"

// Tipos
export type {
  PagarmeCustomer,
  PagarmeOrder,
  PagarmeSubscription,
  PagarmeRequestOptions,
  PagarmeResponse,
} from "./api"
