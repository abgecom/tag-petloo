import type React from "react"
import type { Metadata } from "next"
import DashboardAuth from "@/components/DashboardAuth"

export const metadata: Metadata = {
  title: "Dashboard - Petloo Admin",
  description: "Dashboard administrativo da Petloo",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardAuth>{children}</DashboardAuth>
}
