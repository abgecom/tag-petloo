"use client"

import Image from "next/image"

export default function FeaturesSectionV2() {
  return (
    <section id="como-funciona" className="relative">
      {/* Primeira parte - Fundo branco */}
      <div className="bg-white pt-16 md:pt-24 pb-0">
        {/* Card bege sobrepondo o fundo branco e parte do roxo */}
        <div className="relative z-20 mx-4 md:mx-8 lg:mx-16 xl:mx-24 bg-petloo-beige rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 lg:p-14 mb-[-80px] md:mb-[-120px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Video do YouTube */}
            <div className="order-2 lg:order-1">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-petloo-purple to-petloo-purple/80 rounded-3xl overflow-hidden shadow-2xl">
                <iframe
                  src="https://www.youtube.com/embed/ldwr6IpTNNk?autoplay=1&mute=1&loop=1&playlist=ldwr6IpTNNk&controls=0&showinfo=0&rel=0&modestbranding=1"
                  title="Petloo App Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
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

      {/* Segunda parte - Fundo roxo escuro (igual ao fundo da imagem) com bordas arredondadas superiores */}
      <div className="relative z-10 bg-[#5D2060] pt-32 md:pt-44 pb-16 md:pb-24 rounded-t-[2.5rem] md:rounded-t-[4rem]">
        <div className="container mx-auto px-4">
          {/* Content - Centralizado superiormente */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              A LooTag de Rastreamento
            </h2>
            <p className="text-white/80 leading-relaxed text-pretty max-w-2xl mx-auto mb-8">
              Inspirada nas pulseiras de relogios militares, nossa coleira une a durabilidade do tecido premium a seguranca da case exclusiva Lootag.
            </p>

            {/* Quadrante com fundo transparente, sombra e bordas arredondadas */}
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
              <p className="text-white font-medium">
                Confortavel para o descanso, elegante para o passeio, robusta para a aventura.
              </p>
            </div>
          </div>

          {/* Imagem da coleira LooTag */}
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_2kn9jl2kn9jl2kn9.png-bJUXVlZxVQCBgl37PBQ4tefRYGdlj1.jpeg"
                alt="LooTag de Rastreamento - Coleira com design ergonomico, cobertura nacional, pequena e compacta para caes e gatos com mais de 2kg, 100% a prova d'agua"
                width={600}
                height={800}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
