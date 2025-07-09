import { type NextRequest, NextResponse } from "next/server"

// Define Appmax Order Response
interface AppmaxOrderResponse {
  success: boolean
  data: {
    id: string
    pix_qrcode: string | null
    pix_emv: string | null
    pix_payment_link: string | null
  }
  message?: string
  errors?: any
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID é obrigatório",
        },
        { status: 400 },
      )
    }

    // Check if Appmax access token is configured
    const appmaxToken = process.env.APPMAX_ACCESS_TOKEN
    if (!appmaxToken) {
      console.error("APPMAX_ACCESS_TOKEN não configurada no ambiente")
      return NextResponse.json(
        {
          success: false,
          error: "Token da Appmax não configurado",
        },
        { status: 500 },
      )
    }

    console.log(`=== CONSULTANDO STATUS PIX - ORDER ID: ${orderId} ===`)

    // Make request to Appmax API with error handling
    let appmaxResponse: Response
    let appmaxData: AppmaxOrderResponse

    try {
      appmaxResponse = await fetch(`https://admin.appmax.com.br/api/v3/order/${orderId}`, {
        method: "GET",
        headers: {
          "access-token": appmaxToken,
        },
      })

      // Check if response is valid JSON
      const responseText = await appmaxResponse.text()

      try {
        appmaxData = JSON.parse(responseText)
      } catch (jsonError) {
        console.error("=== ERRO JSON INVÁLIDO DA APPMAX ===")
        console.error("Response Text:", responseText)
        console.error("JSON Error:", jsonError)

        return NextResponse.json(
          {
            success: false,
            error: "Resposta inválida da Appmax",
            details: "JSON inválido retornado pela API",
          },
          { status: 500 },
        )
      }
    } catch (networkError) {
      console.error("=== ERRO DE REDE NA CONSULTA ===")
      console.error("Network Error:", networkError)

      return NextResponse.json(
        {
          success: false,
          error: "Erro de conexão com a Appmax",
          details: "Não foi possível conectar com a API da Appmax",
        },
        { status: 500 },
      )
    }

    console.log("=== RESPOSTA CONSULTA STATUS PIX ===")
    console.log("Status:", appmaxResponse.status)
    console.log("Response Data:", JSON.stringify(appmaxData, null, 2))

    // Handle specific HTTP status codes
    if (appmaxResponse.status === 429) {
      console.error("=== RATE LIMIT ATINGIDO (429) ===")
      return NextResponse.json(
        {
          success: false,
          error: "Muitas requisições",
          details: "Aguarde alguns segundos e tente novamente",
        },
        { status: 429 },
      )
    }

    if (!appmaxResponse.ok) {
      console.error("=== ERRO NA CONSULTA DO PEDIDO ===")
      console.error("Status Code:", appmaxResponse.status)
      console.error("Response Body:", appmaxData)

      return NextResponse.json(
        {
          success: false,
          error: "Erro ao consultar pedido",
          details: appmaxData.message || appmaxData.errors || "Erro desconhecido da Appmax",
          status_code: appmaxResponse.status,
        },
        { status: 500 },
      )
    }

    if (!appmaxData.success || !appmaxData.data) {
      console.error("=== DADOS DO PEDIDO NÃO ENCONTRADOS ===")
      return NextResponse.json(
        {
          success: false,
          error: "Dados do pedido não encontrados",
          details: "Pedido não existe ou não foi processado",
        },
        { status: 404 },
      )
    }

    const { pix_qrcode, pix_emv, pix_payment_link } = appmaxData.data

    // Check if PIX data is available
    if (!pix_qrcode || !pix_emv) {
      console.log("=== PIX AINDA NÃO DISPONÍVEL ===")
      console.log("pix_qrcode:", pix_qrcode ? "✅ Presente" : "❌ Null")
      console.log("pix_emv:", pix_emv ? "✅ Presente" : "❌ Null")

      return NextResponse.json(
        {
          success: false,
          error: "PIX ainda está sendo gerado",
          details: "Aguarde alguns segundos e tente novamente",
          orderId: orderId,
        },
        { status: 202 },
      )
    }

    console.log("✅ DADOS PIX DISPONÍVEIS!")

    // Return PIX data in the specified format
    return NextResponse.json({
      success: true,
      qrcode: pix_qrcode,
      copiacola: pix_emv, // Renomeado conforme solicitado
      amount: 1887, // Valor fixo em centavos (R$ 18,87)
      orderId: orderId,
      pix_payment_link: pix_payment_link || null,
      message: "Dados PIX disponíveis",
    })
  } catch (error) {
    console.error("=== ERRO GERAL NO PIX-STATUS ===")
    console.error("Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Método não permitido. Use GET.",
    },
    { status: 405 },
  )
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: "Método não permitido. Use GET.",
    },
    { status: 405 },
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "Método não permitido. Use GET.",
    },
    { status: 405 },
  )
}
