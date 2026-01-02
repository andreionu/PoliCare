"use client"

import type React from "react"

import { Activity } from "lucide-react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Header } from "@/components/header"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card sticky top-0 h-screen">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">PoliCare</span>
            <span className="text-xs text-muted-foreground">Admin Portal</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <SidebarNav />
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
