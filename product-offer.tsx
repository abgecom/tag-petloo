"use client"

import { Check, ShoppingCart, Shield, Truck, RotateCcw, Award, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useState } from "react"
import PersonalizationPopup from "@/components/PersonalizationPopup"
import ColorSelectionPopup from "@/components/ColorSelectionPopup"

export default function ProductOffer() {
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
    // Use replace instead of href for faster navigation
    window.location.replace("/checkout")
  }

  const handleFinalizePurchase = (color: "orange" | "purple", petName: string) => {
    closeColorSelectionPopup()

    // Definir o price_id baseado na cor escolhida
    const priceId = color === "orange" ? "price_1RjRxWRtGASrDbfeP7jp0wb0" : "price_1RjRyURtGASrDbfeuppcCqtm"

    // Pre-save data to sessionStorage before navigation for faster loading
    sessionStorage.setItem(
      "personalizedProduct",
      JSON.stringify({
        color,
        priceId,
        amount: 3990,
        name: `Tag ${color === "orange" ? "Laranja" : "Roxa"} Personalizada + App`,
        petName: petName, // Adicionar nome do pet
      }),
    )

    // Use replace for faster navigation
    const params = new URLSearchParams({
      personalized: "true",
      color: color,
      priceId: priceId,
      amount: "3990",
      petName: encodeURIComponent(petName), // Adicionar à URL também
    })

    window.location.replace(`/checkout?${params.toString()}`)
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: "#F1E9DB" }}>
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Title Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-black leading-tight">
            Perder seu pet não é mais uma opção. Chegou a Tag de Rastreamento Petloo
          </h1>
          <p className="text-gray-700 text-xl font-medium">
            Mais segurança para seu pet com rastreamento completo, RG digital, cartão de vacinas com lembretes e seguro
            saúde gratuito no app Petloo.
          </p>
        </div>

        {/* Social Proof Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-200">
            <span className="text-gray-800 font-medium">Mais 100 mil Pets seguros em todo Brasil</span>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
              <span className="text-gray-700 font-semibold ml-1">4,8/5</span>
            </div>
          </div>

          {/* Social Proof Image */}
          <div className="max-w-2xl mx-auto">
            <img
              src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/20250710_1202_Tinoco%20e%20Tecnologia_simple_compose_01jztdnj16eeprx5w1snhshss3.png"
              alt="Prova social - Pets seguros com Petloo"
              className="w-full h-auto rounded-lg shadow-md"
            />
          </div>
        </div>

        {/* Benefits Section */}
        <div className="py-16 px-4 md:px-12 -mx-4" style={{ backgroundColor: "#F1E9DB" }}>
          <div className="max-w-6xl mx-auto">
            {/* Headline */}
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 animate-fade-in-up text-black">
              Benefícios de ser time Petloo
            </h2>

            {/* Mobile Layout */}
            <div className="lg:hidden space-y-8">
              {/* First 3 benefits - Above image on mobile */}
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-3 benefit-item animate-slide-in-left">
                  <span className="text-2xl">🛰️</span>
                  <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                    Rastreamento em tempo real
                  </span>
                </div>
                <div
                  className="flex items-center justify-center gap-3 benefit-item animate-slide-in-left"
                  style={{ animationDelay: "0.2s" }}
                >
                  <span className="text-2xl">🐶</span>
                  <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                    Tag leve e personalizada
                  </span>
                </div>
                <div
                  className="flex items-center justify-center gap-3 benefit-item animate-slide-in-left"
                  style={{ animationDelay: "0.4s" }}
                >
                  <FileText className="text-2xl" style={{ color: "#75004A" }} />
                  <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                    Registro oficial do pet
                  </span>
                </div>
              </div>

              {/* Center Image */}
              <div>
                <img
                  src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Fotos%20da%20LP/20250710_1226_Cachorro%20no%20Parque_simple_compose_01jztezxy5e1199htb50hwqc18.png"
                  alt="Cachorro no parque - Benefícios Petloo"
                  className="w-full h-auto rounded-2xl shadow-lg"
                />
              </div>

              {/* Last 3 benefits - Below image on mobile */}
              <div className="space-y-6">
                <div
                  className="flex items-center justify-center gap-3 benefit-item animate-slide-in-right"
                  style={{ animationDelay: "0.6s" }}
                >
                  <span className="text-2xl">💉</span>
                  <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                    Cartão de vacinas com lembretes
                  </span>
                </div>
                <div
                  className="flex items-center justify-center gap-3 benefit-item animate-slide-in-right"
                  style={{ animationDelay: "0.8s" }}
                >
                  <span className="text-2xl">🛡️</span>
                  <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                    Seguro saúde gratuito
                  </span>
                </div>
                <div
                  className="flex items-center justify-center gap-3 benefit-item animate-slide-in-right"
                  style={{ animationDelay: "1s" }}
                >
                  <span className="text-2xl">📱</span>
                  <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                    App exclusivo Petloo
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-12 items-center">
              {/* Left Side - Benefits */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 benefit-item animate-slide-in-left">
                  <span className="text-2xl">🛰️</span>
                  <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                    Encontre o seu pet em caso de perda
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 benefit-item animate-slide-in-left"
                  style={{ animationDelay: "0.2s" }}
                >
                  <span className="text-2xl">🐶</span>
                  <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                    Tag leve e personalizada
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 benefit-item animate-slide-in-left"
                  style={{ animationDelay: "0.4s" }}
                >
                  <FileText className="text-2xl" style={{ color: "#75004A" }} />
                  <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                    Registro oficial do pet
                  </span>
                </div>
              </div>

              {/* Center - Image */}
              <div>
                <img
                  src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Fotos%20da%20LP/20250710_1226_Cachorro%20no%20Parque_simple_compose_01jztezxy5e1199htb50hwqc18.png"
                  alt="Cachorro no parque - Benefícios Petloo"
                  className="w-full h-auto rounded-2xl shadow-lg"
                />
              </div>

              {/* Right Side - Benefits */}
              <div className="space-y-6">
                <div
                  className="flex items-center gap-3 benefit-item animate-slide-in-right"
                  style={{ animationDelay: "0.6s" }}
                >
                  <span className="text-2xl">💉</span>
                  <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                    Cartão de vacinas com lembretes
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 benefit-item animate-slide-in-right"
                  style={{ animationDelay: "0.8s" }}
                >
                  <span className="text-2xl">🛡️</span>
                  <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                    Seguro saúde gratuito
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 benefit-item animate-slide-in-right"
                  style={{ animationDelay: "1s" }}
                >
                  <span className="text-2xl">📱</span>
                  <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                    App exclusivo Petloo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Como Funciona Section */}
        <div className="py-20 px-6 md:px-12 -mx-4" style={{ backgroundColor: "#F1E9DB" }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              {/* Lado Esquerdo - Texto */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl md:text-5xl font-bold text-black mb-4 font-sans">
                  Como funciona a tag Petloo?{" "}
                </h2>
                <p className="text-lg md:text-xl text-black mb-6">
                  {
                    "Você recebe em sua casa a tag rastreadora e se cadastra no app Petloo. Dentro do app você conecta a sua tag única com os dados do seu Pet e a partir dai, você já consegue localiza-lo. "
                  }{" "}
                </p>

                {/* Lista de etapas (opcional) */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    <p className="text-gray-700">Receba sua Tag personalizada em casa</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    <p className="text-gray-700">Baixe o app Petloo e cadastre seu pet</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    <p className="text-gray-700">Coloque a Tag na coleira e tenha segurança total</p>
                  </div>
                </div>
              </div>

              {/* Lado Direito - Imagem */}
              <div className="flex-1">
                <div className="w-full h-[400px] md:h-[500px] bg-gray-200 rounded-2xl flex items-center justify-center">
                  <img
                    src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/video%20para%20gif%20petloo.gif"
                    alt="Como funciona o kit Petloo"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resgate Section Title */}
        <div className="text-center py-8">
          <h2 className="text-3xl md:text-4xl font-bold text-black">Resgate agora a sua Tag</h2>
        </div>

        {/* Main Content */}
        <div className="text-center">
          <img
            src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Fotos%20da%20LP/Frame%208940560-EIvm6iJOyX4PH5iRHdP9ouPNNnFr7D.png"
            alt="Cachorro com tag no pescoço e mão segurando celular com mapa"
            className="w-full max-w-lg rounded-2xl mx-auto shadow-md"
          />
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Button
            onClick={openPersonalizationPopup}
            className="text-white px-20 py-8 text-2xl font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#24B14C" }}
          >
            <ShoppingCart className="w-8 h-8 mr-4" />
            Pedir agora
          </Button>
          <p className="text-gray-600 text-sm mt-3">Cancele a qualquer momento </p>
        </div>

        {/* Terms and Checkout */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <input type="checkbox" id="terms" className="rounded" defaultChecked />
            <label htmlFor="terms" className="text-sm text-gray-700">
              Concordo com os <span className="underline">termos de compra</span> e{" "}
              <span className="underline">privacidade</span>
            </label>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Pagamento seguro </h3>
            <div className="flex justify-center items-center gap-4">
              <img
                src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/visa-BRBd7AI7oDhyBwzy47g6H1kt5cjCOs.svg"
                alt="Visa"
                className="h-8"
              />
              <img
                src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/mastercard-RHKlJLfpzUysKGBW778wrPcURdL1Vs.svg"
                alt="Mastercard"
                className="h-8"
              />
              <img
                src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/dinersclub-tq3yQnCJ6s2ItWpeEolHVKr0sOIMXZ.svg"
                alt="Diners Club"
                className="h-8"
              />
              <img
                src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/amex-Pg3sjSq06QovPei03PSTS9ZvqcHM3m.svg"
                alt="American Express"
                className="h-8"
              />
            </div>
          </div>

          {/* Guarantees - Horizontal Layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 text-sm">
              <Award className="w-5 h-5" style={{ color: "#24B14C" }} />
              <span className="text-gray-700">Selo de qualidade </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Truck className="w-5 h-5" style={{ color: "#24B14C" }} />
              <span className="text-gray-700">Frete expresso </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <RotateCcw className="w-5 h-5" style={{ color: "#24B14C" }} />
              <span className="text-gray-700">Garantia da loja </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-5 h-5" style={{ color: "#24B14C" }} />
              <span className="text-gray-700">Feito no Brasil </span>
            </div>
          </div>
        </div>

        {/* Free Gifts Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 text-center">Você também vai ganhar um presente </h2>

          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Gift 1 */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <img
                  src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/imglivro%2Bapp-gN8BH9qlfyUtbsEnqZgmjWWHN1pL2e.png"
                  alt="Ultimate Guide Book"
                  className="w-16 h-20 rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-600 line-through">R$79.90</span>
                    <span
                      className="px-2 py-1 rounded text-white text-sm font-bold"
                      style={{ backgroundColor: "#24B14C" }}
                    >
                      grátis
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-1">
                    Acesso ao Loobook, o mais completo e certeiro guia de adestramento{" "}
                  </h4>
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4" style={{ color: "#24B14C" }} />
                    <span className="text-sm font-medium" style={{ color: "#24B14C" }}>
                      você ganhou
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-black text-center">Perguntas Frequentes</h2>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-white rounded-lg border border-gray-200 px-6">
                <AccordionTrigger className="text-left font-semibold text-black hover:no-underline">
                  Como funciona a Tag de Rastreamento Petloo?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 pb-4">
                  Basta colocar a tag na coleira do seu pet. Caso ele se perca, você poderá rastreá-lo facilmente
                  através do app Petloo em tempo real.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-white rounded-lg border border-gray-200 px-6">
                <AccordionTrigger className="text-left font-semibold text-black hover:no-underline">
                  Como funciona o acesso ás funcionalidadees do app Petloo?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 pb-4">
                  Ao adquirir a Tag, você tem acesso gratuito ao app por um período de 1 mês, com todas as
                  funcionalidades completas: serviço de localização, registro oficial do pet, cartão de vacinas virtual,
                  seguro pet e muito mais. A partir de 1 mês, será cobrado um valor equivalente a 1 real por dia para
                  manter todos os serviços funcionando.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-white rounded-lg border border-gray-200 px-6">
                <AccordionTrigger className="text-left font-semibold text-black hover:no-underline">
                  Quanto tempo demora para receber minha Tag de rastreamento?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 pb-4">
                  Após confirmação da compra, enviamos sua Tag em até 72 horas. Você receberá no endereço informado
                  dentro do prazo do frete escolhido no checkout.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-white rounded-lg border border-gray-200 px-6">
                <AccordionTrigger className="text-left font-semibold text-black hover:no-underline">
                  Como faço para ativar o seguro Petloo?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 pb-4">
                  Ao cadastrar sua Tag no app Petloo, seu pet fica automaticamente protegido com nosso seguro saúde
                  gratuito.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-white rounded-lg border border-gray-200 px-6">
                <AccordionTrigger className="text-left font-semibold text-black hover:no-underline">
                  Posso cancelar meu acesso ao aplicativo quando quiser?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 pb-4">
                  Sim, você pode cancelar seu acesso ao aplicativo Petloo quando quiser, sem taxas adicionais.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-300 pt-8 mt-12">
          <div className="text-center space-y-6">
            {/* Logo */}
            <div>
              <img
                src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
                alt="Petloo Logo"
                className="h-16 mx-auto"
              />
            </div>

            {/* Links */}
            <div className="flex justify-center gap-8 text-sm">
              <a href="#" className="text-black hover:underline">
                Termos de Uso
              </a>
              <a href="#" className="text-black hover:underline">
                Política de Privacidade
              </a>
            </div>

            {/* Copyright */}
            <div className="text-sm text-black">© 2025 Petloo – Todos os direitos reservados</div>
          </div>
        </footer>

        {/* Custom Styles */}
        <style jsx>{`
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
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-3px);
    }
  }

  .animate-slide-in-left {
    animation: slideInLeft 0.5s ease-out forwards;
    opacity: 0;
  }

  .animate-slide-in-right {
    animation: slideInRight 0.5s ease-out forwards;
    opacity: 0;
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
    content: '';
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

  /* Performance optimizations */
  @media (prefers-reduced-motion: no-preference) {
    .benefit-item {
      opacity: 0;
      transform: translateX(-30px);
    }
    
    .benefit-item.animate-slide-in-right {
      transform: translateX(30px);
    }
  }

  /* Reduce motion for accessibility */
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
