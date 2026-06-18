"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { fbEvents } from "@/lib/fb-events"
import { gtagEvent } from "@/lib/gtag"

declare global {
  interface Window {
    dataLayer: any[]
    __fbPvEventId?: string
  }
}

/**
 * Rastreamento de PageView (pós-remoção do GTM).
 *
 * - 1º carregamento: o PageView do navegador já foi disparado no <head> (rápido,
 *   mantém a Landing Page View) com um eventID em window.__fbPvEventId. Aqui só
 *   espelhamos esse evento para a CAPI (dedup por event_id) e disparamos o
 *   page_view do GA4.
 * - Navegações SPA (troca de rota): o snippet do <head> não refaz PageView,
 *   então disparamos aqui Meta (navegador + CAPI via fbEvents) e GA4.
 */
export default function PageViewTracker() {
  const pathname = usePathname()
  const isFirstLoad = useRef(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    // GA4 page_view (todas as navegações, inclusive a inicial)
    gtagEvent("page_view", {
      page_path: pathname,
      page_title: document.title,
      page_location: window.location.href,
    })

    if (isFirstLoad.current) {
      isFirstLoad.current = false

      // Espelha o PageView inicial (disparado no <head>) para a CAPI com o mesmo eventID
      const eventId = window.__fbPvEventId
      if (eventId) {
        fetch("/api/fb-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            eventName: "PageView",
            eventId,
            eventData: {},
            url: window.location.href,
            userData: {},
          }),
        }).catch(() => {
          /* fire-and-forget */
        })
      }
      return
    }

    // Navegação client-side: Meta PageView (navegador + CAPI deduplicados)
    fbEvents("PageView", {})
  }, [pathname])

  return null
}
