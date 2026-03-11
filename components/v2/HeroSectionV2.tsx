"use client"

import Link from "next/link"

export default function HeroSectionV2() {
  return (
    <section className="relative min-h-screen md:h-[90vh] flex items-end md:items-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        {/* Video - substituir src pelo video real */}
        <video
          autoPlay
          loop
          muted
          playsInline
          webkit-playsinline="true"
          className="absolute inset-0 w-full h-full object-cover"
          poster="/placeholder-hero.jpg"
        >
          {/* <source src="/videos/hero-video.mp4" type="video/mp4" /> */}
        </video>
        
        {/* Overlay gradient - mais leve no mobile para ver o video */}
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/50 to-black/30 md:to-transparent" />
        
        {/* Placeholder visual enquanto nao ha video - visivel em mobile */}
        <div className="absolute inset-0 bg-gradient-to-br from-petloo-purple via-petloo-purple/70 to-petloo-green/30">
          {/* Placeholder indicator - desktop only */}
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 text-white/10 hidden lg:block">
            <div className="w-64 h-64 border-4 border-dashed border-white/20 rounded-full flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <p className="text-sm text-white/30">Video placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Alinhado a esquerda como Tractive */}
      <div className="relative z-10 container mx-auto px-5 md:px-8 lg:px-12 pt-28 pb-20 md:pt-72 md:pb-48 lg:pt-80 lg:pb-56">
        <div className="max-w-2xl space-y-4 md:space-y-6 lg:space-y-8">
          {/* Headline */}
          <h1 className="text-xl leading-[1.3] sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white md:leading-[1.15] text-balance">
            A liberdade que seu pet ama. A seguranca que voce precisa.
          </h1>
          
          {/* Sub-headline */}
          <p className="text-sm leading-[1.5] sm:text-base md:text-lg lg:text-xl text-white/90 md:text-white md:leading-relaxed max-w-md md:max-w-lg text-pretty">
            O primeiro ecossistema de protecao via rastreamento em tempo real desenhado para o estilo de vida urbano. Seu melhor amigo a um clique de distancia.
          </p>

          {/* CTA Button */}
          <div className="pt-2 md:pt-2">
            <Link 
              href="#comprar"
              className="inline-flex items-center justify-center px-5 py-3 md:px-8 md:py-4 bg-petloo-green text-white font-semibold text-sm md:text-lg rounded-full hover:bg-petloo-green/90 transition-all hover:scale-105 shadow-lg"
            >
              Quero uma Lootag
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator - hidden on mobile */}
      <div className="hidden md:block absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Bottom curve - bordas arredondadas estilo Tractive */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <svg 
          viewBox="0 0 1440 60" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-12 md:h-14 lg:h-16 hidden md:block"
          preserveAspectRatio="none"
        >
          <path 
            d="M0 60L0 24C0 10.7452 10.7452 0 24 0L1416 0C1429.25 0 1440 10.7452 1440 24V60H0Z" 
            className="fill-white"
          />
        </svg>
      </div>
    </section>
  )
}
