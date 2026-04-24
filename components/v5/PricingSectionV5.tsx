"use client"

import { Check, Clock, Truck, Shield } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

type PlanKey = "essencial" | "completo" | "premium"

const plans = {
  essencial: {
    name: "Essencial",
    product: "lootag-essencial",
    price: 139.87,
    installment: "46,62",
    installments: 3,
    total: "139,87",
    savings: null,
    items: [
      { name: "Tag de rastreamento 4.0", originalPrice: "189,00", finalPrice: "139,87", firstMonth: false },
      { name: "Case de proteção Petloo", originalPrice: "30,00", finalPrice: "0,00", firstMonth: false },
      { name: "LooApp de rastreamento", originalPrice: "30,90", finalPrice: "0,00", firstMonth: true },
    ],
  },
  completo: {
    name: "Completo",
    product: "lootag-completo",
    price: 159.87,
    installment: "53,29",
    installments: 3,
    total: "159,87",
    savings: null,
    items: [
      { name: "Tag de rastreamento 4.0", originalPrice: "189,00", finalPrice: "incluída", firstMonth: false },
      { name: "Coleira Nato Exclusiva", originalPrice: "73,00", finalPrice: "incluída", firstMonth: false },
      { name: "Case de proteção Petloo", originalPrice: "30,00", finalPrice: "0,00", firstMonth: false },
      { name: "LooApp de rastreamento", originalPrice: "30,90", finalPrice: "0,00", firstMonth: true },
    ],
  },
  premium: {
    name: "Premium",
    product: "lootag-premium",
    price: 179.87,
    installment: "59,96",
    installments: 3,
    total: "179,87",
    savings: "R$193",
    items: [
      { name: "Tag personalizada com nome do pet gravado", originalPrice: "239,00", finalPrice: "incluída", firstMonth: false },
      { name: "Coleira Nato Exclusiva", originalPrice: "73,00", finalPrice: "incluída", firstMonth: false },
      { name: "Case de proteção Petloo", originalPrice: "30,00", finalPrice: "0,00", firstMonth: false },
      { name: "LooApp de rastreamento", originalPrice: "30,90", finalPrice: "0,00", firstMonth: true },
    ],
  },
}

