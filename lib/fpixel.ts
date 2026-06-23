// Facebook Pixel ID
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "1650496555439267"

// Extend window to include fbq
declare global {
  interface Window {
    fbq: (
      action: string,
      eventOrPixelId: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void
    _fbq: unknown
  }
}

// Track page views
export const pageview = () => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView")
  }
}

export interface AdvancedMatchingData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  zipCode?: string
  externalId?: string
}

/**
 * Atualiza o Advanced Matching do Pixel no navegador, elevando a pontuação de
 * correspondência (Event Match Quality). O SDK faz o hashing SHA-256 sozinho.
 */
export const setAdvancedMatching = (userData?: AdvancedMatchingData) => {
  if (typeof window === "undefined" || !window.fbq || !userData) return
  const am: Record<string, string> = { country: "br" }
  if (userData.email) am.em = userData.email
  if (userData.phone) am.ph = userData.phone
  if (userData.firstName) am.fn = userData.firstName
  if (userData.lastName) am.ln = userData.lastName
  if (userData.city) am.ct = userData.city
  if (userData.state) am.st = userData.state
  if (userData.zipCode) am.zp = userData.zipCode
  if (userData.externalId) am.external_id = userData.externalId
  // Reinicializar com os dados atualiza o Advanced Matching (o Meta deduplica o init)
  window.fbq("init", FB_PIXEL_ID, am as unknown as Record<string, unknown>)
}

// Track custom events with deduplication support
export const event = (name: string, options: Record<string, unknown> = {}, eventID?: string) => {
  if (typeof window !== "undefined" && window.fbq) {
    if (eventID) {
      window.fbq("track", name, options, { eventID })
    } else {
      window.fbq("track", name, options)
    }
  }
}
