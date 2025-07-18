import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard - Petloo",
  description: "Dashboard interno para acompanhamento de pedidos",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Petloo Admin</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Voltar ao Site
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
