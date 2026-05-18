"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname } from "next/navigation"

import { Logo } from "@/components/logo"
import { SidebarNav } from "@/components/sidebar-nav"
import { Header } from "@/components/header"

interface AdminLayoutProps {
  children: React.ReactNode
  userName: string
  userRole: string
}

export function AdminLayout({ children, userName, userRole }: AdminLayoutProps) {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card sticky top-0 h-screen shadow-sm">
        <div className="flex h-16 items-center border-b px-6">
          <Logo size="sm" />
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <SidebarNav userRole={userRole as "SUPER_ADMIN" | "FRONT_DESK"} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <Header userName={userName} userRole={userRole} />
        {children}
      </div>
    </div>
  )
}
