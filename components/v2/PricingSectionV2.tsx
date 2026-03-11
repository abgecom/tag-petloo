import { Check } from "lucide-react"
import Link from "next/link"

export default function PricingSectionV2() {
  const features = [
    "Coleira Nato Exclusiva",
    "Case Personalizada",
    "Acesso completo ao App",
    "Rastreamento em tempo real",
    "Alertas de zona segura",
    "Suporte dedicado em PT/BR",
  ]

  const plans = [
    {
      pets: 1,
      title: "Protecao de 1 Pet",
      price: "29,90",
      priceInt: "29",
      priceDec: "90",
    },
    {
      pets: 2,
      title: "Protecao de 2 Pets",
      price: "59,80",
      priceInt: "59",
      priceDec: "80",
      popular: true,
    },
    {
      pets: 3,
      title: "Protecao de 3 Pets",
      price: "89,70",
      priceInt: "89",
      priceDec: "70",
    },
  ]

  return (
    <section id="comprar" className="py-16 md:py-24 bg-gradient-to-b from-petloo-beige to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-petloo-purple uppercase tracking-wider mb-3">
            A Oferta
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance mb-4">
            Ecossistema Completo de Rastreamento
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Por menos de R$ 1,00 por dia, voce garante que a historia do seu pet nunca tenha um capitulo perdido
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-3xl shadow-xl overflow-hidden border ${
                plan.popular ? "border-petloo-purple ring-2 ring-petloo-purple" : "border-border"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="bg-petloo-purple text-white text-center py-2 text-sm font-medium">
                  Mais Popular
                </div>
              )}
              
              {/* Card Header */}
              <div className={`p-6 text-center ${plan.popular ? "bg-petloo-purple/5" : ""}`}>
                <p className="text-sm font-medium text-muted-foreground mb-2">{plan.title}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-base text-foreground">R$</span>
                  <span className="text-5xl font-bold text-foreground">{plan.priceInt}</span>
                  <span className="text-xl text-foreground">,{plan.priceDec}</span>
                  <span className="text-base text-muted-foreground">/mes</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 pt-0">
                {/* Guarantees */}
                <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-petloo-green" />
                    Sem fidelidade
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-petloo-green" />
                    Sem taxas de instalacao
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-petloo-green" />
                    Sem surpresas
                  </span>
                </div>

                {/* Security text */}
                <p className="text-center text-sm text-muted-foreground mb-4">
                  Apenas a certeza de que ele esta seguro.
                </p>

                {/* CTA */}
                <Link 
                  href="#"
                  className={`block w-full py-3 font-bold text-base rounded-full text-center transition-all hover:scale-105 ${
                    plan.popular 
                      ? "bg-petloo-green text-white hover:bg-petloo-green/90" 
                      : "bg-petloo-purple text-white hover:bg-petloo-purple/90"
                  }`}
                >
                  GARANTIR MEU KIT
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Unified Features - O kit inclui */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-lg border border-border">
          <p className="font-semibold text-foreground mb-4 text-center">O kit inclui:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-shrink-0 w-5 h-5 bg-petloo-green/20 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-petloo-green" />
                </div>
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Image Placeholder */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="aspect-video bg-petloo-beige rounded-3xl flex items-center justify-center">
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
