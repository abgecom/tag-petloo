import HeaderV2 from "@/components/v2/HeaderV2"
import HeroSectionV2 from "@/components/v2/HeroSectionV2"
import SocialProofSectionV2 from "@/components/v2/SocialProofSectionV2"
import BenefitsSectionV2 from "@/components/v2/BenefitsSectionV2"
import FeaturesSectionV2 from "@/components/v2/FeaturesSectionV2"
import ComparisonSectionV2 from "@/components/v2/ComparisonSectionV2"
import TestimonialsSectionV2 from "@/components/v2/TestimonialsSectionV2"
import PricingSectionV2 from "@/components/v2/PricingSectionV2"
import FAQSectionV2 from "@/components/v2/FAQSectionV2"

export const metadata = {
  title: "Lootag - Rastreador GPS para Pets | Seguranca em Tempo Real",
  description: "O primeiro ecossistema de protecao via rastreamento em tempo real desenhado para o estilo de vida urbano. Coleira inteligente com GPS para caes e gatos.",
}

export default function V2Page() {
  return (
    <main className="min-h-screen bg-background">
      <HeaderV2 />
      <HeroSectionV2 />
      <SocialProofSectionV2 />
      <BenefitsSectionV2 />
      <FeaturesSectionV2 />
      <ComparisonSectionV2 />
      <TestimonialsSectionV2 />
      <PricingSectionV2 />
      <FAQSectionV2 />
    </main>
  )
}
