import Checkout from "../../checkout"

export default function CheckoutPage({ 
  searchParams 
}: { 
  searchParams: { 
    product?: string
    price?: string
    items?: string
  } 
}) {
  return <Checkout searchParams={searchParams} />
}
