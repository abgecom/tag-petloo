"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const testimonials = [
  {
    initial: "F",
    name: "Fernanda Almeida",
    text: "Minha gatinha sumiu perto do sítio e estava presa na mata. A tag foi essencial! Achei a Luna rapidinho. Recomendo muito!",
    gradient: "from-purple-400 to-pink-400",
  },
  {
    initial: "A",
    name: "Ana Clara Mendes",
    text: "O rastreamento é excelente, localizei o Juca em menos de 5 minutos. Segurança total pro meu coração e pro meu peludinho!",
    gradient: "from-blue-400 to-cyan-400",
  },
  {
    initial: "M",
    name: "Mariana Diniz",
    text: "Tenho 5 cães e sempre esquecia as datas das vacinas e vermífugos. Agora recebo as notificações pelo app e nunca mais atrasei. Simplesmente perfeito!",
    gradient: "from-green-400 to-emerald-400",
  },
  {
    initial: "L",
    name: "Letícia Barbosa",
    text: "O seguro dentro do app e já estou utilizando. Vale muito a pena, principalmente pra quem se preocupa com gastos inesperados.",
    gradient: "from-orange-400 to-red-400",
  },
  {
    initial: "P",
    name: "Paula Castro",
    text: "Muito prático! As notificações do cartão de vacinas me ajudam demais, principalmente pra mim que tenho vários gatos.",
    gradient: "from-pink-400 to-rose-400",
  },
  {
    initial: "J",
    name: "João Vítor Andrade",
    text: "Meu dog tinha fugido do parquinho por causa de um rojão que estouraram e assustou ele, saiu correndo e não consegui pegar. Achei ele numa rua distante aqui do bairro, tudo graças ao rastreamento da tag da Petloo. Não vivo mais sem!",
    gradient: "from-indigo-400 to-purple-400",
  },
  {
    initial: "C",
    name: "Camila Freitas",
    text: "Minha gatinha adora fugir pra explorar, mas agora fico tranquila com a tag. Achei ela em menos de 10 minutos perto de casa.",
    gradient: "from-teal-400 to-blue-400",
  },
]

const TestimonialCard = ({
  initial,
  name,
  text,
  gradient,
}: { initial: string; name: string; text: string; gradient: string }) => (
  <div className="flex-shrink-0 w-80 bg-white rounded-2xl p-6 shadow-lg whitespace-normal">
    <div className="flex items-center mb-4">
      <div
        className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center text-white font-bold text-lg`}
      >
        {initial}
      </div>
      <div className="ml-3">
        <h4 className="font-semibold text-gray-800 text-sm">{name}</h4>
        <div className="flex text-yellow-400 text-sm">⭐⭐⭐⭐⭐</div>
      </div>
    </div>
    <p className="text-gray-700 text-sm leading-relaxed">{text}</p>
  </div>
)

export default function TestimonialsSection() {
  const testimonialsRef = useRef<HTMLDivElement>(null)

  const scrollTestimonials = (direction: "left" | "right") => {
    if (testimonialsRef.current) {
      const scrollAmount = 320
      const currentScroll = testimonialsRef.current.scrollLeft
      const targetScroll = direction === "left" ? currentScroll - scrollAmount : currentScroll + scrollAmount

      testimonialsRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="py-20" style={{ backgroundColor: "#F1E9DB" }}>
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">
          Veja o que estão dizendo sobre a tag + app Petloo
        </h2>
      </div>

      <div className="relative">
        <button
          onClick={() => scrollTestimonials("left")}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-200 hover:scale-110"
          aria-label="Depoimento anterior"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        <button
          onClick={() => scrollTestimonials("right")}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-200 hover:scale-110"
          aria-label="Próximo depoimento"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>

        <div ref={testimonialsRef} className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide pl-6 md:pl-12">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
          <div className="flex-shrink-0 w-1 md:w-6"></div>
        </div>
      </div>
    </div>
  )
}
