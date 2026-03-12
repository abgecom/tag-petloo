"use client"

import { useState } from "react"
import PersonalizationPopup from "@/components/PersonalizationPopup"
import ColorSelectionPopup from "@/components/ColorSelectionPopup"

import HeroSection from "./HeroSection"
import SocialProofSection from "./SocialProofSection"
import BenefitsSection from "./BenefitsSection"
import HowItWorksSection from "./HowItWorksSection"
import TestimonialsSection from "./TestimonialsSection"
import RescueSection from "./RescueSection"
import PaymentSection from "./PaymentSection"
import GiftsSection from "./GiftsSection"
import FAQSection from "./FAQSection"
import FooterSection from "./FooterSection"

export default function ProductOfferV2() {
  const [isPersonalizationPopupOpen, setIsPersonalizationPopupOpen] = useState(false)
  const [isColorSelectionPopupOpen, setIsColorSelectionPopupOpen] = useState(false)

  const openPersonalizationPopup = () => setIsPersonalizationPopupOpen(true)
  const closePersonalizationPopup = () => setIsPersonalizationPopupOpen(false)
  const openColorSelectionPopup = () => setIsColorSelectionPopupOpen(true)
  const closeColorSelectionPopup = () => setIsColorSelectionPopupOpen(false)

  const handlePersonalize = () => {
    closePersonalizationPopup()
    openColorSelectionPopup()
  }

  const handleSkipPersonalization = () => {
    closePersonalizationPopup()
    window.location.replace("/checkout")
  }

  const handleFinalizePurchase = (color: "orange" | "purple", petName: string) => {
    closeColorSelectionPopup()
    const priceId = color === "orange" ? "price_1RjRxWRtGASrDbfeP7jp0wb0" : "price_1RjRyURtGASrDbfeuppcCqtm"
    sessionStorage.setItem(
      "personalizedProduct",
      JSON.stringify({
        color,
        priceId,
        amount: 4990,
        name: `Tag ${color === "orange" ? "Laranja" : "Roxa"} Personalizada + App`,
        petName: petName,
      }),
    )
    const params = new URLSearchParams({
      personalized: "true",
      color: color,
      priceId: priceId,
      amount: "4990",
      petName: encodeURIComponent(petName),
    })
    window.location.replace(`/checkout?${params.toString()}`)
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: "#F1E9DB" }}>
      <div className="max-w-4xl mx-auto space-y-12">
        <HeroSection />
        <SocialProofSection />
        <BenefitsSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <RescueSection onOpenPersonalizationPopup={openPersonalizationPopup} />
        <PaymentSection />
        <GiftsSection />
        <FAQSection />
        <FooterSection />

        {/* Custom Styles */}
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes float {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-3px);
            }
          }

          .animate-slide-in-left {
            animation: slideInLeft 0.5s ease-out forwards;
          }

          .animate-slide-in-right {
            animation: slideInRight 0.5s ease-out forwards;
          }

          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out forwards;
          }

          .benefit-item {
            animation-fill-mode: both;
            transition: transform 0.2s ease;
            position: relative;
            will-change: transform;
          }

          .benefit-item:hover {
            transform: translateY(-3px);
          }

          .benefit-item::after {
            content: "";
            position: absolute;
            bottom: -12px;
            left: 50%;
            transform: translateX(-50%);
            width: 70%;
            height: 12px;
            background: rgba(0, 0, 0, 0.25);
            border-radius: 50%;
            filter: blur(6px);
            opacity: 0.8;
          }

          .benefit-item {
            animation: slideInLeft 0.5s ease-out forwards, float 2s ease-in-out infinite 0.8s;
          }

          .animate-slide-in-right .benefit-item {
            animation: slideInRight 0.5s ease-out forwards, float 2s ease-in-out infinite 0.8s;
          }

          @media (prefers-reduced-motion: reduce) {
            .benefit-item,
            .animate-slide-in-left,
            .animate-slide-in-right,
            .animate-fade-in-up {
              animation: none !important;
              opacity: 1 !important;
              transform: none !important;
            }
          }
        `}</style>

        {/* Pop-ups */}
        <PersonalizationPopup
          isOpen={isPersonalizationPopupOpen}
          onClose={closePersonalizationPopup}
          onPersonalize={handlePersonalize}
          onSkipPersonalization={handleSkipPersonalization}
          price="49.90"
        />

        <ColorSelectionPopup
          isOpen={isColorSelectionPopupOpen}
          onClose={closeColorSelectionPopup}
          onFinalizePurchase={handleFinalizePurchase}
        />
      </div>
    </div>
  )
}
