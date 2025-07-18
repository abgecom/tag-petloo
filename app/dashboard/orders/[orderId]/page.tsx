"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ShoppingCart, User, MapPin, Phone } from "lucide-react"
import type { Order } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function OrderDetailsPage({
  params,
}: {
  params: { orderId: string }
}) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true)
      const response = await fetch(`/api/orders?orderId=${params.orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      }
      setLoading(false)
    }
    fetchOrder()
  }, [params.orderId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div>
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para o Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Pedido não encontrado</h1>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para o Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Pedido {order.id}</h1>
          <Badge
            variant={order.status === "Paid" ? "default" : "destructive"}
            className={order.status === "Paid" ? "bg-green-500 hover:bg-green-600" : ""}
          >
            {order.status === "Paid" ? "Pago" : "Não Pago"}
          </Badge>
        </div>
        <p className="text-sm text-gray-500">
          Data:{" "}
          {format(new Date(order.date), "dd 'de' MMMM 'de' yyyy, HH:mm", {
            locale: ptBR,
          })}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Itens do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Qtd.</TableHead>
                  <TableHead className="text-right">Preço Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">R$ {item.price.toFixed(2).replace(".", ",")}</TableCell>
                    <TableCell className="text-right">
                      R$ {(item.quantity * item.price).toFixed(2).replace(".", ",")}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell colSpan={3} className="text-right">
                    Total
                  </TableCell>
                  <TableCell className="text-right">R$ {order.total.toFixed(2).replace(".", ",")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold">{order.customer.name}</p>
            <p className="text-gray-600">{order.customer.email}</p>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{order.customer.phone}</span>
            </div>
            <div className="pt-2 border-t mt-2">
              <p className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Endereço de Entrega
              </p>
              <address className="not-italic text-gray-600">
                {order.customer.address.street}
                <br />
                {order.customer.address.city}, {order.customer.address.state}
                <br />
                CEP: {order.customer.address.zip}
              </address>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
