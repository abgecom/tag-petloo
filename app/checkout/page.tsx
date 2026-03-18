import Checkout from "@/CheckoutComponent"

export default async function CheckoutPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ 
    product?: string
    price?: string
    items?: string
  }>
}) {
  const params = await searchParams
  
  return <Checkout productParams={{
    product: params.product,
    price: params.price,
    items: params.items
  }} />
}
