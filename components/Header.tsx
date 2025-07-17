"use client"

import { useState } from "react"
import { Menu, X, Instagram } from "lucide-react"
import Link from "next/link"

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const navigationLinks = [
    {
      name: "Home",
      href: "https://petloo.com.br/?utm_source=linktree_insta&utm_medium=site_tag&utm_campaign=menu&utm_content=header",
    },
    {
      name: "Contato",
      href: "https://petloosupport.zendesk.com/hc/pt-br/requests/new",
    },
    {
      name: "Minha Conta",
      href: "https://petloo.com.br/account/login",
    },
    {
      name: "Rastrear pedido",
      href: "https://petloo.com.br/account/login",
    },
    {
      name: "Blog",
      href: "https://petloo.com.br/blogs/news",
    },
  ]

  return (
    <>
      {/* Main Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <img
                  src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
                  alt="Petloo"
                  className="h-8 w-auto"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigationLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                  target={link.href.startsWith("http") ? "_blank" : "_self"}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Empty div to maintain layout balance */}
            <div className="hidden md:block w-16"></div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={toggleMobileMenu} />
            <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <img
                  src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Petloosemfundo%202-wiHpYOGK6l8BekDtGwMXaJxrq0maQN.png"
                  alt="Petloo"
                  className="h-8 w-auto"
                />
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  aria-label="Fechar menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="px-4 py-6">
                <div className="space-y-1">
                  {navigationLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                      target={link.href.startsWith("http") ? "_blank" : "_self"}
                      rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      onClick={toggleMobileMenu}
                    >
                      {link.name}
                    </a>
                  ))}
                </div>

                {/* Social Media Icons */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex space-x-4">
                    <a
                      href="https://www.instagram.com/petloobrasil/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-6 w-6" />
                    </a>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
