"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// Extend Window interface to include dataLayer
declare global {
  interface Window {
    dataLayer: any[]
  }
}

export default function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Initialize dataLayer if it doesn't exist
      window.dataLayer = window.dataLayer || []

      // Push page_view event to dataLayer
      window.dataLayer.push({
        event: "page_view",
        page_path: pathname,
        page_title: document.title,
        page_location: window.location.href,
        timestamp: new Date().toISOString(),
      })

      console.log("📊 GTM Page View Event:", {
        event: "page_view",
        page_path: pathname,
        page_title: document.title,
        page_location: window.location.href,
      })
    }
  }, [pathname]) // Re-run when pathname changes (for SPA navigation)

  return null
}
