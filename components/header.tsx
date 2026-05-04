"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Clock, Search, User, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useNotifications } from "@/hooks/use-notifications"
import { formatDistanceToNow } from "date-fns"
import { ro } from "date-fns/locale"

export function Header() {
  const [userName, setUserName] = useState("Admin")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState("")
  const router = useRouter()

  useEffect(() => {
    setUserRole(localStorage.getItem("userRole"))
    const name = localStorage.getItem("userName")
    if (name) setUserName(name)
  }, [])

  const { appointments, unreadCount, markAllSeen } = useNotifications()
  const [popoverOpen, setPopoverOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userName")
    window.location.href = "/login"
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 dark:bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-card/60 shadow-sm">
      <div className="flex h-16 items-center gap-4 px-6">
        <div className="flex-1 flex items-center gap-4">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Caută pacienți, medici sau programări..."
              className="pl-12 h-11 bg-muted/40 border-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl transition-all"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchValue.trim()) {
                  router.push(`/patients?search=${encodeURIComponent(searchValue.trim())}`)
                  setSearchValue("")
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Popover open={popoverOpen} onOpenChange={(open) => { setPopoverOpen(open); if (open) markAllSeen() }}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 transition-all focus-visible:ring-0">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-card animate-in zoom-in">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[380px] p-0 rounded-2xl shadow-2xl border-none overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-br from-primary/5 to-primary/10 border-b border-primary/10">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold text-foreground tracking-tight">Programări noi</h3>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="bg-rose-500 hover:bg-rose-600 text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                      {unreadCount} noi
                    </Badge>
                  )}
                </div>
              </div>
              <ScrollArea className="h-[400px] bg-white dark:bg-card">
                {appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground gap-4 animate-in fade-in">
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center shadow-sm">
                      <Bell className="h-8 w-8 text-primary/40" />
                    </div>
                    <span className="font-semibold text-sm">Nicio programare în așteptare</span>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {appointments.map((appt) => (
                      <div 
                        key={appt.id} 
                        className="group flex gap-4 px-5 py-4 hover:bg-muted/50 transition-all cursor-pointer relative overflow-hidden"
                        onClick={() => {
                          setPopoverOpen(false);
                          router.push('/appointments');
                        }}
                      >
                        <div className="absolute inset-y-0 left-0 w-1 bg-amber-400 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                        <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-800/30 group-hover:scale-110 transition-transform">
                          <Clock className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                              {appt.patient.name}
                            </p>
                            <span className="text-xs font-bold text-amber-600 shrink-0 bg-amber-100 px-2 py-0.5 rounded-md">
                              {appt.startTime}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-medium truncate">
                            Dr. {appt.doctor.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest pt-1">
                            {formatDistanceToNow(new Date(appt.createdAt), { addSuffix: true, locale: ro })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {appointments.length > 0 && (
                <div className="p-3 bg-muted/30 border-t border-border/50">
                  <Button 
                    variant="outline" 
                    className="w-full h-10 text-xs font-bold uppercase tracking-widest text-primary border-primary/20 hover:bg-primary/5 rounded-xl transition-all"
                    onClick={() => {
                      setPopoverOpen(false);
                      router.push('/appointments');
                    }}
                  >
                    Gestionează programările
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-3 h-12 px-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all">
                <Avatar className="h-9 w-9 border-2 border-white dark:border-card shadow-sm ring-2 ring-muted/50 group-hover:ring-blue-500 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start text-left leading-none">
                  <span className="text-sm font-bold text-foreground tracking-tight">{userName}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                    {userRole === "super-admin" ? "Super Admin" : "Recepție"}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl border-border/50">
              <DropdownMenuLabel className="px-4 py-3">
                <p className="text-sm font-bold text-foreground leading-none">{userName}</p>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                  {userRole === "super-admin" ? "Administrator Sistem" : "Personal Recepție"}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Setări
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Deconectare
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
