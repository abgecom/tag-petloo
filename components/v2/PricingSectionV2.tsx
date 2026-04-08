"use client"

import { Check, Clock, Truck, Shield } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

export default function PricingSectionV2() {
  const [timeLeft, setTimeLeft] = useState(13 * 60)
  const [showSizeModal, setShowSizeModal] = useState(false)
  const [showDeviceModal, setShowDeviceModal] = useState(false)
  const [selectedPetSize, setSelectedPetSize] = useState("")

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const kitItems = [
    { name: "Coleira Nato Exclusiva", originalPrice: "73,00", finalPrice: "0,00" },
    { name: "Case de proteção Petloo", originalPrice: "30,00", finalPrice: "0,00" },
    { name: "Tag de rastreamento 4.0", originalPrice: "189,00", finalPrice: "89,87" },
    { name: "LooApp Exclusivo de rastreamento", originalPrice: "30,90", finalPrice: "0,00", firstMonth: true },
  ]

  return (
    <section id="comprar" className="py-16 md:py-24 bg-gradient-to-b from-petloo-beige to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance mb-4">
            Ecossistema Completo de Rastreamento
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Por menos de R$ 1,00 por dia, voce garante que a historia do seu pet nunca tenha um capitulo perdido
          </p>
        </div>



        {/* Single Pricing Card */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white rounded-3xl overflow-hidden border border-petloo-purple ring-2 ring-petloo-purple shadow-2xl shadow-petloo-purple/20">
            {/* Plan Title Header */}
            <div className="py-4 px-6 text-center border-b border-border/30 bg-petloo-purple">
              <h3 className="text-lg font-bold text-white">
                Proteção completa para 1 pet
              </h3>
            </div>

            {/* Pricing Section */}
            <div className="p-6">
              {/* Imagem do Kit dentro do card */}
              <div className="mb-6 -mx-6 -mt-6">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_sp1jwfsp1jwfsp1j.png-mWfJvbDukdwhtbQveewIYC6X8CzGRW.jpeg"
                  alt="Kit Petloo Completo"
                  width={1200}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
              {/* Kit Contents - O que está incluso */}
              <div className="mb-6">
                <h4 className="font-semibold text-foreground mb-4 text-base">
                  O que está incluso no seu kit:
                </h4>
                <div className="space-y-4">
                  {kitItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-petloo-green/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-petloo-green" />
                        </div>
                        <span className="text-sm text-muted-foreground leading-relaxed">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <span className="text-xs text-muted-foreground line-through">
                          R${item.originalPrice}
                        </span>
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-sm text-petloo-purple">
                            R${item.finalPrice}
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
              </div>

              {/* Guarantees */}
              <div className="bg-petloo-beige rounded-2xl p-5 flex items-center justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="bg-petloo-green/10 rounded-full px-4 py-2 w-fit">
                    <p className="text-sm font-bold text-petloo-green">
                      Economize R$233
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground line-through">
                      R$292,00
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    3x sem juros
                  </p>
                  <p className="text-4xl font-bold text-petloo-purple mb-1">
                    R$29,96
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total: R$89,87
                  </p>
                </div>
              </div>

              {/* Aviso sobre quantidade */}
              <p className="text-xs text-muted-foreground text-center mb-3">
                📦 A quantidade de tags você escolhe no próximo passo, dentro do checkout.
              </p>

              {/* CTA Button */}
              <button
                onClick={() => setShowSizeModal(true)}
                className="block w-full py-3 font-bold text-base rounded-full text-center transition-all hover:scale-105 bg-petloo-green text-white hover:bg-petloo-green/90 mb-3"
              >
                Adquirir kit de proteção
              </button>

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground text-center mb-6">
                <Link 
                  href="/termos-de-uso-LooTag"
                  target="_blank"
                  className="underline hover:text-petloo-purple transition-colors"
                >
                  Mais informações
                </Link>
                {' '}sobre o plano
              </p>

              {/* Stock Warning */}
              <div className="flex items-start gap-3 mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
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
              <div className="flex items-start gap-3 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
            </div>
          </div>
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
              {/* Tamanho P */}
              <button
                onClick={() => {
                  setShowSizeModal(false)
                  setSelectedPetSize("P")
                  setShowDeviceModal(true)
                }}
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

              {/* Tamanho M */}
              <button
                onClick={() => {
                  setShowSizeModal(false)
                  setSelectedPetSize("M")
                  setShowDeviceModal(true)
                }}
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

              {/* Tamanho G */}
              <button
                onClick={() => {
                  setShowSizeModal(false)
                  setSelectedPetSize("G")
                  setShowDeviceModal(true)
                }}
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
                onClick={() => {
                  setShowDeviceModal(false)
                  window.location.href = `/checkout?product=lootag-kit&price=89.87&petSize=${selectedPetSize}&deviceType=ios`
                }}
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
                onClick={() => {
                  setShowDeviceModal(false)
                  window.location.href = `/checkout?product=lootag-kit&price=89.87&petSize=${selectedPetSize}&deviceType=android`
                }}
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
    </section>
  )
}
