import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Order } from "@/lib/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface OrdersTableProps {
  orders: Order[]
  loading: boolean
}

export default function OrdersTable({ orders, loading }: OrdersTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-blue-600 hover:underline">
                      {order.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.date), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell>R$ {order.total.toFixed(2).replace(".", ",")}</TableCell>
                  <TableCell>
                    <Badge
                      variant={order.status === "Paid" ? "default" : "destructive"}
                      className={order.status === "Paid" ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {order.status === "Paid" ? "Pago" : "Não Pago"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Nenhum pedido encontrado para o período selecionado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
