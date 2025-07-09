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
    const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`)
    const data = await response.json()

    if (data.erro) {
      return null
    }

    return {
      cep: data.cep,
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    }
  } catch (error) {
    console.error("Erro ao buscar endereço:", error)
    return null
  }
}
