import { Star, CheckCircle, Users } from "lucide-react"

export default function SocialProofSectionV2() {
  const stats = [
    {
      icon: Star,
      value: "4.9/5",
      label: "na App Store & Play Store",
    },
    {
      icon: CheckCircle,
      value: "Selo de Excelencia",
      label: "no Reclame Aqui",
    },
    {
      icon: Users,
      value: "+100.000",
      label: "Pets protegidos em todo o Brasil",
    },
  ]

  return (
    <section className="py-8 md:py-12 bg-petloo-beige border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="flex items-center justify-center gap-4 text-center md:text-left"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-petloo-purple/10 rounded-full flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-petloo-purple" />
              </div>
              <div>
                <p className="font-bold text-lg text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
