"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, TrendingUp } from "lucide-react"
import { DateRangePicker } from "@/components/dashboard/date-range-picker"
import { StatsCard } from "@/components/dashboard/stats-card"
import { OrdersTable } from "@/components/dashboard/orders-table"
import type { Order } from "@/lib/types"

interface DashboardStats {
  totalSales: {
    amount: number
    change: number
  }
  totalOrders: {
    count: number
    change: number
  }
  averageOrderValue: {
    amount: number
    change: number
  }
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: { amount: 0, change: 0 },
    totalOrders: { count: 0, change: 0 },
    averageOrderValue: { amount: 0, change: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 6)),
    to: new Date(),
  })

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      })

      const response = await fetch(`/api/orders?${params}`)
      if (!response.ok) throw new Error("Failed to fetch orders")

      const fetchedOrders: Order[] = await response.json()
      setOrders(fetchedOrders)

      // Calcular estatísticas
      const totalSales = fetchedOrders
        .filter((order) => order.status === "Paid")
        .reduce((sum, order) => sum + order.total, 0)

      const totalOrders = fetchedOrders.length
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

      setStats({
        totalSales: { amount: totalSales, change: 2 }, // Mock change percentage
        totalOrders: { count: totalOrders, change: 0 },
        averageOrderValue: { amount: averageOrderValue, change: 0.2 },
      })
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [dateRange])

  const handleDateRangeChange = (from: Date, to: Date) => {
    setDateRange({ from, to })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando dados...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das suas vendas e pedidos</p>
        </div>
        <DateRangePicker from={dateRange.from} to={dateRange.to} onDateRangeChange={handleDateRangeChange} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total de vendas"
          value={`R$ ${stats.totalSales.amount.toFixed(2)}`}
          change={stats.totalSales.change}
          icon={TrendingUp}
        />
        <StatsCard
          title="Pedidos"
          value={stats.totalOrders.count.toString()}
          change={stats.totalOrders.change}
          icon={CalendarIcon}
        />
        <StatsCard
          title="Valor médio do pedido"
          value={`R$ ${stats.averageOrderValue.amount.toFixed(2)}`}
          change={stats.averageOrderValue.change}
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
          <CardDescription>Lista de todos os pedidos no período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          <OrdersTable orders={orders} />
        </CardContent>
      </Card>
    </div>
  )
}
