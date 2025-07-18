import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Order } from "@/lib/types"

async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/api/orders?orderId=${orderId}`,
      { cache: "no-store" },
    )

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching order:", error)
    return null
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string }
}) {
  const order = await getOrder(params.orderId)

  if (!order) {
    notFound()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detalhes do Pedido</h1>
          <p className="text-muted-foreground">ID: {order.id}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={order.status === "Paid" ? "default" : "secondary"}>
                {order.status === "Paid" ? "Pago" : "Pendente"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data:</span>
              <span>{format(new Date(order.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold">R$ {order.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-muted-foreground">Nome:</span>
              <p className="font-medium">{order.customer.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <p>{order.customer.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Telefone:</span>
              <p>{order.customer.phone}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Endereço:</span>
              <p>
                {order.customer.address.street}
                <br />
                {order.customer.address.city}, {order.customer.address.state}
                <br />
                CEP: {order.customer.address.zip}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">SKU: {item.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">R$ {item.price.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
