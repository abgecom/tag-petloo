"use client"

import Link from "next/link"

export default function HeroSectionV2() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 md:pt-20">
      {/* Video Background Placeholder */}
      <div className="absolute inset-0 z-0">
        {/* Placeholder para video - substituir src pelo video real */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          poster="/placeholder-hero.jpg"
        >
          {/* <source src="/videos/hero-video.mp4" type="video/mp4" /> */}
        </video>
        {/* Overlay para melhor legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
        
        {/* Placeholder visual enquanto não há video */}
        <div className="absolute inset-0 bg-gradient-to-br from-lootag-dark/90 via-lootag-dark/70 to-lootag-teal/30 flex items-center justify-center">
          <div className="text-white/20 text-center">
            <div className="w-32 h-32 mx-auto mb-4 border-4 border-dashed border-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <p className="text-sm">Video placeholder</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight text-balance mb-6">
            A liberdade que seu pet ama. A seguranca que voce precisa para respirar aliviada.
          </h1>
          
          <p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto mb-8 text-pretty leading-relaxed">
            O primeiro ecossistema de protecao via rastreamento em tempo real desenhado para o estilo de vida urbano. A Lootag une design inteligente e tecnologia de precisao para que o seu melhor amigo nunca esteja a mais de um clique de distancia.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link 
              href="#comprar"
              className="w-full sm:w-auto px-8 py-4 bg-lootag-teal text-white font-bold text-lg rounded-full hover:bg-lootag-teal/90 transition-all hover:scale-105 shadow-lg"
            >
              QUERO O KIT LOOTAG AGORA
            </Link>
          </div>

          {/* Micro-copy */}
          <p className="text-sm text-white/70">
            Assinatura unica de R$ 30,00/mes. Cancele quando quiser.
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  )
}
