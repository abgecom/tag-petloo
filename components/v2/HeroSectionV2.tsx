"use client"

import Link from "next/link"

export default function HeroSectionV2() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
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
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        
        {/* Placeholder visual enquanto nao ha video */}
        <div className="absolute inset-0 bg-gradient-to-br from-petloo-purple via-petloo-purple/80 to-petloo-green/40">
          {/* Placeholder indicator */}
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
      <div className="relative z-10 container mx-auto px-4 md:px-8 lg:px-12 pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="max-w-2xl space-y-8">
          {/* Headline */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-[1.15] text-balance">
            A liberdade que seu pet ama. A seguranca que voce precisa para respirar aliviada.
          </h1>
          
          {/* Sub-headline */}
          <p className="text-base md:text-lg lg:text-xl text-white/85 leading-relaxed max-w-lg text-pretty">
            O primeiro ecossistema de protecao via rastreamento em tempo real desenhado para o estilo de vida urbano. A Lootag une design inteligente e tecnologia de precisao para que o seu melhor amigo nunca esteja a mais de um clique de distancia.
          </p>

          {/* CTA Button */}
          <div className="pt-2">
            <Link 
              href="#comprar"
              className="inline-flex items-center justify-center px-8 py-4 bg-petloo-green text-white font-bold text-lg rounded-full hover:bg-petloo-green/90 transition-all hover:scale-105 shadow-lg"
            >
              Quero uma Lootag
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Bottom curve - bordas arredondadas estilo Tractive */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg 
          viewBox="0 0 1440 80" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path 
            d="M0 80V60C0 26.8629 26.8629 0 60 0H1380C1413.14 0 1440 26.8629 1440 60V80H0Z" 
            className="fill-petloo-beige"
          />
        </svg>
      </div>
    </section>
  )
}
