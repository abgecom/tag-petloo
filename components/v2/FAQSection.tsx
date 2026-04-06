"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqItems = [
  {
    question: "Como funciona a Tag de Rastreamento Petloo?",
    answer:
      "Basta colocar a tag na coleira do seu pet. Caso ele se perca, você poderá rastreá-lo facilmente através do app Petloo em tempo real.",
  },
  {
    question: "Como funciona o acesso ás funcionalidadees do app Petloo?",
    answer:
      "Ao adquirir a Tag, você tem acesso gratuito ao app por um período de 1 mês, com todas as funcionalidades completas: serviço de localização, registro oficial do pet, cartão de vacinas virtual, seguro pet e muito mais. A partir de 1 mês, será cobrado um valor equivalente a 1 real por dia para manter todos os serviços funcionando.",
  },
  {
    question: "Quanto tempo demora para receber minha Tag de rastreamento?",
    answer:
      "Após confirmação da compra, enviamos sua Tag em até 72 horas. Você receberá no endereço informado dentro do prazo do frete escolhido no checkout.",
  },
  {
    question: "Como faço para ativar o seguro Petloo?",
    answer:
      "Ao cadastrar sua Tag no app Petloo, seu pet fica automaticamente protegido com nosso seguro saúde gratuito. O seguro tem uma carência de 30 dias.",
  },
  {
    question: "Posso cancelar meu acesso ao aplicativo quando quiser?",
    answer: "Sim, você pode cancelar seu acesso ao aplicativo Petloo quando quiser, sem taxas adicionais.",
  },
]

export default function FAQSection() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-black text-center">Perguntas Frequentes</h2>
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="space-y-4">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index + 1}`}
              className="bg-white rounded-lg border border-gray-200 px-6"
            >
              <AccordionTrigger className="text-left font-semibold text-black hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 pb-4">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
