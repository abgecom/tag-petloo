import { Check } from "lucide-react"
import Link from "next/link"

export default function PricingSectionV2() {
  const features = [
    "Coleira Nato Exclusiva",
    "Case Personalizada",
    "Acesso completo ao App",
    "Rastreamento em tempo real",
    "Alertas de zona segura",
    "Suporte dedicado",
  ]

  return (
    <section id="comprar" className="py-16 md:py-24 bg-gradient-to-b from-lootag-cream to-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-lootag-teal uppercase tracking-wider mb-3">
            A Oferta
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance mb-4">
            Ecossistema Completo de Rastreamento
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Por menos de R$ 1,00 por dia, voce garante que a historia do seu pet nunca tenha um capitulo perdido
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-background rounded-3xl shadow-2xl overflow-hidden border border-border">
            {/* Card Header */}
            <div className="bg-lootag-teal p-8 text-center text-white">
              <p className="text-sm font-medium opacity-90 mb-2">Assinatura mensal</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-lg">R$</span>
                <span className="text-6xl font-bold">29</span>
                <span className="text-2xl">,90</span>
                <span className="text-lg opacity-75">/mes</span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-8">
              {/* Features */}
              <p className="font-semibold text-foreground mb-4">O kit inclui:</p>
              <ul className="space-y-3 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-lootag-teal/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-lootag-teal" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Guarantees */}
              <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground mb-8">
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-lootag-teal" />
                  Sem fidelidade
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-lootag-teal" />
                  Sem taxas de instalacao
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-lootag-teal" />
                  Sem surpresas
                </span>
              </div>

              {/* CTA */}
              <Link 
                href="#"
                className="block w-full py-4 bg-lootag-teal text-white font-bold text-lg rounded-full text-center hover:bg-lootag-teal/90 transition-all hover:scale-105"
              >
                GARANTIR MEU KIT AGORA
              </Link>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Apenas a certeza de que ele esta seguro.
              </p>
            </div>
          </div>
        </div>

        {/* Product Image Placeholder */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="aspect-video bg-lootag-gray rounded-3xl flex items-center justify-center">
            <div className="text-muted-foreground/30 text-center p-8">
              <div className="w-32 h-24 mx-auto mb-4 border-4 border-dashed border-muted-foreground/20 rounded-xl flex items-center justify-center">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </div>
              <p className="text-sm">Imagem do kit completo placeholder</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
