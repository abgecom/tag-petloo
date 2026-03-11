import { Check, X } from "lucide-react"
import Link from "next/link"

export default function ComparisonSectionV2() {
  const comparisons = [
    {
      feature: "Localizacao Tempo Real (Satelite)",
      lootag: true,
      others: "Apenas via QR Code (Passivo)",
    },
    {
      feature: "Design Integrado e Ergonomico",
      lootag: true,
      others: '"Trambolho" pendurado',
    },
    {
      feature: "Configuracao",
      lootag: "Pronta para uso em 2 min",
      others: "Manual complexo em chines",
    },
    {
      feature: "Custo",
      lootag: "Menos de R$ 1,00 por dia",
      others: "Precos abusivos ou sem suporte",
    },
  ]

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-lootag-teal uppercase tracking-wider mb-3">
            Comparativo
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
            Nos vs. Eles
          </h2>
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto">
          {/* Table Header */}
          <div className="grid grid-cols-3 gap-4 mb-4 px-4">
            <div className="text-sm font-semibold text-muted-foreground">Recurso</div>
            <div className="text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-lootag-teal text-white rounded-full text-sm font-bold">
                Lootag
              </span>
            </div>
            <div className="text-center text-sm font-semibold text-muted-foreground">
              Rastreadores Genericos
            </div>
          </div>

          {/* Table Body */}
          <div className="bg-lootag-gray rounded-2xl overflow-hidden">
            {comparisons.map((item, index) => (
              <div 
                key={index}
                className={`grid grid-cols-3 gap-4 p-4 md:p-6 items-center ${
                  index !== comparisons.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="text-sm md:text-base font-medium text-foreground">
                  {item.feature}
                </div>
                <div className="flex justify-center">
                  {typeof item.lootag === "boolean" ? (
                    <div className="w-8 h-8 bg-lootag-teal/20 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-lootag-teal" />
                    </div>
                  ) : (
                    <span className="text-sm text-lootag-teal font-medium text-center">
                      {item.lootag}
                    </span>
                  )}
                </div>
                <div className="flex justify-center">
                  {typeof item.others === "string" && item.others.includes("Apenas") ? (
                    <span className="text-sm text-muted-foreground text-center">
                      {item.others}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground text-center">
                      {item.others}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link 
            href="#comprar"
            className="inline-flex px-8 py-4 bg-lootag-teal text-white font-bold rounded-full hover:bg-lootag-teal/90 transition-all hover:scale-105"
          >
            ESCOLHER A SEGURANCA PREMIUM
          </Link>
        </div>
      </div>
    </section>
  )
}
