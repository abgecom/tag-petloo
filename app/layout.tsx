import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import Script from "next/script"
import PageViewTracker from "@/components/PageViewTracker"
import { Analytics } from "@vercel/analytics/react"
import { Suspense } from "react"

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
{/* Microsoft Clarity */}
<Script
  id="microsoft-clarity"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "w1gu19dblf");
    `,
  }}
/>
        
        {/*
          GA4 nativo (gtag.js) — substitui o container GTM-MZ32BCCB removido.
          O GTM alimentava o container server-side api.petloo.com.br (Stape),
          que enviava CAPI do Facebook com fbclid expirado. Sem GTM, esse sender
          deixa de ser alimentado por este projeto. GA4: G-CX4GKGS2GP.
        */}
        <Script
          id="gtag-src"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-CX4GKGS2GP"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-CX4GKGS2GP');
            `,
          }}
        />

        {/* Meta Pixel */}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              window.__fbPvEventId = 'pv.' + Date.now() + '.' + Math.random().toString(36).slice(2, 10);
              fbq('init', '1650496555439267');
              fbq('track', 'PageView', {}, { eventID: window.__fbPvEventId });
            `,
          }}
        />
      </head>
      <body>
        {/* Meta Pixel (noscript) */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1650496555439267&ev=PageView&noscript=1"
          />
        </noscript>

        {/* Page View Tracker - Tracks all page views automatically */}
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>

        {children}

        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  )
}