export default function PricingSectionV5() {
  const [timeLeft, setTimeLeft] = useState(13 * 60)
  const [showSizeModal, setShowSizeModal] = useState(false)
  const [showDeviceModal, setShowDeviceModal] = useState(false)
  const [selectedPetSize, setSelectedPetSize] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("premium")
  const [showNameModal, setShowNameModal] = useState(false)
  const [petName, setPetName] = useState("")
  const [selectedDevice, setSelectedDevice] = useState("")

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const handleSelectPlan = (plan: PlanKey) => {
    setSelectedPlan(plan)
    setShowSizeModal(true)
  }

  const handleSelectSize = (size: string) => {
    setSelectedPetSize(size)
    setShowSizeModal(false)
    setShowDeviceModal(true)
  }

  const handleSelectDevice = (device: string) => {
    setShowDeviceModal(false)
    setSelectedDevice(device)

    if (selectedPlan === "premium") {
      // Plano Premium: abrir modal para coletar nome do pet
      setShowNameModal(true)
    } else {
      // Outros planos: ir direto pro checkout
      const plan = plans[selectedPlan]
      window.location.href = `/checkout?product=${plan.product}&price=${plan.price}&petSize=${selectedPetSize}&deviceType=${device}`
    }
  }

  const handleConfirmName = () => {
    if (petName.trim().length === 0) return
    setShowNameModal(false)
    const plan = plans[selectedPlan]
    window.location.href = `/checkout?product=${plan.product}&price=${plan.price}&petSize=${selectedPetSize}&deviceType=${selectedDevice}&petName=${encodeURIComponent(petName.trim())}`
  }

  const renderItems = (items: typeof plans.essencial.items) => (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-petloo-green/20 flex items-center justify-center">
              <Check className="w-3 h-3 text-petloo-green" />
            </div>
            <span className="text-sm text-muted-foreground leading-relaxed">{item.name}</span>
          </div>
          <div className="flex items-center gap-2 text-right flex-shrink-0 ml-2">
            <span className="text-xs text-muted-foreground line-through">
              R${item.originalPrice}
            </span>
            <div className="flex flex-col items-end">
              <span className={`font-bold text-sm ${item.finalPrice === "incluída" ? "text-petloo-green" : "text-petloo-purple"}`}>
                {item.finalPrice === "incluída" ? "incluída" : `R$${item.finalPrice}`}
              </span>
              {item.firstMonth && (
                <span className="text-xs text-muted-foreground">
                  no primeiro mês
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <section id="comprar" className="py-16 md:py-24 bg-gradient-to-b from-petloo-beige to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance mb-4">
            Escolha a proteção ideal para o seu pet
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Todos os planos incluem rastreamento por satélite em tempo real e 30 dias grátis do app
          </p>
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-12 items-start">

          {/* ========== CARD 3 — PREMIUM (DESTAQUE) — First on mobile ========== */}
          <div className="relative md:order-3 order-first md:scale-105 md:z-10">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
              <span className="bg-petloo-purple text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                ⭐ MAIS VENDIDO
              </span>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden border-2 border-petloo-purple ring-4 ring-petloo-purple/20 shadow-2xl h-full flex flex-col">
              {/* Header */}
              <div className="py-4 px-6 text-center bg-petloo-purple">
                <h3 className="text-lg font-bold text-white">Premium</h3>
              </div>

              {/* Imagem */}
              <img
                src="/images/Lootag oferta premium.jpeg"
                alt="Kit Premium Lootag"
                className="w-full h-auto object-cover"
              />

              <div className="p-6 flex flex-col flex-1">
                {/* Items */}
                <div className="mb-6 flex-1">
                  <h4 className="font-semibold text-foreground mb-4 text-base">O que está incluso:</h4>
                  {renderItems(plans.premium.items)}
                </div>

                {/* Savings + Price */}
                <div className="bg-petloo-beige rounded-2xl p-5 flex items-center justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <div className="bg-petloo-green/10 rounded-full px-4 py-2 w-fit">
                      <p className="text-sm font-bold text-petloo-green">
                        Economize {plans.premium.savings}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {plans.premium.installments}x sem juros
                    </p>
                    <p className="text-3xl font-bold text-petloo-purple mb-1">
                      R${plans.premium.installment}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total: R${plans.premium.total}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleSelectPlan("premium")}
                  className="block w-full py-3.5 font-bold text-base rounded-full text-center transition-all hover:scale-105 bg-petloo-green text-white hover:bg-petloo-green/90"
                >
                  Escolher Premium
                </button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  Frete grátis a partir de 2 unidades
                </p>
              </div>
            </div>
          </div>

          {/* ========== CARD 1 — ESSENCIAL ========== */}
          <div className="md:order-1">
            <div className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-md h-full flex flex-col">
              {/* Header */}
              <div className="py-4 px-6 text-center border-b border-gray-100">
                <h3 className="text-lg font-bold text-foreground">Essencial</h3>
              </div>

              {/* Imagem */}
              <img
                src="/images/Lootag oferta essencial.jpeg"
                alt="Kit Essencial Lootag"
                className="w-full h-auto object-cover"
              />

              <div className="p-6 flex flex-col flex-1">
                {/* Items */}
                <div className="mb-6 flex-1">
                  <h4 className="font-semibold text-foreground mb-4 text-base">O que está incluso:</h4>
                  {renderItems(plans.essencial.items)}
                </div>

                {/* Price */}
                <div className="bg-gray-50 rounded-2xl p-5 flex items-center justify-end gap-4 mb-6">
                  <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {plans.essencial.installments}x sem juros
                    </p>
                    <p className="text-3xl font-bold text-foreground mb-1">
                      R${plans.essencial.installment}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total: R${plans.essencial.total}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleSelectPlan("essencial")}
                  className="block w-full py-3 font-bold text-base rounded-full text-center transition-all border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                >
                  Escolher Essencial
                </button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  Frete grátis a partir de 2 unidades
                </p>
              </div>
            </div>
          </div>

          {/* ========== CARD 2 — COMPLETO ========== */}
          <div className="md:order-2">
            <div className="bg-white rounded-3xl overflow-hidden border-2 border-petloo-purple shadow-lg h-full flex flex-col">
              {/* Header */}
              <div className="py-4 px-6 text-center border-b border-petloo-purple/20">
                <h3 className="text-lg font-bold text-petloo-purple">Completo</h3>
              </div>

              {/* Imagem */}
              <img
                src="/images/Lootag oferta completo.jpeg"
                alt="Kit Completo Lootag"
                className="w-full h-auto object-cover"
              />

              <div className="p-6 flex flex-col flex-1">
                {/* Items */}
                <div className="mb-6 flex-1">
                  <h4 className="font-semibold text-foreground mb-4 text-base">O que está incluso:</h4>
                  {renderItems(plans.completo.items)}
                </div>

                {/* Price */}
                <div className="bg-petloo-beige rounded-2xl p-5 flex items-center justify-end gap-4 mb-6">
                  <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {plans.completo.installments}x sem juros
                    </p>
                    <p className="text-3xl font-bold text-petloo-purple mb-1">
                      R${plans.completo.installment}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total: R${plans.completo.total}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleSelectPlan("completo")}
                  className="block w-full py-3 font-bold text-base rounded-full text-center transition-all bg-petloo-purple text-white hover:bg-petloo-purple/90"
                >
                  Escolher Completo
                </button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  Frete grátis a partir de 2 unidades
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== SHARED SECTION BELOW CARDS ========== */}
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Aviso sobre quantidade */}
          <p className="text-xs text-muted-foreground text-center mb-2">
            📦 A quantidade de tags você escolhe no próximo passo, dentro do checkout.
          </p>

          {/* Stock Warning */}
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <Clock className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Apenas 12 unidades em estoque
              </p>
              <p className="text-xs text-red-600 font-bold">
                Previsão de acabar nos próximos {minutes}:{seconds.toString().padStart(2, "0")} minutos
              </p>
            </div>
          </div>

          {/* Free Shipping */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Truck className="w-5 h-5 text-petloo-purple flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Frete Grátis a partir de 2 unidades
              </p>
              <p className="text-xs text-muted-foreground">
                Entrega em até 6 dias
              </p>
            </div>
          </div>

          {/* Guarantee */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <Shield className="w-5 h-5 text-petloo-green flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                7 Dias de garantia
              </p>
              <p className="text-xs text-muted-foreground">
                Não é para você? Entre em contato em até 7 dias e garantimos seu dinheiro de volta
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            <Link
              href="/termos-de-uso-LooTag"
              target="_blank"
              className="underline hover:text-petloo-purple transition-colors"
            >
              Mais informações
            </Link>
            {" "}sobre os planos
          </p>
        </div>
      </div>

      {/* Modal de Tamanho do Pet */}
      {showSizeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setShowSizeModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Qual o tamanho do seu pet?</h2>
              <p className="text-sm text-gray-600">Escolha o tamanho ideal da coleira para o conforto do seu pet.</p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleSelectSize("P")}
                className="w-full border-2 border-gray-200 hover:border-petloo-purple rounded-xl p-4 text-left transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-gray-900">P — Pequeno</span>
                    <p className="text-sm text-gray-600 mt-1">Gatos e cães pequenos</p>
                    <p className="text-xs text-gray-500 mt-0.5">Até 8kg (ex: Shih Tzu, Pinscher, Yorkshire, gatos em geral)</p>
                  </div>
                  <span className="text-2xl">🐱</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectSize("M")}
                className="w-full border-2 border-gray-200 hover:border-petloo-purple rounded-xl p-4 text-left transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-gray-900">M — Médio</span>
                    <p className="text-sm text-gray-600 mt-1">Cães de porte médio</p>
                    <p className="text-xs text-gray-500 mt-0.5">De 8kg a 25kg (ex: Beagle, Bulldog, Cocker, Border Collie)</p>
                  </div>
                  <span className="text-2xl">🐕</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectSize("G")}
                className="w-full border-2 border-gray-200 hover:border-petloo-purple rounded-xl p-4 text-left transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-gray-900">G — Grande</span>
                    <p className="text-sm text-gray-600 mt-1">Cães de porte grande</p>
                    <p className="text-xs text-gray-500 mt-0.5">Acima de 25kg (ex: Labrador, Golden, Pastor Alemão, Rottweiler)</p>
                  </div>
                  <span className="text-2xl">🐕🦺</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowSizeModal(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Tipo de Dispositivo */}
      {showDeviceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setShowDeviceModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Qual o seu celular?</h2>
              <p className="text-sm text-gray-600">A tag de rastreamento funciona com o app Petloo. Precisamos saber seu sistema para enviar a tag compatível.</p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleSelectDevice("ios")}
                className="w-full border-2 border-gray-200 hover:border-petloo-purple rounded-xl p-4 text-left transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-gray-900">iPhone (iOS)</span>
                    <p className="text-sm text-gray-600 mt-1">Apple — iPhone, iPad</p>
                  </div>
                  <span className="text-2xl">🍎</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectDevice("android")}
                className="w-full border-2 border-gray-200 hover:border-petloo-purple rounded-xl p-4 text-left transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-gray-900">Android</span>
                    <p className="text-sm text-gray-600 mt-1">Samsung, Motorola, Xiaomi e outros</p>
                  </div>
                  <span className="text-2xl">🤖</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowDeviceModal(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Nome do Pet (apenas Premium) */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setShowNameModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">✨</span>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Qual o nome do seu pet?</h2>
              <p className="text-sm text-gray-600">O nome será gravado na tag personalizada. Confira antes de continuar!</p>
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value.slice(0, 15))}
                placeholder="Ex: Loki, Mel, Thor..."
                className="w-full border-2 border-gray-200 focus:border-petloo-purple rounded-xl p-4 text-center text-lg font-bold text-gray-900 outline-none transition-colors"
                autoFocus
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                {petName.length}/15 caracteres
              </p>
            </div>

            <button
              onClick={handleConfirmName}
              disabled={petName.trim().length === 0}
              className="w-full py-3 font-bold text-base rounded-full text-center transition-all bg-petloo-green text-white hover:bg-petloo-green/90 disabled:opacity-40 disabled:cursor-not-allowed mb-3"
            >
              Confirmar e continuar
            </button>

            <button
              onClick={() => setShowNameModal(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
