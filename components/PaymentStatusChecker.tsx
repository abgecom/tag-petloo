"use client"

import { usePaymentStatusChecker } from "@/hooks/usePaymentStatusChecker"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface PaymentStatusCheckerProps {
  orderId: string
  amount: number
  onPaymentConfirmed?: () => void
}

export default function PaymentStatusChecker({ orderId, amount, onPaymentConfirmed }: PaymentStatusCheckerProps) {
  const { isChecking, attempts, maxAttempts, lastChecked, paymentStatus, error, checkNow, progress } =
    usePaymentStatusChecker({
      orderId,
      enabled: true,
      intervalSeconds: 15, // Verificar a cada 15 segundos
      maxAttempts: 120, // 30 minutos total
      onPaymentConfirmed: onPaymentConfirmed,
    })

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getStatusColor = () => {
    if (paymentStatus?.is_paid) return "text-green-600"
    if (error) return "text-red-600"
    if (isChecking) return "text-blue-600"
    return "text-yellow-600"
  }

  const getStatusIcon = () => {
    if (paymentStatus?.is_paid) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (error) return <AlertCircle className="w-5 h-5 text-red-600" />
    if (isChecking) return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
    return <Clock className="w-5 h-5 text-yellow-600" />
  }

  const getStatusMessage = () => {
    if (paymentStatus?.is_paid) return "✅ Pagamento confirmado! Redirecionando..."
    if (error) return `❌ ${error}`
    if (isChecking) return "🔍 Verificando pagamento..."
    return "⏳ Aguardando pagamento..."
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-blue-800 flex items-center gap-2">
          {getStatusIcon()}
          Verificação Automática de Pagamento
        </h4>
        <Button
          onClick={checkNow}
          disabled={isChecking}
          variant="outline"
          size="sm"
          className="bg-white hover:bg-blue-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? "animate-spin" : ""}`} />
          Verificar agora
        </Button>
      </div>

      <div className="space-y-3">
        {/* Status Message */}
        <p className={`text-sm font-medium ${getStatusColor()}`}>{getStatusMessage()}</p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Tentativas:</span> {attempts}/{maxAttempts}
          </div>
          <div>
            <span className="font-medium">Última verificação:</span> {lastChecked ? formatTime(lastChecked) : "Nunca"}
          </div>
        </div>

        {/* Payment Details */}
        {paymentStatus && (
          <div className="bg-white rounded-lg p-3 border">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Status:</span>{" "}
                <span className={paymentStatus.is_paid ? "text-green-600" : "text-yellow-600"}>
                  {paymentStatus.status}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Valor:</span> R${" "}
                {(amount / 100).toFixed(2).replace(".", ",")}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500">
          💡 <strong>Dica:</strong> Após efetuar o pagamento PIX, você será redirecionado automaticamente. O sistema
          verifica o status a cada 15 segundos por até 30 minutos.
        </div>
      </div>
    </div>
  )
}
