/**
 * Helper do Google Analytics 4 (gtag.js nativo).
 *
 * O gtag.js é carregado no <head> do app/layout.tsx com GA4 G-CX4GKGS2GP,
 * substituindo o container GTM-MZ32BCCB (removido) que encaminhava os eventos
 * de dataLayer para o GA4 via container server-side.
 */

export const GA4_ID = "G-CX4GKGS2GP"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/** Dispara um evento no gtag (GA4). Seguro em SSR / antes do carregamento. */
export function gtagEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, params)
  }
}
