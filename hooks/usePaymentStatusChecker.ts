"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface PaymentStatus {
  success: boolean
  order_id: string
  status: string
  payment_status: string
  is_paid: boolean
  amount: number
  message: string
}

interface UsePaymentStatusCheckerProps {
  orderId: string
  enabled?: boolean
  intervalSeconds?: number
  maxAttempts?: number
  onPaymentConfirmed?: (data: PaymentStatus) => void
}

export function usePaymentStatusChecker({
  orderId,
  enabled = true,
  intervalSeconds = 15,
  maxAttempts = 120, // 30 minutos (120 * 15 segundos)
  onPaymentConfirmed,
}: UsePaymentStatusCheckerProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Função para verificar status do pagamento
  const checkPaymentStatus = async (isManual = false) => {
    if (!orderId || (!enabled && !isManual)) {
      return
    }

    try {
      setIsChecking(true)
      setError(null)

      console.log(`🔍 Verificando status do pagamento - Tentativa ${attempts + 1}/${maxAttempts}`)

      const response = await fetch(`/api/check-payment-status?orderId=${orderId}`)
      const data: PaymentStatus = await response.json()

      console.log("📊 Status do pagamento:", data)
      console.log("🔍 Análise detalhada:", {
        status: data.status,
        payment_status: data.payment_status,
        is_paid: data.is_paid,
        should_redirect: data.is_paid,
      })

      setPaymentStatus(data)
      setLastChecked(new Date())

      if (!isManual) {
        setAttempts((prev) => prev + 1)
      }

      if (response.ok && data.success) {
        if (data.is_paid) {
          console.log("✅ PAGAMENTO CONFIRMADO! Redirecionando...")
          console.log("🎯 Dados do pagamento aprovado:", {
            order_id: data.order_id,
            status: data.status,
            payment_status: data.payment_status,
            amount: data.amount,
          })

          // Parar verificações
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }

          // Callback personalizado se fornecido
          if (onPaymentConfirmed) {
            onPaymentConfirmed(data)
          }

          // Salvar dados do pedido para página de obrigado
          const orderSummary = {
            orderId: data.order_id,
            customerName: "", // Será preenchido se disponível
            customerEmail: "", // Será preenchido se disponível
            amount: data.amount, // Manter o valor original da API (já em centavos)
            paymentMethod: "PIX",
          }

          // Tentar obter dados do sessionStorage se disponíveis
          try {
            const savedOrderData = sessionStorage.getItem("orderSummary")
            if (savedOrderData) {
              const existingData = JSON.parse(savedOrderData)
              orderSummary.customerName = existingData.customerName || ""
              orderSummary.customerEmail = existingData.customerEmail || ""
            }
          } catch (storageError) {
            console.warn("⚠️ Erro ao ler dados salvos:", storageError)
          }

          sessionStorage.setItem("orderSummary", JSON.stringify(orderSummary))

          // Redirecionar para página de obrigado
          router.push("/obrigado")
          return
        }
      } else {
        setError(data.message || "Erro ao verificar status")
      }
    } catch (error) {
      console.error("❌ Erro ao verificar status:", error)
      setError(error instanceof Error ? error.message : "Erro de conexão")
    } finally {
      setIsChecking(false)
    }
  }

  // Função para verificação manual
  const checkNow = () => {
    checkPaymentStatus(true)
  }

  // Função para parar verificações
  const stopChecking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Função para reiniciar verificações
  const startChecking = () => {
    if (!enabled || !orderId) return

    stopChecking() // Parar qualquer verificação existente

    // Verificar imediatamente
    checkPaymentStatus()

    // Configurar verificação periódica
    intervalRef.current = setInterval(() => {
      if (attempts >= maxAttempts) {
        console.log("⏰ Número máximo de tentativas atingido")
        stopChecking()
        return
      }

      checkPaymentStatus()
    }, intervalSeconds * 1000)
  }

  // Effect para iniciar/parar verificações
  useEffect(() => {
    if (enabled && orderId) {
      startChecking()
    }

    return () => {
      stopChecking()
    }
  }, [enabled, orderId])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopChecking()
    }
  }, [])

  return {
    isChecking,
    attempts,
    maxAttempts,
    lastChecked,
    paymentStatus,
    error,
    checkNow,
    stopChecking,
    startChecking,
    progress: Math.min((attempts / maxAttempts) * 100, 100),
  }
}
