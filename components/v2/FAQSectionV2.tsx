"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

export default function FAQSectionV2() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "Como funciona a assinatura?",
      answer: "E um valor fixo mensal que garante a conexao via satelite e as atualizacoes do app. Voce pode cancelar a qualquer momento, sem multas ou taxas adicionais.",
    },
    {
      question: "A coleira e resistente a agua?",
      answer: "Sim, foi desenhada para a vida real, incluindo chuva e brincadeiras. Nossa tecnologia e 100% a prova d'agua, permitindo que seu pet aproveite todas as aventuras sem preocupacoes.",
    },
    {
      question: "Preciso carregar a bateria?",
      answer: "Sim, mas nossa tecnologia de baixo consumo garante autonomia para sua paz de espirito. A bateria dura em media de 5 a 14 dias dependendo do uso, e o carregamento completo leva apenas algumas horas.",
    },
    {
      question: "Como comeco a utilizar o dispositivo?",
      answer: "Apos receber seu kit, basta baixar o app Lootag (disponivel para iOS e Android), criar sua conta, e ativar o dispositivo seguindo as instrucoes simples. Em menos de 2 minutos voce estara rastreando seu pet.",
    },
    {
      question: "Funciona em qualquer lugar do Brasil?",
      answer: "Sim! A Lootag utiliza tecnologia de satelite com cobertura nacional. Funciona em todas as cidades e regioes do Brasil onde ha sinal de rede movel.",
    },
    {
      question: "E adequado para gatos?",
      answer: "Absolutamente! Nossa coleira foi projetada para ser leve e confortavel, adequada tanto para caes quanto para gatos com mais de 2kg. O design compacto nao incomoda nem os pets mais sensiveis.",
    },
  ]

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-lootag-teal uppercase tracking-wider mb-3">
            Duvidas?
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
            Perguntas frequentes (FAQs)
          </h2>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-lootag-gray rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-lootag-gray/80 transition-colors"
                  aria-expanded={openIndex === index}
                >
                  <span className="font-semibold text-foreground pr-4">
                    {faq.question}
                  </span>
                  <span className="flex-shrink-0 w-8 h-8 bg-lootag-teal/10 rounded-full flex items-center justify-center">
                    {openIndex === index ? (
                      <Minus className="w-4 h-4 text-lootag-teal" />
                    ) : (
                      <Plus className="w-4 h-4 text-lootag-teal" />
                    )}
                  </span>
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-6">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
