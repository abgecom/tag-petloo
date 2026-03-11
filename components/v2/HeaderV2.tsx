"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HeaderV2() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      {/* Tarja promocional superior */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-petloo-orange text-white py-1.5 md:py-2 px-4 text-center">
        <p className="text-[0.6875rem] md:text-sm font-medium leading-tight">
          100% de desconto na primeira mensalidade, pague apenas o frete
        </p>
      </div>

      <header 
        className={`fixed top-7 md:top-10 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "bg-white/95 backdrop-blur-sm shadow-md" 
            : "bg-transparent"
        }`}
      >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-20">
          {/* Logo */}
          <Link href="/v2" className="flex items-center">
            <Image
              src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
              alt="Petloo Logo"
              width={100}
              height={32}
              className={`h-6 md:h-10 w-auto transition-all ${
                scrolled ? "" : "brightness-0 invert"
              }`}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="#funcionalidades" 
              className={`text-sm font-medium transition-colors ${
                scrolled 
                  ? "text-foreground hover:text-petloo-purple" 
                  : "text-white hover:text-white/80"
              }`}
            >
              Beneficios
            </Link>
            <Link 
              href="#como-funciona" 
              className={`text-sm font-medium transition-colors ${
                scrolled 
                  ? "text-foreground hover:text-petloo-purple" 
                  : "text-white hover:text-white/80"
              }`}
            >
              Como funciona
            </Link>
            <Link 
              href="#depoimentos" 
              className={`text-sm font-medium transition-colors ${
                scrolled 
                  ? "text-foreground hover:text-petloo-purple" 
                  : "text-white hover:text-white/80"
              }`}
            >
              Depoimentos
            </Link>
            <Link 
              href="#comprar" 
              className={`text-sm font-medium transition-colors ${
                scrolled 
                  ? "text-foreground hover:text-petloo-purple" 
                  : "text-white hover:text-white/80"
              }`}
            >
              Preco
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="#comprar" 
              className="px-6 py-2.5 bg-petloo-green text-white font-semibold rounded-full hover:bg-petloo-green/90 transition-all hover:scale-105"
            >
              Adquirir Lootag
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 transition-colors ${
              scrolled ? "text-foreground" : "text-white"
            }`}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 bg-white rounded-b-2xl shadow-lg">
            <nav className="flex flex-col gap-4 px-4">
              <Link 
                href="#funcionalidades" 
                className="text-sm font-medium text-foreground hover:text-petloo-purple transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Beneficios
              </Link>
              <Link 
                href="#como-funciona" 
                className="text-sm font-medium text-foreground hover:text-petloo-purple transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Como funciona
              </Link>
              <Link 
                href="#depoimentos" 
                className="text-sm font-medium text-foreground hover:text-petloo-purple transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Depoimentos
              </Link>
              <Link 
                href="#comprar" 
                className="text-sm font-medium text-foreground hover:text-petloo-purple transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Preco
              </Link>
              <Link 
                href="#comprar" 
                className="mt-2 px-6 py-3 bg-petloo-green text-white font-semibold rounded-full text-center hover:bg-petloo-green/90 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Adquirir Lootag
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
    </>
  )
}
