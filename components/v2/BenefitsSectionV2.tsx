import { MapPin, Feather, Shield } from "lucide-react"
import Link from "next/link"

export default function BenefitsSectionV2() {
  const benefits = [
    {
      icon: MapPin,
      title: "Controle Total na Palma da Mao",
      description: "Nao e sobre onde ele esta agora, e sobre onde ele poderia estar se o imprevisto acontecesse. Em grandes centros, 5 minutos de desorientacao podem custar a eternidade.",
    },
    {
      icon: Feather,
      title: "Design que nao incomoda",
      description: "Esqueca rastreadores pesados. Nossa tecnologia foi integrada a uma coleira leve e ergonomica, feita para acompanhar a energia do seu pet sem causar desconforto.",
    },
    {
      icon: Shield,
      title: "Seguranca em Tempo Real",
      description: "Receba alertas instantaneos se ele sair de uma zona segura. Visualize o trajeto e a localizacao exata em segundos. O elo entre voces dois agora e inquebravel, nao importa a distancia.",
    },
  ]

  return (
    <section id="funcionalidades" className="py-16 md:py-24 bg-petloo-bg">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-sm font-semibold text-petloo-purple uppercase tracking-wider mb-3">
            Beneficios
          </p>
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
              <div className="w-16 h-16 mx-auto mb-6 bg-petloo-purple/10 rounded-2xl flex items-center justify-center group-hover:bg-petloo-purple/20 transition-colors">
                <benefit.icon className="w-8 h-8 text-petloo-purple" />
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
