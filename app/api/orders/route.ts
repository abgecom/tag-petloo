import { NextResponse, type NextRequest } from "next/server"
import Stripe from "stripe"
import type { Order } from "@/lib/types"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const appmaxApiUrl = "https://admin.appmax.com.br/api/v3/orders"
const appmaxAccessToken = process.env.APPMAX_ACCESS_TOKEN

// Função para normalizar os pedidos da Stripe para o nosso formato `Order`
const normalizeStripeOrder = (session: Stripe.Checkout.Session, lineItems: Stripe.LineItem[]): Order => {
  return {
    id: session.id,
    date: new Date(session.created * 1000).toISOString(),
    customer: {
      name: session.customer_details?.name || "N/A",
      email: session.customer_details?.email || "N/A",
      phone: session.customer_details?.phone || "N/A",
      address: {
        street: [session.customer_details?.address?.line1, session.customer_details?.address?.line2]
          .filter(Boolean)
          .join(", "),
        city: session.customer_details?.address?.city || "",
        state: session.customer_details?.address?.state || "",
        zip: session.customer_details?.address?.postal_code || "",
      },
    },
    total: (session.amount_total || 0) / 100,
    status: session.payment_status === "paid" ? "Paid" : "Unpaid",
    items: lineItems.map((item) => ({
      id: item.price?.product.toString() || item.id,
      name: (item.price?.product as Stripe.Product)?.name || item.description,
      quantity: item.quantity || 0,
      price: (item.price?.unit_amount || 0) / 100,
    })),
  }
}

// Função para buscar e normalizar pedidos da Stripe
async function fetchStripeOrders(from: Date, to: Date): Promise<Order[]> {
  try {
    // 1. Busca as sessões sem expandir os line_items para evitar o erro de profundidade.
    const sessions = await stripe.checkout.sessions.list({
      created: {
        gte: Math.floor(from.getTime() / 1000),
        lte: Math.floor(to.getTime() / 1000),
      },
      expand: ["data.customer_details"],
      limit: 100,
    })

    if (!sessions.data.length) {
      return []
    }

    // 2. Busca os line_items para cada sessão concorrentemente.
    const lineItemsPromises = sessions.data.map((session) =>
      stripe.checkout.sessions.listLineItems(session.id, {
        expand: ["data.price.product"], // A expansão aqui é permitida e necessária.
      }),
    )

    const lineItemsResults = await Promise.all(lineItemsPromises)

    // 3. Combina os dados da sessão com seus respectivos line_items.
    const orders = sessions.data.map((session, index) => {
      const lineItems = lineItemsResults[index].data
      return normalizeStripeOrder(session, lineItems)
    })

    return orders
  } catch (error) {
    console.error("Error fetching from Stripe:", error)
    return []
  }
}

// Função para normalizar os pedidos da Appmax para o nosso formato `Order`
const normalizeAppmaxOrder = (appmaxOrder: any): Order => {
  return {
    id: `appmax-${appmaxOrder.id}`,
    date: appmaxOrder.date_created,
    customer: {
      name: appmaxOrder.customer.name,
      email: appmaxOrder.customer.email,
      phone: appmaxOrder.customer.phone,
      address: {
        street: `${appmaxOrder.shipping_address.street}, ${appmaxOrder.shipping_address.number}`,
        city: appmaxOrder.shipping_address.city,
        state: appmaxOrder.shipping_address.state,
        zip: appmaxOrder.shipping_address.zipcode,
      },
    },
    total: Number.parseFloat(appmaxOrder.total_order),
    status: appmaxOrder.status === "Aprovado" ? "Paid" : "Unpaid",
    items: appmaxOrder.items.map((item: any) => ({
      id: item.sku || item.product_id,
      name: item.name,
      quantity: Number.parseInt(item.quantity, 10),
      price: Number.parseFloat(item.price),
    })),
  }
}

// Função para buscar e normalizar pedidos da Appmax
async function fetchAppmaxOrders(from: Date, to: Date): Promise<Order[]> {
  try {
    const fromDate = from.toISOString().split("T")[0]
    const toDate = to.toISOString().split("T")[0]
    const response = await fetch(
      `${appmaxApiUrl}?access-token=${appmaxAccessToken}&initial_date=${fromDate}&final_date=${toDate}`,
      {
        headers: { "Content-Type": "application/json" },
      },
    )
    if (!response.ok) {
      throw new Error(`Appmax API responded with status ${response.status}`)
    }
    const data = await response.json()
    return data.data.map(normalizeAppmaxOrder)
  } catch (error) {
    console.error("Error fetching from Appmax:", error)
    return []
  }
}

// Função para buscar um único pedido por ID
async function fetchSingleOrder(orderId: string): Promise<Order | null> {
  if (orderId.startsWith("cs_")) {
    // Stripe Checkout Session
    try {
      // Para um único pedido, a expansão profunda é permitida.
      const session = await stripe.checkout.sessions.retrieve(orderId, {
        expand: ["line_items.data.price.product", "customer_details"],
      })
      const lineItems = session.line_items?.data || []
      return normalizeStripeOrder(session, lineItems)
    } catch (error) {
      console.error(`Error fetching Stripe order ${orderId}:`, error)
      return null
    }
  } else if (orderId.startsWith("appmax-")) {
    // Appmax Order
    const numericId = orderId.replace("appmax-", "")
    try {
      const response = await fetch(`${appmaxApiUrl}/${numericId}?access-token=${appmaxAccessToken}`)
      if (!response.ok) return null
      const data = await response.json()
      return normalizeAppmaxOrder(data.data)
    } catch (error) {
      console.error(`Error fetching Appmax order ${orderId}:`, error)
      return null
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get("orderId")

  if (orderId) {
    const order = await fetchSingleOrder(orderId)
    if (order) {
      return NextResponse.json(order)
    }
    return new NextResponse("Order not found", { status: 404 })
  }

  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  // Define um período padrão (últimos 7 dias) se as datas não forem fornecidas
  const to = toParam ? new Date(toParam) : new Date()
  const from = fromParam ? new Date(fromParam) : new Date(new Date().setDate(to.getDate() - 6))

  // Garante que o dia 'to' seja incluído por completo
  to.setHours(23, 59, 59, 999)

  const [stripeOrders, appmaxOrders] = await Promise.all([fetchStripeOrders(from, to), fetchAppmaxOrders(from, to)])

  const allOrders = [...stripeOrders, ...appmaxOrders]

  // Ordena os pedidos por data, do mais recente para o mais antigo
  allOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return NextResponse.json(allOrders)
}
