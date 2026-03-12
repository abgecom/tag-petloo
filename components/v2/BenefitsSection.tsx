"use client"

import { FileText } from "lucide-react"

export default function BenefitsSection() {
  return (
    <div className="py-16 px-4 md:px-12 -mx-4" style={{ backgroundColor: "#F1E9DB" }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 animate-fade-in-up text-black">
          Benefícios de ser time Petloo
        </h2>
        <div className="lg:hidden space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3 benefit-item animate-slide-in-left">
              <span className="text-2xl">🛰️</span>
              <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                Rastreamento em tempo real
              </span>
            </div>
            <div
              className="flex items-center justify-center gap-3 benefit-item animate-slide-in-left"
              style={{ animationDelay: "0.2s" }}
            >
              <span className="text-2xl">🐶</span>
              <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                Tag leve e personalizada
              </span>
            </div>
            <div
              className="flex items-center justify-center gap-3 benefit-item animate-slide-in-left"
              style={{ animationDelay: "0.4s" }}
            >
              <FileText className="text-2xl" style={{ color: "#75004A" }} />
              <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                Registro oficial do pet
              </span>
            </div>
          </div>
          <div>
            <img
              src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Fotos%20da%20LP/20250710_1226_Cachorro%20no%20Parque_simple_compose_01jztezxy5e1199htb50hwqc18.png"
              alt="Cachorro no parque - Benefícios Petloo"
              className="w-full h-auto rounded-2xl shadow-lg"
            />
          </div>
          <div className="space-y-6">
            <div
              className="flex items-center justify-center gap-3 benefit-item animate-slide-in-right"
              style={{ animationDelay: "0.6s" }}
            >
              <span className="text-2xl">💉</span>
              <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                Cartão de vacinas com lembretes
              </span>
            </div>
            <div
              className="flex items-center justify-center gap-3 benefit-item animate-slide-in-right"
              style={{ animationDelay: "0.8s" }}
            >
              <span className="text-2xl">🛡️</span>
              <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                Seguro saúde gratuito
              </span>
            </div>
            <div
              className="flex items-center justify-center gap-3 benefit-item animate-slide-in-right"
              style={{ animationDelay: "1s" }}
            >
              <span className="text-2xl">📱</span>
              <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                App exclusivo Petloo
              </span>
            </div>
          </div>
        </div>
        <div className="hidden lg:grid lg:grid-cols-3 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3 benefit-item animate-slide-in-left">
              <span className="text-2xl">🛰️</span>
              <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                Encontre o seu pet em caso de perda
              </span>
            </div>
            <div
              className="flex items-center gap-3 benefit-item animate-slide-in-left"
              style={{ animationDelay: "0.2s" }}
            >
              <span className="text-2xl">🐶</span>
              <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                Tag leve e personalizada
              </span>
            </div>
            <div
              className="flex items-center gap-3 benefit-item animate-slide-in-left"
              style={{ animationDelay: "0.4s" }}
            >
              <FileText className="text-2xl" style={{ color: "#75004A" }} />
              <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                Registro oficial do pet
              </span>
            </div>
          </div>
          <div>
            <img
              src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/Fotos%20da%20LP/20250710_1226_Cachorro%20no%20Parque_simple_compose_01jztezxy5e1199htb50hwqc18.png"
              alt="Cachorro no parque - Benefícios Petloo"
              className="w-full h-auto rounded-2xl shadow-lg"
            />
          </div>
          <div className="space-y-6">
            <div
              className="flex items-center gap-3 benefit-item animate-slide-in-right"
              style={{ animationDelay: "0.6s" }}
            >
              <span className="text-2xl">💉</span>
              <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                Cartão de vacinas com lembretes
              </span>
            </div>
            <div
              className="flex items-center gap-3 benefit-item animate-slide-in-right"
              style={{ animationDelay: "0.8s" }}
            >
              <span className="text-2xl">🛡️</span>
              <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                Seguro saúde gratuito
              </span>
            </div>
            <div
              className="flex items-center gap-3 benefit-item animate-slide-in-right"
              style={{ animationDelay: "1s" }}
            >
              <span className="text-2xl">📱</span>
              <span className="text-lg font-medium" style={{ color: "#75004A" }}>
                App exclusivo Petloo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
