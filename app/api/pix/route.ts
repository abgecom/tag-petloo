import { type NextRequest, NextResponse } from "next/server"

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
  // 🎯 NOVOS CAMPOS DO PRODUTO
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

    // 🔧 CORREÇÃO: Expandir lista de valores válidos para incluir todos os cenários possíveis
    const validAmounts = [
      1887, // R$ 18,87 - Frete básico
      2939, // R$ 29,39 - Frete expresso
      3929, // R$ 39,29 - 2 tags genéricas (29,39 + 9,90)
      3960, // R$ 39,60 - 5 tags genéricas (4 x 9,90 = frete grátis)
      4919, // R$ 49,19 - 3 tags genéricas (29,39 + 19,80)
      4950, // R$ 49,50 - 6 tags genéricas (5 x 9,90 = frete grátis)
      4990, // R$ 49,90 - 1 tag personalizada
      5909, // R$ 59,09 - 4 tags genéricas (29,39 + 29,70)
      5940, // R$ 59,40 - 7 tags genéricas (6 x 9,90 = frete grátis)
      5980, // R$ 59,80 - 2 tags personalizadas (49,90 + 9,90)
      6042, // R$ 60,42 - Valor antigo (manter compatibilidade)
      6930, // R$ 69,30 - 8 tags genéricas (7 x 9,90 = frete grátis)
      6970, // R$ 69,70 - 3 tags personalizadas (49,90 + 9,90 + 9,90)
      7920, // R$ 79,20 - 9 tags genéricas (8 x 9,90 = frete grátis)
      7960, // R$ 79,60 - 4 tags personalizadas (49,90 + 9,90 + 9,90 + 9,90)
      8910, // R$ 89,10 - 10 tags genéricas (9 x 9,90 = frete grátis)
      8950, // R$ 89,50 - 5 tags personalizadas
      9940, // R$ 99,40 - 6 tags personalizadas
      10930, // R$ 109,30 - 7 tags personalizadas
      11920, // R$ 119,20 - 8 tags personalizadas
      12910, // R$ 129,10 - 9 tags personalizadas
      13900, // R$ 139,00 - 10 tags personalizadas
      // Adicionar valores com frete expresso (+1052 centavos = +R$ 10,52)
      6042, // R$ 60,42 - 1 tag + frete expresso (4990 + 1052)
      7032, // R$ 70,32 - 2 tags + frete expresso (5980 + 1052)
      8022, // R$ 80,22 - 3 tags + frete expresso (6970 + 1052)
    ]

    // Validar valor do PIX
    if (!validAmounts.includes(body.shipping_price)) {
      console.error("❌ Valor PIX inválido recebido:", body.shipping_price)
      console.error("💡 Valores válidos:", validAmounts)
      return NextResponse.json(
        {
          error: `Valor inválido: R$ ${(body.shipping_price / 100).toFixed(2)}. Entre em contato com o suporte.`,
          received_value: body.shipping_price,
          valid_values: validAmounts,
        },
        { status: 400 },
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    console.log("💰 Valor PIX:", body.shipping_price, "centavos =", (body.shipping_price / 100).toFixed(2), "reais")

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
    console.log("=== CRIANDO CLIENTE NO APPMAX ===")
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

    console.log("📤 Dados do cliente:", JSON.stringify(customerData, null, 2))

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
    console.log("✅ Cliente criado:", JSON.stringify(customerResult, null, 2))

    if (!customerResult.success || !customerResult.data?.id) {
      throw new Error("Falha ao criar cliente no Appmax")
    }

    const customerId = customerResult.data.id

    // 🔧 CORREÇÃO CRÍTICA: Appmax espera preço em REAIS, não centavos
    const totalAmount = body.shipping_price // Valor total em centavos
    const quantity = body.product_quantity || 1

    // 🚨 CORREÇÃO DECIMAL: Converter centavos para reais com 2 casas decimais
    const totalAmountInReais = totalAmount / 100 // Converter centavos para reais
    const unitPriceInReais = Number((totalAmountInReais / quantity).toFixed(2)) // Preço unitário em reais

    console.log("🔧 CORREÇÃO DECIMAL:")
    console.log("Total em centavos:", totalAmount)
    console.log("Total em reais:", totalAmountInReais)
    console.log("Quantidade:", quantity)
    console.log("Preço unitário em reais:", unitPriceInReais)

    // 2. Criar pedido no Appmax
    console.log("=== CRIANDO PEDIDO NO APPMAX ===")
    let orderData: any
    orderData = {
      customer_id: customerId,
      products: [
        {
          name: body.product_type || "Tag rastreamento Petloo + App",
          sku: body.product_sku || "TAG-APP",
          qty: quantity,
          price: unitPriceInReais, // 🔧 USAR PREÇO EM REAIS COM DECIMAIS
        },
      ],
    }

    console.log("📤 Dados do pedido:", JSON.stringify(orderData, null, 2))

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
    console.log("✅ Pedido criado:", JSON.stringify(orderResult, null, 2))

    if (!orderResult.success || !orderResult.data?.id) {
      throw new Error("Falha ao criar pedido no Appmax")
    }

    const orderId = orderResult.data.id
    const orderTotal = orderResult.data.total

    // 🔧 VERIFICAR SE O TOTAL DO PEDIDO ESTÁ CORRETO
    // Appmax retorna o total em REAIS, não centavos
    const orderTotalInCentavos = Math.round(orderTotal * 100) // Converter reais para centavos

    console.log("🔍 VERIFICAÇÃO DO TOTAL:")
    console.log("Total esperado:", totalAmount, "centavos (R$", (totalAmount / 100).toFixed(2), ")")
    console.log("Total do pedido Appmax:", orderTotal, "reais (", orderTotalInCentavos, "centavos)")
    console.log("Diferença:", Math.abs(orderTotalInCentavos - totalAmount), "centavos")

    // Se a diferença for muito grande, cancelar
    if (Math.abs(orderTotalInCentavos - totalAmount) > 100) {
      // Tolerância de R$ 1,00
      console.error("❌ TOTAL DO PEDIDO INCORRETO!")
      console.error("Esperado:", totalAmount, "centavos")
      console.error("Recebido:", orderTotalInCentavos, "centavos")
      throw new Error(
        `Valor do pedido incorreto. Esperado: R$ ${(totalAmount / 100).toFixed(2)}, Calculado: R$ ${orderTotal.toFixed(2)}`,
      )
    }

    // 3. Gerar pagamento PIX
    console.log("=== GERANDO PAGAMENTO PIX ===")
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

    console.log("📤 Dados do pagamento PIX:", JSON.stringify(pixPaymentData, null, 2))

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
    console.log("✅ PIX gerado:", JSON.stringify(pixResult, null, 2))

    // 🔧 CORREÇÃO: Appmax retorna success como string "ATIVA" em vez de boolean true
    const isPixSuccess = pixResult.success === "ATIVA" || pixResult.success === true
    const hasPixData = pixResult.data && (pixResult.data.pix_qrcode || pixResult.data.pix_emv)

    if (!isPixSuccess || !hasPixData) {
      console.error("❌ Dados PIX inválidos:", {
        success: pixResult.success,
        hasData: !!pixResult.data,
        hasQrCode: !!pixResult.data?.pix_qrcode,
        hasEmv: !!pixResult.data?.pix_emv,
      })
      throw new Error("Falha ao gerar PIX no Appmax - dados incompletos")
    }

    // Extrair dados PIX da resposta
    const pixData = pixResult.data
    const qrCodeBase64 = pixData.pix_qrcode
    const pixEmv = pixData.pix_emv
    const expirationDate = pixData.pix_expiration_date

    console.log("🎯 Dados PIX extraídos:", {
      hasQrCode: !!qrCodeBase64,
      hasEmv: !!pixEmv,
      expirationDate: expirationDate,
    })

    // Salvar dados na planilha Google via Make.com
    try {
      const orderDataForSheets = {
        order_id: orderId,
        customer_id: customerId,
        customer_name: body.name,
        customer_email: body.email,
        customer_phone: body.phone,
        customer_cpf: body.cpf,
        customer_address: `${body.address.street}, ${body.address.number}${body.address.complement ? `, ${body.address.complement}` : ""}, ${body.address.district}`,
        customer_cep: body.address.cep,
        customer_city: body.address.city,
        customer_state: body.address.state,
        order_amount: body.shipping_price / 100, // Converter centavos para reais
        payment_method: "PIX",
        order_status: "Aguardando Pagamento",
        // 🎯 USAR DADOS REAIS DO PRODUTO
        product_type: body.product_type,
        product_color: body.product_color,
        product_quantity: body.product_quantity,
        product_sku: body.product_sku,
        pet_name: body.pet_name || "",
        // 💰 DADOS PIX
        pix_code: pixEmv,
        pix_qr_code: qrCodeBase64,
        pix_expiration_date: expirationDate,
      }

      console.log("=== ENVIANDO DADOS PARA MAKE.COM ===")
      console.log("Dados:", JSON.stringify(orderDataForSheets, null, 2))

      // Enviar para Make.com (não aguardar resposta para não bloquear)
      fetch("https://hook.us2.make.com/qkwwr3qvpgkkobinbd28lzsq0k51tt6k", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderDataForSheets),
      })
        .then((response) => {
          console.log("📡 Resposta do Make.com:", response.status)
          return response.text()
        })
        .then((data) => {
          console.log("✅ Dados enviados para Make.com com sucesso!")
        })
        .catch((error) => {
          console.warn("⚠️ Erro ao enviar para Make.com (não crítico):", error)
        })
    } catch (error) {
      console.warn("⚠️ Erro ao preparar dados para planilha:", error)
    }

    // Retornar dados PIX para o frontend
    return NextResponse.json({
      success: true,
      order_id: orderId,
      customer_id: customerId,
      amount: body.shipping_price, // Manter o valor original solicitado
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
