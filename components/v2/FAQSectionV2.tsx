"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

export default function FAQSectionV2() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "Como funciona a assinatura do app?",
      answer: "A mensalidade de R$30,90 mantém a proteção do seu pet ativa 24 horas por dia via satélite em tempo real, 7 dias por semana. Por menos de R$1 por dia — menos do que um estacionamento — você tem: localização em tempo real via satélite, alerta instantâneo se o pet sair de uma zona segura, RG Digital, carteira de vacinas com lembretes e uma coleira exclusiva. Toda tranquilidade que você merece, no seu bolso. Você testa grátis por 30 dias e cancela quando quiser, se não gostar você fica com a coleira estilosa Petloo.",
    },
    {
      question: "A coleira e resistente a agua?",
      answer: "Sim, foi desenhada para a vida real, incluindo chuva e brincadeiras. Nossa tecnologia e 100% a prova d'agua, permitindo que seu pet aproveite todas as aventuras sem preocupacoes.",
    },
    {
      question: "Preciso carregar a bateria?",
      answer: "Nao, nossa tecnologia de baixo consumo garante autonomia para sua paz de espirito. A bateria dura em media de 12 a 18 meses dependendo do uso. Posteriormente pode ser trocada de forma simples sem necessidade de ferramentas.",
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
    <section id="faq" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-petloo-purple uppercase tracking-wider mb-3">
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
                className="bg-petloo-beige rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-petloo-beige/80 transition-colors"
                  aria-expanded={openIndex === index}
                >
                  <span className="font-semibold text-foreground pr-4">
                    {faq.question}
                  </span>
                  <span className="flex-shrink-0 w-8 h-8 bg-petloo-purple/10 rounded-full flex items-center justify-center">
                    {openIndex === index ? (
                      <Minus className="w-4 h-4 text-petloo-purple" />
                    ) : (
                      <Plus className="w-4 h-4 text-petloo-purple" />
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
