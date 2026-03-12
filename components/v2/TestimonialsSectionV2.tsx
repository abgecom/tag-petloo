"use client"

import { useState, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function TestimonialsSectionV2() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const testimonials = [
    {
      quote: "A tranquilidade de soltar o Thor no parque sabendo que ele esta 'no meu radar' nao tem preco.",
      author: "Mariana S.",
      petType: "CAO",
      petName: "Thor",
    },
    {
      quote: "Nunca mais tive aquele frio na barriga quando o portao fica aberto por acidente. A Lootag me da paz.",
      author: "Carlos R.",
      petType: "CAO",
      petName: "Luna",
    },
    {
      quote: "Meu gato adora fugir pela janela. Com a Lootag, sei exatamente onde ele esta em segundos.",
      author: "Patricia M.",
      petType: "GATO",
      petName: "Milo",
    },
  ]

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <section id="depoimentos" className="py-16 md:py-24 bg-petloo-beige overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-start md:items-center justify-between mb-10">
          <div>
            <span className="inline-block px-4 py-1.5 bg-petloo-purple/10 text-petloo-purple text-sm font-medium rounded-full mb-4">
              Testemunhos
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-balance">
              Testado e aprovado por mais de 100 mil tutores
            </h2>
          </div>
          {/* Navigation arrows */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full border border-border hover:bg-white flex items-center justify-center transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full border border-border hover:bg-white flex items-center justify-center transition-colors"
              aria-label="Proximo"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Testimonials Horizontal Scroll */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {testimonials.map((testimonial, index) => (
            <div key={index} className="contents">
              {/* Image placeholder */}
              <div 
                className="flex-shrink-0 w-52 md:w-64 aspect-[3/4] bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-sm"
              >
                <div className="text-muted-foreground/30 text-center p-4">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  <p className="text-xs">Foto do pet</p>
                </div>
              </div>

              {/* Testimonial card */}
              <div 
                className="flex-shrink-0 w-64 md:w-72 bg-white rounded-2xl p-6 shadow-sm flex flex-col justify-between"
              >
                {/* Paw icon */}
                <div>
                  <svg className="w-6 h-6 text-petloo-purple mb-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM6 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                  <p className="text-sm text-foreground leading-relaxed mb-4">
                    {testimonial.quote}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.petType}</p>
                  </div>
                  <div className="w-8 h-8 bg-petloo-beige rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-petloo-purple" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Extra image placeholder at the end */}
          <div className="flex-shrink-0 w-52 md:w-64 aspect-[3/4] bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-sm">
            <div className="text-muted-foreground/30 text-center p-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
              <p className="text-xs">Foto do pet</p>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center justify-center gap-2 mt-6">
          <button
            onClick={() => scroll("left")}
            className="w-10 h-10 rounded-full border border-border hover:bg-white flex items-center justify-center transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-10 h-10 rounded-full border border-border hover:bg-white flex items-center justify-center transition-colors"
            aria-label="Proximo"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </section>
  )
}
