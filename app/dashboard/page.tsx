"use client"

import { useState, useEffect, useMemo } from "react"
import type { DateRange } from "react-day-picker"
import { subDays } from "date-fns"
import { DollarSign, ShoppingCart, Users } from "lucide-react"

import type { Order } from "@/lib/types"
import { DateRangePicker } from "@/components/dashboard/date-range-picker"
import StatsCard from "@/components/dashboard/stats-card"
import OrdersTable from "@/components/dashboard/orders-table"

export default function DashboardPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  })
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      if (date?.from && date?.to) {
        setLoading(true)
        const fromISO = date.from.toISOString().split("T")[0]
        const toISO = date.to.toISOString().split("T")[0]
        const response = await fetch(`/api/orders?from=${fromISO}&to=${toISO}`)
        const data = await response.json()
        setOrders(data)
        setLoading(false)
      }
    }
    fetchOrders()
  }, [date])

  const stats = useMemo(() => {
    const paidOrders = orders.filter((order) => order.status === "Paid")
    const totalSales = paidOrders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalSales / paidOrders.length : 0

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
    }
  }, [orders])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <DateRangePicker date={date} setDate={setDate} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total de vendas"
          value={`R$ ${stats.totalSales.toFixed(2).replace(".", ",")}`}
          icon={DollarSign}
          description="Total de vendas pagas no período"
          loading={loading}
        />
        <StatsCard
          title="Pedidos"
          value={stats.totalOrders.toString()}
          icon={ShoppingCart}
          description="Total de pedidos no período"
          loading={loading}
        />
        <StatsCard
          title="Valor médio do pedido"
          value={`R$ ${stats.averageOrderValue.toFixed(2).replace(".", ",")}`}
          icon={Users}
          description="Valor médio por pedido pago"
          loading={loading}
        />
      </div>

      <div>
        <OrdersTable orders={orders} loading={loading} />
      </div>
    </div>
  )
}
