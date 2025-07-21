"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Download, Calendar, DollarSign, Package, TrendingUp, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

interface Order {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  total_amount: number
  order_status: string
  payment_method: string
  created_at: string
  customer_address: string
  personalized_tags?: Array<{
    id: string
    color: string
    petName: string
    price: number
  }>
  quantity: number
  is_personalized: boolean
}

interface Stats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
}

const statusLabels = {
  pending: "Pendente",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders")
      const data = await response.json()

      if (data.success) {
        setOrders(data.orders)
        calculateStats(data.orders)
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (ordersData: Order[]) => {
    const totalOrders = ordersData.length
    const totalRevenue = ordersData.reduce((sum, order) => sum + order.total_amount, 0)
    const pendingOrders = ordersData.filter((order) => order.order_status === "pending").length
    const completedOrders = ordersData.filter((order) =>
      ["paid", "shipped", "delivered"].includes(order.order_status),
    ).length

    setStats({
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
    })
  }

  const filterOrders = () => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.order_status === statusFilter)
    }

    setFilteredOrders(filtered)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)

    try {
      const response = await fetch("/api/update-order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Atualizar o pedido na lista
        setOrders((prevOrders) =>
          prevOrders.map((order) => (order.id === orderId ? { ...order, order_status: newStatus } : order)),
        )

        // Atualizar o pedido selecionado se for o mesmo
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, order_status: newStatus } : null))
        }

        // Recalcular estatísticas
        const updatedOrders = orders.map((order) =>
          order.id === orderId ? { ...order, order_status: newStatus } : order,
        )
        calculateStats(updatedOrders)
      } else {
        alert("Erro ao atualizar status: " + result.error)
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      alert("Erro ao atualizar status")
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("dashboard_auth")
    router.push("/dashboard/login")
  }

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR")
  }

  const exportToCSV = () => {
    const headers = ["ID", "Cliente", "Email", "Telefone", "Valor", "Status", "Método de Pagamento", "Data", "Endereço"]

    const csvData = filteredOrders.map((order) => [
      order.id,
      order.customer_name,
      order.customer_email,
      order.customer_phone,
      formatCurrency(order.total_amount),
      statusLabels[order.order_status as keyof typeof statusLabels],
      order.payment_method === "credit_card" ? "Cartão de Crédito" : "PIX",
      formatDate(order.created_at),
      order.customer_address,
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `pedidos_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard de Vendas</h1>
            <p className="text-gray-600">Gerencie seus pedidos e vendas</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2 bg-transparent">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Receita Total</p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pedidos Pendentes</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.pendingOrders}</p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pedidos Concluídos</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.completedOrders}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome, email ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
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
              <Button onClick={exportToCSV} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-sm text-gray-600">{order.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell>
                        <Select
                          value={order.order_status}
                          onValueChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
                          disabled={updatingStatus === order.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue>
                              <Badge className={statusColors[order.order_status as keyof typeof statusColors]}>
                                {updatingStatus === order.id
                                  ? "..."
                                  : statusLabels[order.order_status as keyof typeof statusLabels]}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                            <SelectItem value="shipped">Enviado</SelectItem>
                            <SelectItem value="delivered">Entregue</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.payment_method === "credit_card" ? "Cartão" : "PIX"}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-6">
                                {/* Informações do Cliente */}
                                <div>
                                  <h3 className="font-semibold mb-3">Informações do Cliente</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label>Nome</Label>
                                      <p className="text-sm text-gray-600">{selectedOrder.customer_name}</p>
                                    </div>
                                    <div>
                                      <Label>Email</Label>
                                      <p className="text-sm text-gray-600">{selectedOrder.customer_email}</p>
                                    </div>
                                    <div>
                                      <Label>Telefone</Label>
                                      <p className="text-sm text-gray-600">{selectedOrder.customer_phone}</p>
                                    </div>
                                    <div>
                                      <Label>Data do Pedido</Label>
                                      <p className="text-sm text-gray-600">{formatDate(selectedOrder.created_at)}</p>
                                    </div>
                                  </div>
                                  <div className="mt-4">
                                    <Label>Endereço</Label>
                                    <p className="text-sm text-gray-600">{selectedOrder.customer_address}</p>
                                  </div>
                                </div>

                                {/* Itens do Pedido */}
                                <div>
                                  <h3 className="font-semibold mb-3">Itens do Pedido</h3>
                                  <div className="space-y-2">
                                    {selectedOrder.is_personalized && selectedOrder.personalized_tags ? (
                                      selectedOrder.personalized_tags.map((tag, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div
                                              className={`w-4 h-4 rounded-full ${tag.color === "orange" ? "bg-orange-500" : "bg-purple-500"}`}
                                            ></div>
                                            <span>
                                              Tag {tag.color === "orange" ? "Laranja" : "Roxa"} - "{tag.petName}"
                                            </span>
                                          </div>
                                          <span className="font-semibold">{formatCurrency(tag.price)}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span>Tag rastreamento Petloo + App</span>
                                        <div className="flex items-center gap-2">
                                          <span>{selectedOrder.quantity}x</span>
                                          <span className="font-semibold">
                                            {formatCurrency(selectedOrder.total_amount)}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Informações do Pedido */}
                                <div>
                                  <h3 className="font-semibold mb-3">Informações do Pedido</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label>Status</Label>
                                      <div className="mt-1">
                                        <Select
                                          value={selectedOrder.order_status}
                                          onValueChange={(newStatus) => updateOrderStatus(selectedOrder.id, newStatus)}
                                          disabled={updatingStatus === selectedOrder.id}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue>
                                              <Badge
                                                className={
                                                  statusColors[selectedOrder.order_status as keyof typeof statusColors]
                                                }
                                              >
                                                {updatingStatus === selectedOrder.id
                                                  ? "Atualizando..."
                                                  : statusLabels[
                                                      selectedOrder.order_status as keyof typeof statusLabels
                                                    ]}
                                              </Badge>
                                            </SelectValue>
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">Pendente</SelectItem>
                                            <SelectItem value="paid">Pago</SelectItem>
                                            <SelectItem value="shipped">Enviado</SelectItem>
                                            <SelectItem value="delivered">Entregue</SelectItem>
                                            <SelectItem value="cancelled">Cancelado</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Método de Pagamento</Label>
                                      <p className="text-sm text-gray-600">
                                        {selectedOrder.payment_method === "credit_card" ? "Cartão de Crédito" : "PIX"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Valor Total</Label>
                                      <p className="text-lg font-semibold text-green-600">
                                        {formatCurrency(selectedOrder.total_amount)}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>ID do Pedido</Label>
                                      <p className="text-sm text-gray-600 font-mono">{selectedOrder.id}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum pedido encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
