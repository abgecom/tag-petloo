"use client"

import { Battery, Globe, Smartphone, Droplets } from "lucide-react"

export default function FeaturesSectionV2() {
  const collarFeatures = [
    {
      icon: Battery,
      title: "Seguranca Extrema",
      description: "com design ergonomico",
    },
    {
      icon: Globe,
      title: "Cobertura nacional",
      description: "em todo o Brasil",
    },
    {
      icon: Smartphone,
      title: "Pequena e compacta",
      description: "para caes e gatos com mais de 2kg",
    },
    {
      icon: Droplets,
      title: "100% a prova d'agua",
      description: "resistente a chuva e brincadeiras",
    },
  ]

  return (
    <section id="como-funciona" className="relative">
      {/* Primeira parte - Fundo branco */}
      <div className="bg-white pt-16 md:pt-24 pb-32 md:pb-40">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Video/Image Placeholder */}
            <div className="order-2 lg:order-1">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-petloo-purple to-petloo-purple/80 rounded-3xl overflow-hidden shadow-2xl">
                {/* Placeholder para video do app */}
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  {/* <source src="/videos/app-demo.mp4" type="video/mp4" /> */}
                </video>
                {/* Placeholder visual */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white/30 text-center p-8">
                    <div className="w-24 h-40 mx-auto mb-4 border-4 border-dashed border-white/30 rounded-3xl flex items-center justify-center">
                      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <p className="text-sm">Video do App placeholder</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-petloo-purple mb-4">
                O LooApp
              </h2>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                A bussola do seu melhor amigo
              </p>
              <p className="text-muted-foreground leading-relaxed text-pretty">
                Uma interface desenhada para momentos de urgencia. Sem menus complexos, apenas o que importa: o ponto azul indicando o caminho de volta para casa.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Segunda parte - Fundo roxo com bordas arredondadas superiores */}
      <div className="bg-petloo-purple pt-16 md:pt-24 pb-16 md:pb-24 rounded-t-[2.5rem] md:rounded-t-[4rem] -mt-8 md:-mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <p className="text-sm font-semibold text-petloo-green uppercase tracking-wider mb-3">
              Conforto e Seguranca
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              A Tag Petloo Inteligente
            </h2>
            <p className="text-white/80 leading-relaxed text-pretty mb-8">
              Inspirada nas pulseiras de relogios militares, nossa coleira une a durabilidade do tecido premium a seguranca da case exclusiva Lootag. Confortavel para o descanso, elegante para o passeio, robusta para a aventura.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {collarFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-4 bg-white rounded-xl"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-petloo-purple/10 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-petloo-purple" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image Placeholder */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-petloo-beige to-white rounded-3xl overflow-hidden shadow-xl flex items-center justify-center">
              {/* Placeholder para imagem da coleira */}
              <div className="text-muted-foreground/30 text-center p-8">
                <div className="w-48 h-48 mx-auto mb-4 border-4 border-dashed border-muted-foreground/20 rounded-full flex items-center justify-center">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
                <p className="text-sm">Imagem da coleira placeholder</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  )
}
