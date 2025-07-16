import { type NextRequest, NextResponse } from "next/server"

// Mock data for common CEPs (for development/preview environments)
const MOCK_CEP_DATA: Record<string, any> = {
  "01310-100": {
    cep: "01310-100",
    logradouro: "Avenida Paulista",
    bairro: "Bela Vista",
    localidade: "São Paulo",
    uf: "SP",
  },
  "20040-020": {
    cep: "20040-020",
    logradouro: "Rua da Assembleia",
    bairro: "Centro",
    localidade: "Rio de Janeiro",
    uf: "RJ",
  },
  "30112-000": {
    cep: "30112-000",
    logradouro: "Rua da Bahia",
    bairro: "Centro",
    localidade: "Belo Horizonte",
    uf: "MG",
  },
  "29101-200": {
    cep: "29101-200",
    logradouro: "Rua Henrique Moscoso",
    bairro: "Praia da Costa",
    localidade: "Vila Velha",
    uf: "ES",
  },
}

// Function to check if we're in a development/preview environment
function isDevelopmentEnvironment(): boolean {
  const hostname = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "localhost"
  return (
    hostname.includes("localhost") ||
    hostname.includes("preview") ||
    hostname.includes("vusercontent.net") ||
    process.env.NODE_ENV === "development"
  )
}

// API providers for CEP lookup
interface CEPProvider {
  name: string
  url: (cep: string) => string
  headers: Record<string, string>
  parseResponse: (data: any) => any | null
  timeout: number
}

const CEP_PROVIDERS: CEPProvider[] = [
  // 1. BrasilAPI (API governamental gratuita) - MOVIDA PARA PRIMEIRA POSIÇÃO
  {
    name: "BrasilAPI",
    url: (cep: string) => `https://brasilapi.com.br/api/cep/v1/${cep}`,
    headers: {
      Accept: "application/json",
      "User-Agent": "Petloo-Checkout/1.0",
    },
    parseResponse: (data: any) => {
      if (data && data.city && !data.error) {
        return {
          cep: data.cep || "",
          logradouro: data.street || "",
          bairro: data.neighborhood || "",
          localidade: data.city || "",
          uf: data.state || "",
        }
      }
      return null
    },
    timeout: 5000,
  },

  // 2. CEP Aberto (API gratuita, bem confiável)
  {
    name: "CEP Aberto",
    url: (cep: string) => `https://www.cepaberto.com/api/v3/cep?cep=${cep}`,
    headers: {
      Authorization: "Token token=YOUR_TOKEN_HERE", // Você pode se registrar gratuitamente
      Accept: "application/json",
      "User-Agent": "Petloo-Checkout/1.0",
    },
    parseResponse: (data: any) => {
      if (data && data.status === 200 && data.city) {
        return {
          cep: data.postal_code || "",
          logradouro: data.address || "",
          bairro: data.district || "",
          localidade: data.city.name || "",
          uf: data.state.acronym || "",
        }
      }
      return null
    },
    timeout: 5000,
  },

  // 3. PostMon (API gratuita, sem necessidade de token)
  {
    name: "PostMon",
    url: (cep: string) => `https://api.postmon.com.br/v1/cep/${cep}`,
    headers: {
      Accept: "application/json",
      "User-Agent": "Petloo-Checkout/1.0",
    },
    parseResponse: (data: any) => {
      if (data && data.city && !data.error) {
        return {
          cep: data.cep || "",
          logradouro: data.logradouro || data.address || "",
          bairro: data.bairro || data.district || "",
          localidade: data.cidade || data.city || "",
          uf: data.estado || data.state || "",
        }
      }
      return null
    },
    timeout: 5000,
  },

  // 4. ViaCEP (mantido como fallback)
  {
    name: "ViaCEP",
    url: (cep: string) => `https://viacep.com.br/ws/${cep}/json/`,
    headers: {
      Accept: "application/json",
      "User-Agent": "Petloo-Checkout/1.0",
    },
    parseResponse: (data: any) => {
      if (data && data.localidade && !data.erro) {
        return {
          cep: data.cep || "",
          logradouro: data.logradouro || "",
          bairro: data.bairro || "",
          localidade: data.localidade || "",
          uf: data.uf || "",
        }
      }
      return null
    },
    timeout: 6000,
  },

  // 5. CEP.la (API gratuita)
  {
    name: "CEP.la",
    url: (cep: string) => `https://cep.la/${cep}`,
    headers: {
      Accept: "application/json",
      "User-Agent": "Petloo-Checkout/1.0",
    },
    parseResponse: (data: any) => {
      if (data && data.city && !data.error) {
        return {
          cep: data.cep || "",
          logradouro: data.address || "",
          bairro: data.district || "",
          localidade: data.city || "",
          uf: data.state || "",
        }
      }
      return null
    },
    timeout: 5000,
  },
]

