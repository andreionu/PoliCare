"use client"

import Link from "next/link"
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Calendar, Stethoscope, Building2, FileText, Settings, Activity } from 'lucide-react'

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Pacienți",
    href: "/patients",
    icon: Users,
  },
  {
    title: "Programări",
    href: "/appointments",
    icon: Calendar,
  },
  {
    title: "Medici",
    href: "/doctors",
    icon: Stethoscope,
  },
  {
    title: "Departamente",
    href: "/departments",
    icon: Building2,
  },
  {
    title: "Rapoarte",
    href: "/reports",
    icon: FileText,
  },
  {
    title: "Activitate",
    href: "/activity",
    icon: Activity,
  },
  {
    title: "Setări",
    href: "/settings",
    icon: Settings,
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1 px-3">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
