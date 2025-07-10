import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import Script from "next/script"
import PageViewTracker from "@/components/PageViewTracker"

export const metadata: Metadata = {
  title: "Tag de Rastreamento Petloo - Nunca mais perca seu pet",
  description:
    "Tag de rastreamento em tempo real para pets com app exclusivo, RG digital, cartão de vacinas e seguro saúde gratuito.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-MZ32BCCB');
            `,
          }}
        />
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MZ32BCCB"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* Page View Tracker - Tracks all page views automatically */}
        <PageViewTracker />

        {children}
      </body>
    </html>
  )
}
