export const fetchAddressByCEP = async (
  cep: string,
): Promise<{ cep: string; street: string; neighborhood: string; city: string; state: string } | null> => {
  if (!cep) return null

  // Remove non-numeric characters from CEP
  const cleanedCep = cep.replace(/\D/g, "")

  // CEP must have 8 digits
  if (cleanedCep.length !== 8) {
    return null
  }

  try {
    console.log(`🔍 Buscando CEP via API interna: ${cleanedCep}`)

    // Reduce timeout for better UX
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`/api/cep?cep=${cleanedCep}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log(`📡 Status da API interna: ${response.status}`)

    if (!response.ok) {
      console.error(`❌ Erro na API interna de CEP: ${response.status}`)

      // Try to get error details
      try {
        const errorData = await response.json()
        console.error(`📋 Detalhes do erro:`, errorData)

        // Show user-friendly error message
        if (errorData.error) {
          console.warn(`⚠️ ${errorData.error}`)
        }
      } catch (jsonError) {
        console.error(`❌ Erro ao parsear resposta de erro:`, jsonError)
      }

      return null
    }

    const result = await response.json()
    console.log(`📍 Resposta da API interna:`, result)

    if (!result.success || !result.data) {
      console.warn(`⚠️ CEP não encontrado ou dados inválidos: ${cleanedCep}`)
      return null
    }

    const addressData = {
      cep: result.data.cep,
      street: result.data.street,
      neighborhood: result.data.neighborhood,
      city: result.data.city,
      state: result.data.state,
    }

    // Log the source of the data for debugging
    if (result.source) {
      console.log(`📊 Fonte dos dados: ${result.source}`)

      if (result.source === "fallback") {
        console.warn(`⚠️ Usando dados genéricos para CEP ${cleanedCep}`)
      } else if (result.source === "mock") {
        console.log(`🎭 Dados mockados para desenvolvimento`)
      }
    }

    // Show warning if it's fallback data
    if (result.warning) {
      console.warn(`⚠️ ${result.warning}`)
    }

    console.log(`✅ Endereço retornado:`, addressData)
    return addressData
  } catch (error) {
    console.error("❌ Erro ao buscar endereço:", error)

    // Check if it's a timeout error
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`⏰ Timeout na consulta do CEP: ${cleanedCep}`)
    }

    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes("fetch failed")) {
      console.error(`🌐 Erro de rede na consulta do CEP: ${cleanedCep}`)
    }

    return null
  }
}
