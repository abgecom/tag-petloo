import Link from "next/link"

export default function BenefitsSectionV2() {
  const benefits = [
    {
      title: "Controle Total na Palma da Mao",
      description: "Nao e sobre onde ele esta agora, e sobre onde ele poderia estar se o imprevisto acontecesse. Em grandes centros, 5 minutos de desorientacao podem custar a eternidade.",
    },
    {
      title: "Design que nao incomoda",
      description: "Esqueca rastreadores pesados. Nossa tecnologia foi integrada a uma coleira leve e ergonomica, feita para acompanhar a energia do seu pet sem causar desconforto.",
    },
    {
      title: "Seguranca em Tempo Real",
      description: "Receba alertas instantaneos se ele sair de uma zona segura. Visualize o trajeto e a localizacao exata em segundos. O elo entre voces dois agora e inquebravel, nao importa a distancia.",
    },
  ]

  return (
    <section id="funcionalidades" className="py-16 md:py-24 bg-petloo-bg">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            Utilizado por milhares de tutores em todo o Brasil
          </h2>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="text-center group"
            >
              {/* Image placeholder with shadow - 4:5 aspect ratio */}
              <div className="w-1/2 aspect-[4/5] mx-auto mb-6 bg-white rounded-2xl shadow-lg shadow-petloo-purple/20 flex items-center justify-center overflow-hidden group-hover:shadow-xl group-hover:shadow-petloo-purple/30 transition-shadow">
                <div className="w-full h-full bg-gradient-to-br from-petloo-beige to-white flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground/30" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-pretty">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link 
            href="#comprar"
            className="inline-flex px-8 py-4 bg-petloo-green text-white font-bold rounded-full hover:bg-petloo-green/90 transition-all hover:scale-105"
          >
            PROTEGER MEU PET AGORA
          </Link>
        </div>
      </div>
    </section>
  )
}
