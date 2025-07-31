import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

interface PixRequestBody {
  name: string
  email: string
  cpf: string
  phone: string
  address: {
    cep: string
    street: string
    number: string
    complement?: string
    district: string
    city: string
    state: string
  }
  shipping_price: number // Valor em centavos
  product_type: string
  product_color: string
  product_quantity: number
  product_sku: string
  pet_name?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PixRequestBody = await request.json()

    console.log("=== DADOS RECEBIDOS NA API PIX ===")
    console.log("📦 Dados completos:", JSON.stringify(body, null, 2))

    // Validar campos obrigatórios
    const requiredFields = ["name", "email", "cpf", "phone", "shipping_price"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Campo obrigatório ausente: ${field}` }, { status: 400 })
      }
    }

    const validAmounts = [
      1887, 2939, 3929, 3960, 4919, 4950, 4990, 5909, 5940, 5980, 6042, 6930, 6970, 7920, 7960, 8910, 8950, 9940, 10930,
      11920, 12910, 13900, 6042, 7032, 8022,
    ]

    // Validar valor do PIX
    if (!validAmounts.includes(body.shipping_price)) {
      console.error("❌ Valor PIX inválido recebido:", body.shipping_price)
      return NextResponse.json(
        {
          error: `Valor inválido: R$ ${(body.shipping_price / 100).toFixed(2)}. Entre em contato com o suporte.`,
          received_value: body.shipping_price,
          valid_values: validAmounts,
        },
        { status: 400 },
      )
    }

    const accessToken = process.env.APPMAX_ACCESS_TOKEN
    if (!accessToken) {
      console.error("❌ APPMAX_ACCESS_TOKEN não configurado")
      return NextResponse.json({ error: "Configuração de pagamento não encontrada" }, { status: 500 })
    }

    // Dividir nome em primeiro e último nome
    const nameParts = body.name.trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    // 1. Criar cliente no Appmax
    const customerData = {
      firstname: firstName,
      lastname: lastName,
      email: body.email,
      document: body.cpf.replace(/\D/g, ""),
      zipcode: body.address.cep.replace(/\D/g, ""),
      address: body.address.street,
      number: body.address.number,
      neighborhood: body.address.district,
      city: body.address.city,
      state: body.address.state,
      telephone: body.phone.replace(/\D/g, ""),
    }

    const customerResponse = await fetch("https://admin.appmax.com.br/api/v3/customer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access-token": accessToken,
      },
      body: JSON.stringify(customerData),
    })

    if (!customerResponse.ok) {
      const errorText = await customerResponse.text()
      console.error("❌ Erro ao criar cliente:", errorText)
      throw new Error(`Erro ao criar cliente: ${customerResponse.status} - ${errorText}`)
    }

    const customerResult = await customerResponse.json()
    if (!customerResult.success || !customerResult.data?.id) {
      throw new Error("Falha ao criar cliente no Appmax")
    }

    const customerId = customerResult.data.id
    const totalAmount = body.shipping_price
    const quantity = body.product_quantity || 1
    const totalAmountInReais = totalAmount / 100
    const unitPriceInReais = Number((totalAmountInReais / quantity).toFixed(2))

    // 2. Criar pedido no Appmax
    const orderData = {
      customer_id: customerId,
      products: [
        {
          name: body.product_type || "Tag rastreamento Petloo + App",
          sku: body.product_sku || "TAG-APP",
          qty: quantity,
          price: unitPriceInReais,
        },
      ],
    }

    const orderResponse = await fetch("https://admin.appmax.com.br/api/v3/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access-token": accessToken,
      },
      body: JSON.stringify(orderData),
    })

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      console.error("❌ Erro ao criar pedido:", errorText)
      throw new Error(`Erro ao criar pedido: ${orderResponse.status} - ${errorText}`)
    }

    const orderResult = await orderResponse.json()
    if (!orderResult.success || !orderResult.data?.id) {
      throw new Error("Falha ao criar pedido no Appmax")
    }

    const orderId = orderResult.data.id

    // 3. Gerar pagamento PIX
    const pixPaymentData = {
      cart: {
        order_id: orderId,
        products: [],
      },
      customer: {
        firstname: firstName,
        lastname: lastName,
        email: body.email,
        telephone: body.phone.replace(/\D/g, ""),
        postcode: body.address.cep.replace(/\D/g, ""),
        address_street: body.address.street,
        address_street_number: body.address.number,
        address_street_district: body.address.district,
        address_city: body.address.city,
        address_state: body.address.state,
      },
      payment: {
        pix: {
          document_number: body.cpf.replace(/\D/g, ""),
        },
      },
    }

    const pixResponse = await fetch("https://admin.appmax.com.br/api/v3/payment/pix", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access-token": accessToken,
      },
      body: JSON.stringify(pixPaymentData),
    })

    if (!pixResponse.ok) {
      const errorText = await pixResponse.text()
      console.error("❌ Erro ao gerar PIX:", errorText)
      throw new Error(`Erro ao gerar PIX: ${pixResponse.status} - ${errorText}`)
    }

    const pixResult = await pixResponse.json()
    const isPixSuccess = pixResult.success === "ATIVA" || pixResult.success === true
    const hasPixData = pixResult.data && (pixResult.data.pix_qrcode || pixResult.data.pix_emv)

    if (!isPixSuccess || !hasPixData) {
      throw new Error("Falha ao gerar PIX no Appmax - dados incompletos")
    }

    const pixData = pixResult.data
    const qrCodeBase64 = pixData.pix_qrcode
    const pixEmv = pixData.pix_emv
    const expirationDate = pixData.pix_expiration_date

    // 4. Salvar pedido no Supabase DIRETAMENTE (sem fetch interno)
    try {
      const supabaseOrderData = {
        order_id: orderId.toString(),
        customer_id: customerId.toString(),
        customer_name: body.name,
        customer_email: body.email,
        customer_phone: body.phone,
        customer_cpf: body.cpf,
        customer_address: `${body.address.street}, ${body.address.number}${body.address.complement ? `, ${body.address.complement}` : ""}, ${body.address.district}`,
        customer_cep: body.address.cep,
        customer_city: body.address.city,
        customer_state: body.address.state,
        order_amount: body.shipping_price,
        payment_method: "pix" as const,
        order_status: "pending" as const,
        product_type: body.product_type,
        product_color: body.product_color,
        product_quantity: body.product_quantity,
        product_sku: body.product_sku,
        pet_name: body.pet_name || null,
        pix_code: pixEmv,
      }

      console.log("=== SALVANDO NO SUPABASE DIRETAMENTE ===")
      console.log("Dados:", JSON.stringify(supabaseOrderData, null, 2))

      const { data, error } = await supabase.from("orders").insert([supabaseOrderData]).select()

      if (error) {
        console.error("❌ Erro ao inserir no Supabase:", error)
      } else {
        console.log("✅ Pedido salvo no Supabase com sucesso!", data)
      }
    } catch (error) {
      console.error("❌ Erro ao salvar no Supabase:", error)
    }

    // Salvar dados nos webhooks do Make.com
    try {
      const orderDataForSheets = {
        order_id: orderId,
        customer_id: customerId,
        customer_name: body.name,
        customer_email: body.email,
        customer_phone: body.phone,
        customer_cpf: body.cpf,
        customer_address: `${body.address.street},${body.address.complement ? `, ${body.address.complement}` : ""}, ${body.address.district}`,
        customer_number: body.address.number
        customer_complement: body.address.complement
        customer_cep: body.address.cep,
        customer_city: body.address.city,
        customer_state: body.address.state,
        order_amount: body.shipping_price / 100,
        payment_method: "PIX",
        order_status: "Aguardando Pagamento",
        product_type: body.product_type,
        product_color: body.product_color,
        product_quantity: body.product_quantity,
        product_sku: body.product_sku,
        pet_name: body.pet_name || "",
        pix_code: pixEmv,
        pix_qr_code: qrCodeBase64,
        pix_expiration_date: expirationDate || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }

      // Webhooks existentes
      fetch("https://hook.us2.make.com/qkwwr3qvpgkkobinbd28lzsq0k51tt6k", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderDataForSheets),
      }).catch(console.warn)

      fetch("https://hook.us2.make.com/uurnp4dlhggj07fwxhbuiqxbpms8c5k1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderDataForSheets),
      }).catch(console.warn)
    } catch (error) {
      console.warn("⚠️ Erro ao preparar dados para webhooks:", error)
    }

    return NextResponse.json({
      success: true,
      order_id: orderId.toString(),
      customer_id: customerId,
      amount: body.shipping_price,
      qrcode: qrCodeBase64,
      copiacola: pixEmv,
      expiration_date: expirationDate || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      message: "PIX gerado com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro na API PIX:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
