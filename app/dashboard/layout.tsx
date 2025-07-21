import type React from "react"
import DashboardAuth from "@/components/DashboardAuth"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardAuth>{children}</DashboardAuth>
}
