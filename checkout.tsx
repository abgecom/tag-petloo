"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Mask functions for credit card fields
const formatCardNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, "")
  const match = cleaned.match(/(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})/)
  if (match) {
    return [match[1], match[2], match[3], match[4]].filter(Boolean).join(" ")
  }
  return cleaned
}

const formatExpiryDate = (value: string) => {
  const cleaned = value.replace(/\D/g, "")
  if (cleaned.length >= 2) {
    const month = cleaned.substring(0, 2)
    const year = cleaned.substring(2, 4)

    // Validate month (01-12)
    if (Number.parseInt(month) > 12) {
      return "12/" + year
    }
    if (Number.parseInt(month) === 0) {
      return "01/" + year
    }

    return month + (year ? "/" + year : "")
  }
  return cleaned
}

const formatCVV = (value: string) => {
  return value.replace(/\D/g, "").substring(0, 3)
}

const getCardType = (number: string) => {
  const cleaned = number.replace(/\D/g, "")
  if (cleaned.match(/^4/)) return "visa"
  if (cleaned.match(/^5[1-5]/)) return "mastercard"
  if (cleaned.match(/^3[47]/)) return "amex"
  return "unknown"
}

// Stripe Card Element styles
const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#9e2146",
    },
  },
}

function OrderSummaryContent({
  quantity,
  setQuantity,
  shippingMethod,
  addressFound,
}: { quantity: number; setQuantity: (q: number) => void; shippingMethod: string; addressFound: boolean }) {
  // Calculate shipping cost only if address is found
  const getShippingCost = () => {
    if (!addressFound) return 0
    if (shippingMethod === "standard") return 18.87
    if (shippingMethod === "express") return 29.9
    return 0
  }

  const shippingCost = getShippingCost()
  const subtotal = shippingCost
  const total = subtotal

  return (
    <div className="space-y-6">
      {/* Product 1 */}
      <div className="flex gap-4">
        <img
          src="/placeholder.svg?height=80&width=80&text=Caneca"
          alt="Caneca Personalizada"
          className="w-20 h-20 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h3 className="font-medium">Tag rastreamento petloo + App Petloo</h3>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full border flex items-center justify-center"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full border flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold">R$ 0,00</p>
        </div>
      </div>

      {/* Product 2 */}
      <div className="flex gap-4">
        <img
          src="/placeholder.svg?height=80&width=80&text=App"
          alt="App Petloo"
          className="w-20 h-20 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h3 className="font-medium">App Petloo</h3>
          <p className="text-sm text-green-600 font-medium">GRÁTIS</p>
          <p className="text-sm text-gray-600">Qtd: 1</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">R$ 0,00</p>
        </div>
      </div>

      {/* Product 3 */}
      <div className="flex gap-4">
        <img
          src="/placeholder.svg?height=80&width=80&text=Livro"
          alt="Livro digital"
          className="w-20 h-20 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h3 className="font-medium">Livro digital Loobook</h3>
          <p className="text-sm text-green-600 font-medium">GRÁTIS</p>
          <p className="text-sm text-gray-600">Qtd: 1</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">R$ 0,00</p>
        </div>
      </div>

      {/* Coupon */}
      <div className="border-t pt-4">
        <p className="text-sm mb-2">Tem cupom de desconto ou vale presente?</p>
        <div className="flex gap-2">
          <Input placeholder="Código do cupom" className="flex-1" />
          <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6">Aplicar</Button>
        </div>
      </div>

      {/* Totals */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>R$ {total.toFixed(2).replace(".", ",")}</span>
        </div>
        <p className="text-sm text-gray-600">Em até 12x no cartão de crédito</p>
      </div>
    </div>
  )
}

function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()

  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState("credit")

  const [addressData, setAddressData] = useState({
    cep: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
  })
  const [addressFound, setAddressFound] = useState(false)
  const [shippingMethod, setShippingMethod] = useState("standard")

  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  })

  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return value
  }

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/)
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`
    }
    return value
  }

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    const match = cleaned.match(/^(\d{5})(\d{3})$/)
    if (match) {
      return `${match[1]}-${match[2]}`
    }
    return value
  }

  const fetchAddressByCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, "")
    if (cleanCEP.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setAddressData({
            cep: formatCEP(cleanCEP),
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          })
          setAddressFound(true)
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error)
      }
    }
  }

  const handleCheckout = async () => {
    if (!stripe || !elements) {
      console.error("Stripe não foi carregado")
      return
    }

    setIsProcessing(true)
    setCheckoutMessage(null)

    try {
      // Validar campos obrigatórios
      const email = (document.getElementById("email") as HTMLInputElement)?.value
      const name = (document.getElementById("name") as HTMLInputElement)?.value
      const phone = (document.getElementById("phone") as HTMLInputElement)?.value
      const cpf = (document.getElementById("cpf") as HTMLInputElement)?.value
      const number = (document.getElementById("number") as HTMLInputElement)?.value

      console.log("=== DADOS DO CHECKOUT ===")
      console.log("Cliente:", { name, email, phone: phone?.replace(/\D/g, "") })
      console.log("Frete selecionado:", shippingMethod === "standard" ? "R$ 18,87" : "R$ 29,90")
      console.log("Dados do cartão (formatado):", cardData)

      if (!email || !name || !phone || !cpf || !addressFound || !number) {
        setCheckoutMessage({ type: "error", text: "Por favor, preencha todos os campos obrigatórios." })
        return
      }

      if (paymentMethod === "credit") {
        const cardElement = elements.getElement(CardElement)
        if (!cardElement) {
          setCheckoutMessage({ type: "error", text: "Elemento do cartão não encontrado." })
          return
        }
      }

      // Preparar dados para envio
      const checkoutData = {
        name,
        email,
        cpf: cpf.replace(/\D/g, ""),
        telefone: phone.replace(/\D/g, ""),
        cep: addressData.cep.replace(/\D/g, ""),
        endereco: addressData.street,
        numero: number,
        bairro: addressData.neighborhood,
        cidade: addressData.city,
        estado: addressData.state,
        complemento: (document.getElementById("complement") as HTMLInputElement)?.value || "",
        shipping_price: shippingMethod === "standard" ? 1887 : 2990,
      }

      console.log("Dados enviados para API:", checkoutData)

      // Chamar API de checkout
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      })

      const result = await response.json()
      console.log("Resposta da API:", result)

      if (!response.ok) {
        throw new Error(result.error || "Erro no processamento do pagamento")
      }

      if (paymentMethod === "pix") {
        setCheckoutMessage({
          type: "success",
          text: "Pedido criado com sucesso! Você receberá as instruções de pagamento por email.",
        })
      } else {
        // Processar pagamento com cartão usando Stripe
        const cardElement = elements.getElement(CardElement)

        if (!cardElement) {
          throw new Error("Elemento do cartão não encontrado")
        }

        console.log("Confirmando pagamento com client_secret:", result.client_secret)

        const { error, paymentIntent } = await stripe.confirmCardPayment(result.client_secret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: name,
              email: email,
              phone: phone.replace(/\D/g, ""),
            },
          },
        })

        console.log("=== RESPOSTA DO STRIPE ===")
        console.log("Error:", error)
        console.log("PaymentIntent:", paymentIntent)

        if (error) {
          console.error("Erro no pagamento:", error)
          setCheckoutMessage({
            type: "error",
            text: `Erro no pagamento: ${error.message}`,
          })
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
          console.log("✅ PAGAMENTO CONFIRMADO!")
          setCheckoutMessage({
            type: "success",
            text: "Pagamento processado com sucesso! Você receberá a confirmação por email.",
          })
        } else {
          console.log("Status do pagamento:", paymentIntent?.status)
          setCheckoutMessage({
            type: "error",
            text: "Pagamento não foi processado. Tente novamente.",
          })
        }
      }
    } catch (error) {
      console.error("Erro no checkout:", error)
      setCheckoutMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro interno. Tente novamente.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Alert Banner */}
      <div className="bg-red-500 text-white text-center py-2 px-4 text-sm">
        <strong>ATENÇÃO:</strong> O prazo de entrega dos produtos personalizados inclui o tempo de frete + o prazo de
        produção (2 a 3 semanas).
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Left Column - Forms (Desktop) / Main Content (Mobile) */}
          <div className="lg:order-1">
            {/* Mobile Order Summary Toggle */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
                className="w-full flex items-center justify-between p-4 bg-white border rounded-lg"
              >
                <span className="font-medium">Resumo do pedido</span>
                {isOrderSummaryOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {isOrderSummaryOpen && (
                <div className="mt-4 p-4 bg-white border rounded-lg">
                  <OrderSummaryContent
                    quantity={quantity}
                    setQuantity={setQuantity}
                    shippingMethod={shippingMethod}
                    addressFound={addressFound}
                  />
                </div>
              )}
            </div>

            {/* Petloo Logo */}
            <div className="mb-8 text-center lg:text-left">
              <img
                src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
                alt="Petloo Logo"
                className="h-12 mx-auto lg:mx-0"
              />
            </div>

            {/* Personal Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Informações Pessoais</h2>
              <p className="text-sm text-gray-600 mb-4">Para quem devemos entregar o pedido?</p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    E-mail
                  </Label>
                  <Input id="email" type="email" placeholder="Digite seu e-mail" className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nome completo
                  </Label>
                  <Input id="name" placeholder="Digite seu nome completo" className="mt-1" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Celular
                    </Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      className="mt-1"
                      onChange={(e) => {
                        e.target.value = formatPhone(e.target.value)
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf" className="text-sm font-medium">
                      CPF
                    </Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      className="mt-1"
                      onChange={(e) => {
                        e.target.value = formatCPF(e.target.value)
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Informações de Entrega</h2>
              <p className="text-sm text-gray-600 mb-4">Para onde devemos entregar o pedido?</p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cep" className="text-sm font-medium">
                    CEP
                  </Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      placeholder="99999-999"
                      className={`mt-1 ${addressFound ? "border-green-500 bg-green-50" : "bg-blue-50"}`}
                      value={addressData.cep}
                      onChange={(e) => {
                        const formatted = formatCEP(e.target.value)
                        setAddressData((prev) => ({ ...prev, cep: formatted }))
                        fetchAddressByCEP(formatted)
                      }}
                    />
                    {addressFound && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-green-500">✅</span>
                      </div>
                    )}
                  </div>
                  {addressFound && <p className="text-green-600 text-sm mt-1">Endereço encontrado com sucesso</p>}
                </div>

                {addressFound && (
                  <>
                    <div>
                      <Label htmlFor="street" className="text-sm font-medium">
                        Endereço
                      </Label>
                      <Input
                        id="street"
                        value={addressData.street}
                        className="mt-1 border-green-500 bg-green-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <Label htmlFor="neighborhood" className="text-sm font-medium">
                        Bairro
                      </Label>
                      <Input
                        id="neighborhood"
                        value={addressData.neighborhood}
                        className="mt-1 border-green-500 bg-green-50"
                        readOnly
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-sm font-medium">
                          Cidade
                        </Label>
                        <Input
                          id="city"
                          value={addressData.city}
                          className="mt-1 border-green-500 bg-green-50"
                          readOnly
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-sm font-medium">
                          Estado
                        </Label>
                        <Input
                          id="state"
                          value={addressData.state}
                          className="mt-1 border-green-500 bg-green-50"
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="number" className="text-sm font-medium">
                          Número
                        </Label>
                        <Input id="number" placeholder="Nº" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="complement" className="text-sm font-medium">
                          Complemento
                        </Label>
                        <Input id="complement" placeholder="Apto, bloco..." className="mt-1" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Shipping Method */}
            {addressFound && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-2">Método de envio</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="standard"
                        name="shipping"
                        value="standard"
                        checked={shippingMethod === "standard"}
                        onChange={(e) => setShippingMethod(e.target.value)}
                      />
                      <div>
                        <label htmlFor="standard" className="font-medium">
                          Frete Padrão
                        </label>
                        <p className="text-sm text-gray-600">15 a 20 dias (Produção) + 4 a 12 dias (Entrega)</p>
                      </div>
                    </div>
                    <span className="font-semibold">R$ 18,87</span>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="express"
                        name="shipping"
                        value="express"
                        checked={shippingMethod === "express"}
                        onChange={(e) => setShippingMethod(e.target.value)}
                      />
                      <div>
                        <label htmlFor="express" className="font-medium">
                          Frete Expresso
                        </label>
                        <p className="text-sm text-gray-600">15 a 20 dias (Produção) + 2 a 6 dias (Entrega)</p>
                      </div>
                    </div>
                    <span className="font-semibold">R$ 29,90</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Método de pagamento</h2>
              <p className="text-sm text-gray-600 mb-4">Escolha o seu método de pagamento abaixo</p>

              <div className="space-y-4">
                {/* Credit Card Option */}
                <div className="border-2 border-orange-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="credit"
                        name="payment"
                        value="credit"
                        checked={paymentMethod === "credit"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-orange-500"
                      />
                      <label htmlFor="credit" className="font-medium">
                        Cartão de Crédito
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Fotos%20da%20p%C3%A1gina%20%28outras%29/ChatGPT%20Image%2022%20de%20mai.%20de%202025%2C%2013_19_05%201-0EoPpUJ22eUxcZyJrWdCQNjsh8sOX6.png"
                        alt="Payment Method"
                        className="h-5"
                      />
                      <span className="text-xs text-gray-500">E muito mais...</span>
                    </div>
                  </div>

                  {paymentMethod === "credit" && (
                    <div className="space-y-4">
                      {/* Visual card fields for UX (kept for visual consistency) */}
                      <div>
                        <Input
                          placeholder="Número do cartão"
                          value={cardData.number}
                          onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value)
                            if (formatted.replace(/\s/g, "").length <= 16) {
                              setCardData((prev) => ({ ...prev, number: formatted }))
                            }
                          }}
                          maxLength={19}
                        />
                      </div>

                      <div>
                        <Input
                          placeholder="Nome impresso no cartão"
                          value={cardData.name}
                          onChange={(e) => {
                            // Allow only letters and spaces
                            const value = e.target.value.replace(/[^a-zA-Z\s]/g, "").toUpperCase()
                            setCardData((prev) => ({ ...prev, name: value }))
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Input
                            placeholder="MM/AA"
                            value={cardData.expiry}
                            onChange={(e) => {
                              const formatted = formatExpiryDate(e.target.value)
                              if (formatted.length <= 5) {
                                setCardData((prev) => ({ ...prev, expiry: formatted }))
                              }
                            }}
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="CVV"
                            value={cardData.cvv}
                            onChange={(e) => {
                              const cardType = getCardType(cardData.number)
                              const maxLength = cardType === "amex" ? 4 : 3
                              const formatted = formatCVV(e.target.value)
                              if (formatted.length <= maxLength) {
                                setCardData((prev) => ({ ...prev, cvv: formatted }))
                              }
                            }}
                            maxLength={4}
                          />
                        </div>
                      </div>

                      {/* Stripe CardElement for secure processing */}
                      <div className="p-3 border rounded-lg bg-white">
                        <Label className="text-sm font-medium mb-2 block">Dados do cartão (processamento seguro)</Label>
                        <CardElement options={cardElementOptions} />
                      </div>

                      <select className="w-full p-3 border rounded-lg bg-white">
                        {(() => {
                          const getShippingCost = () => {
                            if (!addressFound) return 0
                            if (shippingMethod === "standard") return 18.87
                            if (shippingMethod === "express") return 29.9
                            return 0
                          }

                          const total = getShippingCost()

                          return <option>1x de R$ {total.toFixed(2).replace(".", ",")}</option>
                        })()}
                      </select>
                    </div>
                  )}
                </div>

                {/* PIX Option */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="pix"
                      name="payment"
                      value="pix"
                      checked={paymentMethod === "pix"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <label htmlFor="pix" className="font-medium">
                      PIX
                    </label>
                  </div>
                  <img src="/placeholder.svg?height=20&width=40&text=PIX" alt="PIX" className="h-5" />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Checkbox id="save-info" defaultChecked />
                <label htmlFor="save-info" className="text-sm text-gray-600">
                  Salvar minhas informações com segurança para compras futuras.
                </label>
              </div>
            </div>

            {/* Finalize Button */}
            <Button
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 text-lg font-semibold mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCheckout}
              disabled={isProcessing || !stripe}
            >
              {isProcessing ? "Processando..." : "Finalizar compra"}
            </Button>

            {checkoutMessage && (
              <div
                className={`p-4 rounded-lg mb-4 text-center ${
                  checkoutMessage.type === "success"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                {checkoutMessage.text}
              </div>
            )}

            {/* Terms and Security */}
            <div className="text-center text-sm text-gray-600 space-y-2">
              <p>
                Ao prosseguir, você concorda com os <span className="text-orange-500 underline">Termos de Serviço</span>
              </p>
              <p>Petloo - Todos os direitos reservados</p>
              <div className="flex justify-center mt-4">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-KSAVnVrLk1AvbhF07h55u42sGHYCX4.png"
                  alt="Site Seguro"
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary (Desktop Only) */}
          <div className="hidden lg:block lg:order-2">
            <div className="bg-white p-6 rounded-lg border sticky top-8">
              <OrderSummaryContent
                quantity={quantity}
                setQuantity={setQuantity}
                shippingMethod={shippingMethod}
                addressFound={addressFound}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  )
}
