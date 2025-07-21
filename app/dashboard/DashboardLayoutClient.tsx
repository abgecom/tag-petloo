"use client"

import type React from "react"
import AuthGuard from "@/components/AuthGuard"
import { useAuth } from "@/hooks/useAuth" // Import useAuth hook

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
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
                <LogoutButton />
              </nav>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">{children}</main>
      </div>
    </AuthGuard>
  )
}

function LogoutButton() {
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = "/dashboard/login"
  }

  return (
    <button onClick={handleLogout} className="text-red-600 hover:text-red-800 transition-colors">
      Sair
    </button>
  )
}
