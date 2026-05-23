"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  Building2,
  FileText,
  Settings,
  Activity,
  UserCog,
  Wrench,
  CreditCard,
} from "lucide-react"

interface SidebarNavProps {
  userRole?: "SUPER_ADMIN" | "FRONT_DESK" | null
}

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
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
    title: "Servicii",
    href: "/services",
    icon: Wrench,
  },
  {
    title: "Plăți",
    href: "/billing",
    icon: CreditCard,
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

const superAdminNavItems = [
  {
    title: "Utilizatori",
    href: "/users",
    icon: UserCog,
  },
]

export function SidebarNav({ userRole }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="space-y-6 px-4 py-4">
      <div>
        <p className="px-3 mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Meniu Principal</p>
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/10 dark:hover:text-blue-400"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-muted-foreground/70 group-hover:text-blue-500")} />
                <span className="tracking-tight">{item.title}</span>
                {isActive && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {userRole === "SUPER_ADMIN" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <p className="px-3 mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Administrare</p>
          <div className="space-y-1.5">
            {superAdminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/10 dark:hover:text-blue-400"
                  )}
                >
                  <Icon className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-muted-foreground/70 group-hover:text-blue-500")} />
                  <span className="tracking-tight">{item.title}</span>
                  {isActive && (
                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
