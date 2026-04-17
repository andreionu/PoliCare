"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { Logo } from "@/components/logo"
import { SidebarNav } from "@/components/sidebar-nav"
import { Header } from "@/components/header"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Only access localStorage strictly on client side to prevent hydration mismatches
    setUserRole(localStorage.getItem("userRole"))
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card sticky top-0 h-screen shadow-sm">
        <div className="flex h-16 items-center border-b px-6">
          <Logo size="sm" />
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <SidebarNav userRole={userRole as any} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        {children}
      </div>
    </div>
  )
}
