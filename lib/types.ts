export interface Order {
  id: string
  date: string
  customer: {
    name: string
    email: string
    phone: string
    address: {
      street: string
      city: string
      state: string
      zip: string
    }
  }
  total: number
  status: "Paid" | "Unpaid"
  items: {
    id: string
    name: string
    quantity: number
    price: number
  }[]
}
