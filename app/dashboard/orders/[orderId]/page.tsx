"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Check } from "lucide-react"
import type { Order } from "@/lib/types"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders`)
        const data = await response.json()

        if (response.ok) {
          const foundOrder = data.orders.find((o: Order) => o.id === params.orderId)
          setOrder(foundOrder || null)
        }
      } catch (error) {
        console.error("Erro ao buscar pedido:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.orderId) {
      fetchOrder()
    }
  }, [params.orderId])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Erro ao copiar:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pago":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Pago</Badge>
      case "Aguardando Pagamento":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>
      case "Cancelado":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pedido não encontrado</h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.order_id.slice(-8)}</h1>
                <p className="text-gray-600">
                  Criado em{" "}
                  {new Date(order.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">{getStatusBadge(order.order_status)}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome</label>
                <p className="text-gray-900">{order.customer_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{order.customer_email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Telefone</label>
                <p className="text-gray-900">{order.customer_phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">CPF</label>
                <p className="text-gray-900">{order.customer_cpf}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Endereço</label>
                <p className="text-gray-900">{order.customer_address}</p>
                <p className="text-gray-600 text-sm">
                  {order.customer_city}, {order.customer_state} - {order.customer_cep}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">ID do Pedido</label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 font-mono">{order.order_id}</p>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(order.order_id)}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Produto</label>
                <p className="text-gray-900">{order.product_type}</p>
                <p className="text-gray-600 text-sm">
                  Cor: {order.product_color} | Quantidade: {order.product_quantity}
                </p>
                {order.pet_name && <p className="text-gray-600 text-sm">Nome do Pet: {order.pet_name}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">SKU</label>
                <p className="text-gray-900 font-mono">{order.product_sku}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Valor Total</label>
                <p className="text-2xl font-bold text-gray-900">R$ {order.order_amount.toFixed(2).replace(".", ",")}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Método de Pagamento</label>
                <p className="text-gray-900">{order.payment_method}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(order.order_status)}</div>
              </div>
            </CardContent>
          </Card>

          {/* PIX Information (if applicable) */}
          {order.payment_method === "PIX" && order.pix_code && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informações do PIX</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.pix_qr_code && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">QR Code</label>
                    <div className="mt-2 flex justify-center">
                      <img
                        src={`data:image/png;base64,${order.pix_qr_code}`}
                        alt="QR Code PIX"
                        className="max-w-[200px] border rounded-lg"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Código PIX Copia e Cola</label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 p-2 bg-gray-100 rounded text-sm break-all">{order.pix_code}</code>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(order.pix_code!)}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {order.pix_expiration_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Expiração</label>
                    <p className="text-gray-900">
                      {new Date(order.pix_expiration_date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
