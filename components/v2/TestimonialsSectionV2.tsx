"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"

export default function TestimonialsSectionV2() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials = [
    {
      quote: "A tranquilidade de soltar o Thor no parque sabendo que ele esta 'no meu radar' nao tem preco.",
      author: "Mariana S.",
      location: "Sao Paulo",
      petName: "Thor",
    },
    {
      quote: "Nunca mais tive aquele frio na barriga quando o portao fica aberto por acidente. A Lootag me da paz.",
      author: "Carlos R.",
      location: "Rio de Janeiro",
      petName: "Luna",
    },
    {
      quote: "Meu gato adora fugir pela janela. Com a Lootag, sei exatamente onde ele esta em segundos.",
      author: "Patricia M.",
      location: "Belo Horizonte",
      petName: "Milo",
    },
  ]

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section id="depoimentos" className="py-16 md:py-24 bg-lootag-dark text-white overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-lootag-teal uppercase tracking-wider mb-3">
            Depoimentos
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-balance">
            O que os tutores tem a dizer
          </h2>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main testimonial */}
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 text-center">
            <Quote className="w-12 h-12 text-lootag-teal mx-auto mb-6 opacity-50" />
            <blockquote className="text-xl md:text-2xl lg:text-3xl font-medium mb-8 text-balance leading-relaxed">
              {testimonials[currentIndex].quote}
            </blockquote>
            <div>
              <p className="font-bold text-lg">{testimonials[currentIndex].author}</p>
              <p className="text-white/60">{testimonials[currentIndex].location}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevSlide}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Depoimento anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? "bg-lootag-teal w-8" 
                      : "bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Ir para depoimento ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Proximo depoimento"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Instagram-style grid placeholder */}
        <div className="mt-16">
          <p className="text-center text-white/60 mb-8">Pets protegidos por todo o Brasil</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div 
                key={item}
                className="aspect-square bg-white/5 rounded-2xl overflow-hidden flex items-center justify-center"
              >
                {/* Placeholder para fotos estilo Instagram */}
                <div className="text-white/20 text-center p-4">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  <p className="text-xs">Foto {item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
