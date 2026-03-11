import { Check, X } from "lucide-react"
import Link from "next/link"

export default function ComparisonSectionV2() {
  const comparisons = [
    {
      feature: "Localizacao Tempo Real (Satelite)",
      lootag: true,
      othersGPS: true,
      airtag: "Apenas no alcance Bluetooth do iPhone (15-20m)",
    },
    {
      feature: "Design Integrado e Ergonomico",
      lootag: true,
      othersGPS: false,
      airtag: false,
    },
    {
      feature: "Configuracao",
      lootag: true,
      othersGPS: "Manual complexo",
      airtag: true,
    },
    {
      feature: "Custo acessivel",
      lootag: true,
      othersGPS: false,
      airtag: true,
    },
    {
      feature: "Feito para pets. Pequeno e leve",
      lootag: true,
      othersGPS: false,
      airtag: false,
    },
    {
      feature: "Suporte dedicado em Portugues",
      lootag: true,
      othersGPS: false,
      airtag: false,
    },
  ]

  const renderCell = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <div className="w-7 h-7 bg-foreground rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      ) : (
        <div className="w-7 h-7 border-2 border-foreground rounded-full flex items-center justify-center">
          <X className="w-4 h-4 text-foreground" />
        </div>
      )
    }
    return <span className="text-xs md:text-sm text-muted-foreground text-center italic">{value}</span>
  }

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-petloo-purple uppercase tracking-wider mb-3">
            Comparativo
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-5xl mx-auto overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Table Header */}
            <thead>
              <tr>
                <th className="p-4 text-left"></th>
                <th className="p-4 bg-petloo-beige rounded-t-2xl">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-lg md:text-xl font-bold text-petloo-purple">Petloo</span>
                  </div>
                </th>
                <th className="p-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm md:text-base font-semibold text-foreground">Outros GPS</span>
                    <span className="text-xs text-muted-foreground">Trackers</span>
                  </div>
                </th>
                <th className="p-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm md:text-base font-semibold text-foreground">AirTag</span>
                    <span className="text-xs text-muted-foreground">e outros Bluetooth Trackers</span>
                  </div>
                </th>
              </tr>
            </thead>
            {/* Table Body */}
            <tbody>
              {comparisons.map((item, index) => (
                <tr 
                  key={index}
                  className="border-t border-border/50"
                >
                  <td className="p-4 text-sm md:text-base text-foreground">
                    {item.feature}
                  </td>
                  <td className="p-4 bg-petloo-beige">
                    <div className="flex justify-center">
                      {renderCell(item.lootag)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      {renderCell(item.othersGPS)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      {renderCell(item.airtag)}
                    </div>
                  </td>
                </tr>
              ))}
              {/* Last row to close the rounded corners */}
              <tr>
                <td></td>
                <td className="bg-petloo-beige rounded-b-2xl h-4"></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link 
            href="#comprar"
            className="inline-flex px-8 py-4 bg-petloo-green text-white font-bold rounded-full hover:bg-petloo-green/90 transition-all hover:scale-105"
          >
            ESCOLHER A SEGURANCA PREMIUM
          </Link>
        </div>
      </div>
    </section>
  )
}
