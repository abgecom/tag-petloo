// Utility functions for Meta Pixel Advanced Matching

/**
 * Generate SHA-256 hash of a string
 * @param text - Text to hash
 * @returns SHA-256 hash in lowercase hexadecimal
 */
export async function hashSHA256(text: string): Promise<string> {
  if (!text) return ""

  try {
    // Normalize text to lowercase and trim
    const normalizedText = text.toLowerCase().trim()

    // Convert string to ArrayBuffer
    const encoder = new TextEncoder()
    const data = encoder.encode(normalizedText)

    // Generate hash
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)

    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

    return hashHex
  } catch (error) {
    console.error("Erro ao gerar hash SHA-256:", error)
    return ""
  }
}

/**
 * Format phone number for Meta Pixel (with Brazil country code +55)
 * @param phone - Phone number string
 * @returns Formatted phone with country code (5511999999999)
 */
export function formatPhoneForMeta(phone: string): string {
  if (!phone) return ""

  // Remove all non-digits
  const digitsOnly = phone.replace(/\D/g, "")

  // If already has country code (starts with 55), return as is
  if (digitsOnly.startsWith("55") && digitsOnly.length === 13) {
    return digitsOnly
  }

  // If it's a Brazilian mobile number (11 digits), add country code
  if (digitsOnly.length === 11) {
    return `55${digitsOnly}`
  }

  // If it's a Brazilian landline (10 digits), add country code
  if (digitsOnly.length === 10) {
    return `55${digitsOnly}`
  }

  // Return as is if format is unexpected
  console.warn("Formato de telefone inesperado:", phone)
  return digitsOnly
}

/**
 * Format name for Meta Pixel (lowercase, no extra spaces)
 * @param name - Name string
 * @returns Formatted name in lowercase
 */
export function formatNameForMeta(name: string): string {
  if (!name) return ""

  return name.toLowerCase().trim().replace(/\s+/g, " ")
}

/**
 * Prepare user data for Meta Pixel Advanced Matching
 * @param userData - User data object
 * @returns Promise with formatted data for Meta Pixel
 */
export async function prepareMetaPixelUserData(userData: {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
}): Promise<{
  em?: string
  fn?: string
  ln?: string
  ph?: string
}> {
  const result: any = {}

  // Hash email with SHA-256
  if (userData.email) {
    result.em = await hashSHA256(userData.email)
  }

  // Format first name
  if (userData.firstName) {
    result.fn = formatNameForMeta(userData.firstName)
  }

  // Format last name
  if (userData.lastName) {
    result.ln = formatNameForMeta(userData.lastName)
  }

  // Format phone with Brazil country code
  if (userData.phone) {
    result.ph = formatPhoneForMeta(userData.phone)
  }

  return result
}

/**
 * Log Meta Pixel data for debugging (without sensitive info)
 * @param eventName - Event name
 * @param userData - User data sent to Meta
 */
export function logMetaPixelEvent(eventName: string, userData: any) {
  console.log(`📱 Meta Pixel ${eventName} Event:`, {
    ...userData,
    em: userData.em ? `${userData.em.substring(0, 8)}...` : undefined,
    ph: userData.ph ? `${userData.ph.substring(0, 4)}...` : undefined,
  })
}
