import { type NextRequest, NextResponse } from "next/server"

// Define the request body interface
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
  shipping_price: number // Value in cents: 1887 or 2990
}

// Define Appmax Customer Creation Response
interface AppmaxCustomerResponse {
  success: boolean
  data: {
    id: number
    firstname: string
    lastname: string
    email: string
  }
}

// Define Appmax Order Response
interface AppmaxOrderResponse {
  success: boolean
  data: {
    id: string
    customer_id: number
    total: number
    status: string
  }
}

// Define Appmax PIX Payment Response
interface AppmaxPixResponse {
  success: boolean
  data: {
    pix_qrcode: string
    pix_emv: string
    pix_expiration_date: string
    order_id: string
  }
}

// Função para determinar o tipo e cor do produto
function getProductInfo(shippingPrice: number) {
  switch (shippingPrice) {
    case 1887: // R$ 18,87 - Frete padrão
      return {
        type: "Tag Genérica",
        color: "Não se aplica",
        name: "Tag rastreamento Petloo + App (Frete Padrão)",
        sku: "TAG-APP-1887",
      }
    case 2939: // R$ 29,39 - Frete expresso
      return {
        type: "Tag Genérica",
        color: "Não se aplica",
        name: "Tag rastreamento Petloo + App (Frete Expresso)",
        sku: "TAG-APP-2939",
      }
    case 3990: // R$ 39,90 - Tag personalizada frete grátis
      return {
        type: "Tag Personalizada",
        color: "A definir", // Será atualizado depois
        name: "Tag Personalizada + App (Frete Grátis)",
        sku: "TAG-PERSONALIZADA-FREE-3990",
      }
    case 5042: // R$ 50,42 - Tag personalizada frete expresso
      return {
        type: "Tag Personalizada",
        color: "A definir", // Será atualizado depois
        name: "Tag Personalizada + App (Frete Expresso)",
        sku: "TAG-PERSONALIZADA-EXPRESS-5042",
      }
    default:
      return {
        type: "Produto Desconhecido",
        color: "Não se aplica",
        name: "Produto não identificado",
        sku: `UNKNOWN-${shippingPrice}`,
      }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: PixRequestBody = await request.json()

    // Validate required fields
    const requiredFields = ["name", "email", "cpf", "phone", "address", "shipping_price"]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Campo obrigatório ausente: ${field}` }, { status: 400 })
      }
    }

    // Validate address fields
    const requiredAddressFields = ["cep", "street", "number", "district", "city", "state"]
    for (const field of requiredAddressFields) {
      if (!body.address[field]) {
        return NextResponse.json({ error: `Campo de endereço obrigatório ausente: ${field}` }, { status: 400 })
      }
    }

    // Validate shipping price
    if (![1887, 2939, 3990, 5042].includes(body.shipping_price)) {
      return NextResponse.json(
        { error: "Valor inválido. Deve ser 1887, 2939, 3990 ou 5042 centavos." },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    // Validate CPF format (basic validation)
    const cleanCPF = body.cpf.replace(/\D/g, "")
    if (cleanCPF.length !== 11) {
      return NextResponse.json({ error: "CPF deve ter 11 dígitos" }, { status: 400 })
    }

    // Validate phone format
    const cleanPhone = body.phone.replace(/\D/g, "")
    if (cleanPhone.length !== 11) {
      return NextResponse.json({ error: "Telefone deve ter 11 dígitos (DDD + número)" }, { status: 400 })
    }

    // Log detalhado dos dados recebidos
    console.log("=== DADOS COMPLETOS RECEBIDOS NA API ===")
    console.log("Nome:", body.name)
    console.log("Email:", body.email)
    console.log("CPF:", body.cpf)
    console.log("Telefone:", body.phone)
    console.log("Endereço completo:", JSON.stringify(body.address, null, 2))
    console.log("Valor do frete:", body.shipping_price)

    // Check if Appmax access token is configured
    const appmaxToken = process.env.APPMAX_ACCESS_TOKEN
    if (!appmaxToken) {
      console.error("APPMAX_ACCESS_TOKEN não configurada no ambiente")
      return NextResponse.json({ error: "Token da Appmax não configurado" }, { status: 500 })
    }

    console.log("=== INICIANDO FLUXO PIX APPMAX ===")
    console.log("Token configurado:", appmaxToken ? "✅ Sim" : "❌ Não")

    // Convert shipping price from cents to decimal
    const productPrice = body.shipping_price / 100 // Valor em formato decimal

    // Obter informações do produto
    const productInfo = getProductInfo(body.shipping_price)

    // Tentar obter cor específica do sessionStorage se for produto personalizado
    if (typeof window !== "undefined" && (body.shipping_price === 3990 || body.shipping_price === 5042)) {
      try {
        const personalizedData = sessionStorage.getItem("personalizedProduct")
        if (personalizedData) {
          const data = JSON.parse(personalizedData)
          if (data.color) {
            productInfo.color = data.color === "orange" ? "Laranja" : data.color === "purple" ? "Roxa" : data.color
            productInfo.sku = `TAG-PERSONALIZADA-${data.color.toUpperCase()}-${body.shipping_price === 3990 ? "FREE" : "EXPRESS"}`
          }
        }
      } catch (error) {
        console.warn("Não foi possível obter cor do produto personalizado:", error)
      }
    }

    // Split name into firstname and lastname
    const [firstname, ...rest] = body.name.split(" ")
    const lastname = rest.join(" ") || "-"

    // Step 1: Create customer first
    const customerPayload = {
      firstname: firstname,
      lastname: lastname,
      email: body.email,
      document: cleanCPF,
      telephone: cleanPhone,
    }

    console.log("=== STEP 1: CRIANDO CLIENTE NA APPMAX ===")
    console.log("Customer Payload:", JSON.stringify(customerPayload, null, 2))

    const customerResponse = await fetch("https://admin.appmax.com.br/api/v3/customer", {
      method: "POST",
      headers: {
        "access-token": appmaxToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customerPayload),
    })

    const customerData: AppmaxCustomerResponse = await customerResponse.json()

    console.log("=== RESPOSTA CRIAÇÃO CLIENTE ===")
    console.log("Status:", customerResponse.status)
    console.log("Customer Data:", JSON.stringify(customerData, null, 2))

    if (!customerResponse.ok) {
      console.error("=== ERRO NA CRIAÇÃO DO CLIENTE ===")
      console.error("Status Code:", customerResponse.status)
      console.error("Response Body:", customerData)

      return NextResponse.json(
        {
          error: "Erro ao criar cliente",
          details: customerData.message || customerData.errors || "Erro desconhecido da Appmax",
          status_code: customerResponse.status,
          appmax_error: customerData,
        },
        { status: 500 },
      )
    }

    // Extract customer ID from the correct path
    const customerId = customerData.data?.id
    if (!customerId) {
      console.error("Customer ID não encontrado na resposta:", customerData)
      return NextResponse.json(
        {
          error: "Erro ao obter ID do cliente",
        },
        { status: 500 },
      )
    }

    console.log("✅ Cliente criado com sucesso! ID:", customerId)

    // Step 1.5: Update customer with address
    console.log("=== STEP 1.5: ATUALIZANDO CLIENTE COM ENDEREÇO ===")

    const customerUpdatePayload = {
      firstname: firstname,
      lastname: lastname,
      email: body.email,
      document: cleanCPF,
      telephone: cleanPhone,
      postcode: body.address.cep.replace(/\D/g, ""),
      address_street: body.address.street,
      address_street_number: body.address.number,
      address_street_complement: body.address.complement || "",
      address_street_district: body.address.district,
      address_city: body.address.city,
      address_state: body.address.state,
    }

    console.log("Customer Update Payload:", JSON.stringify(customerUpdatePayload, null, 2))

    const customerUpdateResponse = await fetch(`https://admin.appmax.com.br/api/v3/customer/${customerId}`, {
      method: "PUT",
      headers: {
        "access-token": appmaxToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customerUpdatePayload),
    })

    const customerUpdateData = await customerUpdateResponse.json()

    console.log("=== RESPOSTA ATUALIZAÇÃO CLIENTE ===")
    console.log("Status:", customerUpdateResponse.status)
    console.log("Customer Update Data:", JSON.stringify(customerUpdateData, null, 2))

    if (!customerUpdateResponse.ok) {
      console.warn("⚠️ Falha ao atualizar endereço do cliente, mas continuando...")
      console.warn("Status Code:", customerUpdateResponse.status)
      console.warn("Response Body:", customerUpdateData)
    } else {
      console.log("✅ Endereço do cliente atualizado com sucesso!")
    }

    // Step 2: Create order
    const orderPayload = {
      customer_id: customerId.toString(),
      products: [
        {
          name: productInfo.name,
          sku: productInfo.sku,
          qty: 1,
          price: productPrice,
        },
      ],
    }

    console.log("=== STEP 2: CRIANDO PEDIDO NA APPMAX ===")
    console.log("Order Payload:", JSON.stringify(orderPayload, null, 2))

    const orderResponse = await fetch("https://admin.appmax.com.br/api/v3/order", {
      method: "POST",
      headers: {
        "access-token": appmaxToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    })

    const orderData: AppmaxOrderResponse = await orderResponse.json()

    console.log("=== RESPOSTA CRIAÇÃO PEDIDO ===")
    console.log("Status:", orderResponse.status)
    console.log("Order Data:", JSON.stringify(orderData, null, 2))

    if (!orderResponse.ok) {
      console.error("=== ERRO NA CRIAÇÃO DO PEDIDO ===")
      console.error("Status Code:", orderResponse.status)
      console.error("Response Body:", orderData)

      return NextResponse.json(
        {
          error: "Erro ao criar pedido",
          details: orderData.message || orderData.errors || "Erro desconhecido da Appmax",
          status_code: orderResponse.status,
          appmax_error: orderData,
        },
        { status: 500 },
      )
    }

    // Extract order ID from response
    const orderId = orderData.data?.id
    if (!orderId) {
      console.error("Order ID não encontrado na resposta:", orderData)
      return NextResponse.json(
        {
          error: "Erro ao obter ID do pedido",
          details: "ID do pedido não foi retornado pela Appmax",
        },
        { status: 500 },
      )
    }

    console.log("✅ Pedido criado com sucesso! ID:", orderId)

    // Step 3: Generate PIX payment
    const pixPayload = {
      cart: {
        order_id: orderId,
        products: [], // Array vazio conforme especificado
      },
      customer: {
        firstname: firstname,
        lastname: lastname,
        email: body.email,
        telephone: cleanPhone,
        postcode: body.address.cep.replace(/\D/g, ""),
        address_street: body.address.street,
        address_street_number: body.address.number,
        address_street_district: body.address.district,
        address_city: body.address.city,
        address_state: body.address.state,
      },
      payment: {
        pix: {
          document_number: cleanCPF,
        },
      },
    }

    console.log("=== STEP 3: GERANDO PAGAMENTO PIX ===")
    console.log("PIX Payload:", JSON.stringify(pixPayload, null, 2))

    const pixResponse = await fetch("https://admin.appmax.com.br/api/v3/payment/pix", {
      method: "POST",
      headers: {
        "access-token": appmaxToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pixPayload),
    })

    const pixData: AppmaxPixResponse = await pixResponse.json()

    console.log("=== RESPOSTA GERAÇÃO PIX ===")
    console.log("Status:", pixResponse.status)
    console.log("PIX Data:", JSON.stringify(pixData, null, 2))

    if (!pixResponse.ok) {
      console.error("=== ERRO NA GERAÇÃO DO PIX ===")
      console.error("Status Code:", pixResponse.status)
      console.error("Response Body:", pixData)

      return NextResponse.json(
        {
          error: "Erro ao gerar pagamento via PIX. Tente novamente.",
          details: pixData.message || pixData.errors || "Erro desconhecido da Appmax",
          status_code: pixResponse.status,
          appmax_error: pixData,
        },
        { status: 500 },
      )
    }

    // Verificar se os dados PIX foram retornados
    if (!pixData.success || !pixData.data) {
      console.error("=== DADOS PIX NÃO RETORNADOS ===")
      console.error("PIX Response:", pixData)

      return NextResponse.json(
        {
          error: "Erro ao gerar pagamento via PIX. Tente novamente.",
          details: "Dados do PIX não foram retornados pela Appmax",
        },
        { status: 500 },
      )
    }

    const { pix_qrcode, pix_emv, pix_expiration_date } = pixData.data

    if (!pix_qrcode || !pix_emv) {
      console.error("=== DADOS PIX INCOMPLETOS ===")
      console.error("QR Code:", pix_qrcode ? "✅ Presente" : "❌ Ausente")
      console.error("EMV:", pix_emv ? "✅ Presente" : "❌ Ausente")

      return NextResponse.json(
        {
          error: "Erro ao gerar pagamento via PIX. Tente novamente.",
          details: "Dados do PIX estão incompletos",
        },
        { status: 500 },
      )
    }

    console.log("✅ PIX gerado com sucesso!")
    console.log("QR Code:", pix_qrcode ? "✅ Presente" : "❌ Ausente")
    console.log("EMV (Copia e Cola):", pix_emv ? "✅ Presente" : "❌ Ausente")
    console.log("Expiração:", pix_expiration_date || "Não informado")

    // Salvar dados na planilha Google via Make.com
    try {
      const orderDataForSheets = {
        order_id: orderId.toString(),
        customer_name: body.name,
        customer_email: body.email,
        customer_phone: body.phone,
        customer_cpf: cleanCPF,
        customer_address: `${body.address.street}, ${body.address.number}${body.address.complement ? `, ${body.address.complement}` : ""}, ${body.address.district}`,
        customer_cep: body.address.cep,
        customer_city: body.address.city,
        customer_state: body.address.state,
        order_amount: productPrice,
        payment_method: "PIX",
        order_status: "Pendente",
        // Novos campos do produto
        product_type: productInfo.type,
        product_color: productInfo.color,
        product_quantity: 1,
        product_sku: productInfo.sku,
      }

      // Enviar para API de planilha (não aguardar resposta para não atrasar o PIX)
      fetch(`${request.url.replace("/api/pix", "/api/save-to-sheets")}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderDataForSheets),
      }).catch((error) => {
        console.warn("⚠️ Erro ao salvar na planilha (não crítico):", error)
      })

      console.log("📊 Dados enviados para planilha Google")
    } catch (error) {
      console.warn("⚠️ Erro ao preparar dados para planilha:", error)
    }

    // Return success response with PIX data
    return NextResponse.json({
      success: true,
      order_id: orderId,
      customer_id: customerId,
      amount: body.shipping_price, // Valor dinâmico em centavos
      qrcode: pix_qrcode,
      copiacola: pix_emv,
      expiration_date: pix_expiration_date,
      message: "PIX gerado com sucesso. Redirecionando para pagamento.",
    })
  } catch (error) {
    console.error("=== ERRO GERAL NO PROCESSAMENTO PIX ===")
    console.error("Error:", error)

    // Handle network or parsing errors
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Método não permitido. Use POST." }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: "Método não permitido. Use POST." }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Método não permitido. Use POST." }, { status: 405 })
}
