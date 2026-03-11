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
      <div className="relative z-10 container mx-auto px-4 py-20 md:py-0">
        <div className="max-w-2xl">
          {/* Badge/Label */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <span className="w-2 h-2 bg-petloo-green rounded-full animate-pulse"></span>
            <span className="text-sm text-white font-medium">Rastreamento GPS em tempo real</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Localizador inteligente para pets
          </h1>
          
          {/* Sub-headline */}
          <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-xl">
            O localizador por GPS e monitor de saude para animais de companhia. Saiba onde seu pet esta a qualquer momento.
          </p>

          {/* CTA Buttons - Estilo Tractive */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Link 
              href="#caes"
              className="inline-flex items-center justify-center px-8 py-4 bg-petloo-green text-white font-bold text-lg rounded-full hover:bg-petloo-green/90 transition-all hover:scale-105 shadow-lg"
            >
              Quero uma Lootag
            </Link>
            <Link 
              href="#como-funciona"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-lg rounded-full hover:bg-white/20 transition-all border border-white/20"
            >
              Como funciona
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center gap-6 text-white/70 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-petloo-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Cobertura nacional</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-petloo-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Sem fidelidade</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-petloo-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Cancele quando quiser</span>
            </div>
          </div>
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
