"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { DateRangePicker } from "@/components/dashboard/date-range-picker"
import { StatsCard } from "@/components/dashboard/stats-card"
import { OrdersTable } from "@/components/dashboard/orders-table"
import type { Order, OrderStats } from "@/lib/types"

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    paidOrders: 0,
    pendingOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{
    startDate: string
    endDate: string
  }>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 dias atrás
    endDate: new Date().toISOString().split("T")[0], // hoje
  })

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })

      const response = await fetch(`/api/orders?${params}`)
      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders || [])
        setStats(
          data.stats || {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            paidOrders: 0,
            pendingOrders: 0,
          },
        )
      } else {
        console.error("Erro ao buscar pedidos:", data.error)
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [dateRange])

  const handleDateRangeChange = (newDateRange: { startDate: string; endDate: string }) => {
    setDateRange(newDateRange)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard de Vendas</h1>
              <p className="text-gray-600">Acompanhe suas vendas e pedidos em tempo real</p>
            </div>
            <div className="flex items-center gap-4">
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={handleDateRangeChange}
              />
              <Button onClick={fetchOrders} disabled={loading} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total de vendas"
            value={`R$ ${stats.totalRevenue.toFixed(2).replace(".", ",")}`}
            change="+2%"
            icon="💰"
          />
          <StatsCard title="Pedidos" value={stats.totalOrders.toString()} change="+5%" icon="📦" />
          <StatsCard
            title="Valor médio do pedido"
            value={`R$ ${stats.averageOrderValue.toFixed(2).replace(".", ",")}`}
            change="+0,2%"
            icon="📊"
          />
          <StatsCard title="Taxa de conversão" value="2,4%" change="+0,1%" icon="📈" />
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Pedidos Recentes</span>
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersTable orders={orders} loading={loading} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