// Function to try multiple CEP providers
async function fetchFromMultipleProviders(cep: string): Promise<any | null> {
  console.log(`🔄 Tentando buscar CEP ${cep} em ${CEP_PROVIDERS.length} provedores...`)

  for (let i = 0; i < CEP_PROVIDERS.length; i++) {
    const provider = CEP_PROVIDERS[i]

    try {
      console.log(`📡 Tentativa ${i + 1}/${CEP_PROVIDERS.length}: ${provider.name}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), provider.timeout)

      const response = await fetch(provider.url(cep), {
        method: "GET",
        headers: provider.headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log(`📊 ${provider.name} - Status: ${response.status}`)

      if (!response.ok) {
        console.warn(`⚠️ ${provider.name} retornou erro ${response.status}`)
        continue // Try next provider
      }

      const data = await response.json()
      console.log(`📋 ${provider.name} - Dados:`, data)

      const parsedData = provider.parseResponse(data)

      if (parsedData && parsedData.localidade && parsedData.uf) {
        console.log(`✅ Sucesso com ${provider.name}!`)
        return {
          ...parsedData,
          source: provider.name.toLowerCase().replace(/\s+/g, "_"),
        }
      } else {
        console.warn(`⚠️ ${provider.name} - Dados inválidos ou incompletos`)
        continue
      }
    } catch (error) {
      console.error(`❌ Erro com ${provider.name}:`, error)

      if (error instanceof Error && error.name === "AbortError") {
        console.warn(`⏰ Timeout no ${provider.name}`)
      }

      continue // Try next provider
    }
  }

  console.warn(`❌ Todos os ${CEP_PROVIDERS.length} provedores falharam para CEP ${cep}`)
  return null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cep = searchParams.get("cep")

    if (!cep) {
      return NextResponse.json(
        {
          success: false,
          error: "CEP é obrigatório",
        },
        { status: 400 },
      )
    }

    // Remove non-numeric characters from CEP
    const cleanedCep = cep.replace(/\D/g, "")

    // CEP must have 8 digits
    if (cleanedCep.length !== 8) {
      return NextResponse.json(
        {
          success: false,
          error: "CEP deve ter 8 dígitos",
        },
        { status: 400 },
      )
    }

    // Format CEP with dash
    const formattedCep = `${cleanedCep.slice(0, 5)}-${cleanedCep.slice(5)}`

    console.log(`🔍 Buscando CEP: ${cleanedCep} (formatado: ${formattedCep})`)
    console.log(`🌍 Ambiente: ${isDevelopmentEnvironment() ? "Desenvolvimento/Preview" : "Produção"}`)

    // Check if we're in development/preview and have mock data
    if (isDevelopmentEnvironment() && MOCK_CEP_DATA[formattedCep]) {
      console.log(`🎭 Usando dados mockados para CEP: ${formattedCep}`)
      const mockData = MOCK_CEP_DATA[formattedCep]

      const addressData = {
        cep: mockData.cep,
        street: mockData.logradouro || "",
        neighborhood: mockData.bairro || "",
        city: mockData.localidade || "",
        state: mockData.uf || "",
      }

      console.log(`✅ Endereço mockado retornado:`, addressData)

      return NextResponse.json({
        success: true,
        data: addressData,
        source: "mock",
      })
    }

    // Try to fetch from multiple providers
    const result = await fetchFromMultipleProviders(cleanedCep)

    if (result) {
      const addressData = {
        cep: result.cep || formattedCep,
        street: result.logradouro || "",
        neighborhood: result.bairro || "",
        city: result.localidade || "",
        state: result.uf || "",
      }

      console.log(`✅ Endereço encontrado via ${result.source}:`, addressData)

      return NextResponse.json({
        success: true,
        data: addressData,
        source: result.source,
      })
    }

    // If all providers fail, try to use a generic address based on CEP pattern
    const fallbackAddress = generateFallbackAddress(cleanedCep)

    if (fallbackAddress) {
      console.log(`🔄 Usando endereço genérico para CEP: ${cleanedCep}`)

      return NextResponse.json({
        success: true,
        data: fallbackAddress,
        source: "fallback",
        warning: "Endereço genérico. Confirme os dados antes de finalizar.",
      })
    }

    // If everything fails
    console.error(`❌ Não foi possível encontrar dados para CEP: ${cleanedCep}`)
    return NextResponse.json(
      {
        success: false,
        error: "CEP não encontrado em nenhum provedor",
      },
      { status: 404 },
    )
  } catch (error) {
    console.error("❌ Erro geral ao buscar CEP:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor ao consultar CEP",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

// Generate fallback address based on CEP patterns
function generateFallbackAddress(cep: string): any | null {
  // CEP patterns for major Brazilian states
  const cepPatterns: Record<string, { state: string; cities: string[] }> = {
    "01": { state: "SP", cities: ["São Paulo"] },
    "02": { state: "SP", cities: ["São Paulo"] },
    "03": { state: "SP", cities: ["São Paulo"] },
    "04": { state: "SP", cities: ["São Paulo"] },
    "05": { state: "SP", cities: ["São Paulo"] },
    "08": { state: "SP", cities: ["São Paulo"] },
    "20": { state: "RJ", cities: ["Rio de Janeiro"] },
    "21": { state: "RJ", cities: ["Rio de Janeiro"] },
    "22": { state: "RJ", cities: ["Rio de Janeiro"] },
    "23": { state: "RJ", cities: ["Rio de Janeiro"] },
    "24": { state: "RJ", cities: ["Niterói", "São Gonçalo"] },
    "29": { state: "ES", cities: ["Vila Velha", "Vitória", "Serra", "Cariacica"] },
    "30": { state: "MG", cities: ["Belo Horizonte"] },
    "31": { state: "MG", cities: ["Belo Horizonte"] },
    "40": { state: "BA", cities: ["Salvador"] },
    "41": { state: "BA", cities: ["Salvador"] },
    "50": { state: "PE", cities: ["Recife"] },
    "51": { state: "PE", cities: ["Recife"] },
    "60": { state: "CE", cities: ["Fortaleza"] },
    "70": { state: "DF", cities: ["Brasília"] },
    "80": { state: "PR", cities: ["Curitiba"] },
    "90": { state: "RS", cities: ["Porto Alegre"] },
  }

  const prefix = cep.substring(0, 2)
  const pattern = cepPatterns[prefix]

  if (pattern) {
    const formattedCep = `${cep.slice(0, 5)}-${cep.slice(5)}`
    const randomCity = pattern.cities[Math.floor(Math.random() * pattern.cities.length)]

    return {
      cep: formattedCep,
      street: "Rua Exemplo",
      neighborhood: "Centro",
      city: randomCity,
      state: pattern.state,
    }
  }

  return null
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
