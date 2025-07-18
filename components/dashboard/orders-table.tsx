import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Eye } from "lucide-react"
import Link from "next/link"
import type { Order } from "@/lib/types"

interface OrdersTableProps {
  orders: Order[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum pedido encontrado no período selecionado.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID do Pedido</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-mono text-sm">
              {order.id.length > 20 ? `${order.id.substring(0, 20)}...` : order.id}
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{order.customer.name}</div>
                <div className="text-sm text-muted-foreground">{order.customer.email}</div>
              </div>
            </TableCell>
            <TableCell>{format(new Date(order.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
            <TableCell>R$ {order.total.toFixed(2)}</TableCell>
            <TableCell>
              <Badge variant={order.status === "Paid" ? "default" : "secondary"}>
                {order.status === "Paid" ? "Pago" : "Pendente"}
              </Badge>
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/orders/${order.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
