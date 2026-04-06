// Tabela de taxas de juros por numero de parcelas
// 1-3x: sem juros | 4x+: com juros
export const INTEREST_RATES: Record<number, number> = {
  1: 0.0,
  2: 0.0,
  3: 0.0,
  4: 0.1109,
  5: 0.1234,
  6: 0.1359,
  7: 0.1534,
  8: 0.1659,
  9: 0.1784,
  10: 0.1909,
  11: 0.2034,
  12: 0.2159,
}

export interface PaymentCalculation {
  originalAmount: number
  finalAmount: number
  interestAmount: number
  rate: number
  installmentAmount: number
}

export function calculatePaymentAmount(
  originalAmount: number,
  paymentMethod: "credit_card" | "pix",
  installments = 1
): PaymentCalculation {
  // PIX ou pagamento a vista: sem juros
  if (paymentMethod === "pix" || installments <= 1) {
    return {
      originalAmount,
      finalAmount: originalAmount,
      interestAmount: 0,
      rate: 0,
      installmentAmount: originalAmount,
    }
  }

  const rate = INTEREST_RATES[installments] || 0
  const finalAmount = originalAmount * (1 + rate)
  const interestAmount = finalAmount - originalAmount
  const installmentAmount = finalAmount / installments

  return {
    originalAmount,
    finalAmount: Math.round(finalAmount * 100) / 100,
    interestAmount: Math.round(interestAmount * 100) / 100,
    rate: rate * 100,
    installmentAmount: Math.round(installmentAmount * 100) / 100,
  }
}

export function formatCurrency(value: number): string {
  return value.toFixed(2).replace(".", ",")
}
