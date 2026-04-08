import HeaderV2 from "@/components/v2/HeaderV2"
import HeroSectionV2 from "@/components/v2/HeroSectionV2"
import SocialProofSectionV2 from "@/components/v2/SocialProofSectionV2"
import BenefitsSectionV2 from "@/components/v2/BenefitsSectionV2"
import FeaturesSectionV2 from "@/components/v2/FeaturesSectionV2"
import ComparisonSectionV2 from "@/components/v2/ComparisonSectionV2"
import TestimonialsSectionV2 from "@/components/v2/TestimonialsSectionV2"
import PricingSectionV3 from "@/components/v3/PricingSectionV3"
import FAQSectionV2 from "@/components/v2/FAQSectionV2"

export const metadata = {
  title: "Lootag - Rastreador GPS para Pets | Seguranca em Tempo Real",
  description: "O primeiro ecossistema de protecao via rastreamento em tempo real desenhado para o estilo de vida urbano. Coleira inteligente com GPS para caes e gatos.",
}

export default function V3Page() {
  return (
    <main className="min-h-screen bg-background">
      <HeaderV2 />
      <HeroSectionV2 />
      <SocialProofSectionV2 />
      <BenefitsSectionV2 />
      <FeaturesSectionV2 />
      <ComparisonSectionV2 />
      <TestimonialsSectionV2 />
      <PricingSectionV3 />
      <FAQSectionV2 />

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-8">
        <div className="container mx-auto px-4 text-center space-y-4">
          <img
            src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
            alt="Petloo Logo"
            className="h-8 mx-auto brightness-0 invert"
          />
          <div className="flex justify-center gap-6 text-sm text-white/60">
            <a href="/termos-de-uso-LooTag" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Termos de Uso
            </a>
            <a href="https://petloosupport.zendesk.com/hc/pt-br/requests/new" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Contato
            </a>
          </div>
          <p className="text-xs text-white/40">
            © 2025 Petloo — Todos os direitos reservados
          </p>
        </div>
      </footer>
    </main>
  )
}
