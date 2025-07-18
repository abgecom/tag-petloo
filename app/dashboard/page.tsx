"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Package, Clock, CheckCircle, DollarSign } from "lucide-react"
import type { Order } from "@/lib/supabase"

interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  statistics: {
    total: number
    pending: number
    paid: number
    revenue: number
  }
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    revenue: 0,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search,
        status: statusFilter,
      })

      const response = await fetch(`/api/orders?${params}`)
      if (!response.ok) {
        throw new Error("Erro ao buscar pedidos")
      }

      const data: OrdersResponse = await response.json()
      setOrders(data.orders)
      setStatistics(data.statistics)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [currentPage, search, statusFilter])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const },
      paid: { label: "Pago", variant: "default" as const },
      shipped: { label: "Enviado", variant: "outline" as const },
      delivered: { label: "Entregue", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
    }

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPaymentMethodBadge = (method: string) => {
    return method === "pix" ? <Badge variant="outline">PIX</Badge> : <Badge variant="outline">Cartão</Badge>
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR")
  }

  if (loading && orders.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando pedidos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Pedidos</h1>
          <p className="text-gray-600">Gerencie todos os pedidos da sua loja</p>
        </div>
        <Button onClick={fetchOrders} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.paid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.revenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome, email ou ID do pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="shipped">Enviado</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 space-y-2 sm:space-y-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-medium">#{order.order_id}</span>
                      {getStatusBadge(order.order_status)}
                      {getPaymentMethodBadge(order.payment_method)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        {order.customer_name} • {order.customer_email}
                      </p>
                      <p>
                        {order.product_type} • Qtd: {order.product_quantity}
                      </p>
                      <p>{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 sm:mt-0">
                    <span className="font-bold">{formatCurrency(order.order_amount)}</span>
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.order_id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Status */}
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedOrder.order_status)}
                {getPaymentMethodBadge(selectedOrder.payment_method)}
                <span className="text-sm text-gray-600">{formatDate(selectedOrder.created_at)}</span>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="font-semibold mb-3">Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <strong>Nome:</strong> {selectedOrder.customer_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedOrder.customer_email}
                    </p>
                    <p>
                      <strong>Telefone:</strong> {selectedOrder.customer_phone}
                    </p>
                    <p>
                      <strong>CPF:</strong> {selectedOrder.customer_cpf}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Endereço:</strong> {selectedOrder.customer_address}
                    </p>
                    <p>
                      <strong>CEP:</strong> {selectedOrder.customer_cep}
                    </p>
                    <p>
                      <strong>Cidade:</strong> {selectedOrder.customer_city}
                    </p>
                    <p>
                      <strong>Estado:</strong> {selectedOrder.customer_state}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div>
                <h3 className="font-semibold mb-3">Informações do Produto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <strong>Produto:</strong> {selectedOrder.product_type}
                    </p>
                    <p>
                      <strong>Cor:</strong> {selectedOrder.product_color}
                    </p>
                    <p>
                      <strong>Quantidade:</strong> {selectedOrder.product_quantity}
                    </p>
                    <p>
                      <strong>SKU:</strong> {selectedOrder.product_sku}
                    </p>
                  </div>
                  <div>
                    {selectedOrder.pet_name && (
                      <p>
                        <strong>Nome do Pet:</strong> {selectedOrder.pet_name}
                      </p>
                    )}
                    <p>
                      <strong>Valor Total:</strong> {formatCurrency(selectedOrder.order_amount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* PIX Information */}
              {selectedOrder.payment_method === "pix" && selectedOrder.pix_code && (
                <div>
                  <h3 className="font-semibold mb-3">Informações do PIX</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p>
                      <strong>Código PIX:</strong>
                    </p>
                    <p className="break-all font-mono text-xs mt-1">{selectedOrder.pix_code}</p>
                  </div>
                </div>
              )}

              {/* Order IDs */}
              <div>
                <h3 className="font-semibold mb-3">IDs do Sistema</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>ID do Pedido:</strong> {selectedOrder.order_id}
                  </p>
                  {selectedOrder.customer_id && (
                    <p>
                      <strong>ID do Cliente:</strong> {selectedOrder.customer_id}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
