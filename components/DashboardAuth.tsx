"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface DashboardAuthProps {
  children: React.ReactNode
}

export default function DashboardAuth({ children }: DashboardAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Se já estamos na página de login, não fazer verificação
    if (pathname === "/dashboard/login") {
      setIsLoading(false)
      return
    }

    const checkAuth = () => {
      try {
        if (typeof window !== "undefined") {
          const authData = localStorage.getItem("dashboard_auth")
          if (authData) {
            const parsed = JSON.parse(authData)
            if (parsed.authenticated === true) {
              setIsAuthenticated(true)
              setIsLoading(false)
              return
            }
          }
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
      }

      // Se não autenticado, redirecionar para login
      setTimeout(() => {
        router.replace("/dashboard/login")
      }, 100)
    }

    checkAuth()
  }, [pathname, router])

  // Se estamos na página de login, renderizar diretamente
  if (pathname === "/dashboard/login") {
    return <>{children}</>
  }

  // Se ainda carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se autenticado, renderizar children
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Fallback - não deveria chegar aqui
  return null
}
