"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LayoutDashboard, Calendar, FileText, LogOut, Menu, X, User, CreditCard } from "lucide-react"

interface PatientLayoutProps {
  children: React.ReactNode
  userName: string
}

const navItems = [
  { title: "Dashboard",         mobileLabel: "Acasă",       href: "/patient/dashboard",    icon: LayoutDashboard },
  { title: "Programările Mele", mobileLabel: "Programări",  href: "/patient/appointments", icon: Calendar },
  { title: "Plăți",             mobileLabel: "Plăți",       href: "/patient/payments",     icon: CreditCard },
  { title: "Documentele Mele",  mobileLabel: "Documente",   href: "/patient/documents",    icon: FileText },
  { title: "Profilul Meu",      mobileLabel: "Profil",      href: "/patient/profile",      icon: User },
]

export function PatientLayout({ children, userName }: PatientLayoutProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
    setMobileMenuOpen(false)
  }, [pathname])

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card sticky top-0 h-screen shadow-sm">
        <div className="flex h-16 items-center border-b px-6">
          <Logo size="sm" />
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1.5 px-4">
            <p className="px-3 mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Portal Pacient</p>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-600/20"
                      : "text-muted-foreground hover:bg-teal-50 hover:text-teal-600"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-muted-foreground/70")} />
                  <span className="tracking-tight truncate">{item.title}</span>
                  {isActive && <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-3 px-2">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-[10px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{userName}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Pacient</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Deconectare
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4 shadow-sm">
        <Logo size="sm" />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile slide-down menu + backdrop */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-20 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed top-14 left-0 right-0 z-30 bg-card border-b shadow-xl">
            <nav className="p-4 space-y-1">
              <div className="flex items-center gap-3 p-3 mb-2 border-b border-border/50 pb-4">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{userName}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Pacient</p>
                </div>
              </div>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link key={item.href} href={item.href} className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
                    isActive ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white" : "text-muted-foreground hover:bg-teal-50 hover:text-teal-600"
                  )}>
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.title}
                  </Link>
                )
              })}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                Deconectare
              </button>
            </nav>
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-h-screen pt-14 pb-16 lg:pt-0 lg:pb-0">
        {children}
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t bg-card shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[11px] font-bold transition-colors min-w-0",
              isActive ? "text-teal-600" : "text-muted-foreground"
            )}>
              <Icon className={cn("h-5 w-5 shrink-0", isActive && "drop-shadow-sm")} />
              <span className="truncate px-1">{item.mobileLabel}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
