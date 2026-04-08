import { event as fbPixelEvent } from "@/lib/fpixel"

/**
 * Envia eventos para o Facebook Pixel (client-side) e CAPI (server-side)
 * Usa event_id para deduplicação entre os dois
 */
export async function fbEvents(
  eventName: string,
  eventData: Record<string, unknown> = {},
  userData?: {
    email?: string
    phone?: string
    firstName?: string
    lastName?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  },
) {
  const eventId = `${eventName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  // 1. Dispara no navegador (Pixel)
  fbPixelEvent(eventName, eventData, eventId)

  // 2. Dispara no servidor (CAPI) via API route
  try {
    await fetch("/api/fb-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventId,
        eventData,
        url: typeof window !== "undefined" ? window.location.href : "",
        userData: userData || {},
      }),
    })
  } catch (error) {
    console.error("[fbEvents] Error sending server event:", error)
  }
}
