"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import { formatDoctorName } from "@/lib/utils"

interface RecentAppointment {
  id: string
  startTime: string
  status: string
  patient: { name: string }
  doctor: { name: string }
  department: { name: string } | null
}

interface RecentAppointmentsProps {
  appointments: RecentAppointment[]
  loading: boolean
}

const statusConfig: Record<string, { label: string; bg: string; dot: string; text: string }> = {
  CONFIRMAT: { label: "Confirmat", bg: "bg-emerald-50 content-emerald-600 dark:bg-emerald-500/10", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  IN_ASTEPTARE: { label: "În așteptare", bg: "bg-primary/5 dark:bg-primary/10", dot: "bg-primary", text: "text-primary dark:text-primary/90" },
  IN_DESFASURARE: { label: "În desfășurare", bg: "bg-purple-50 dark:bg-purple-500/10", dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-400" },
  FINALIZAT: { label: "Finalizat", bg: "bg-slate-50 dark:bg-slate-500/10", dot: "bg-slate-500", text: "text-slate-700 dark:text-slate-400" },
  ANULAT: { label: "Anulat", bg: "bg-rose-50 dark:bg-rose-500/10", dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-400" },
  NEPREZENTARE: { label: "Neprezentare", bg: "bg-amber-50 dark:bg-amber-500/10", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" },
}

export function RecentAppointments({ appointments, loading }: RecentAppointmentsProps) {
  return (
    <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-card/50 backdrop-blur-sm group/card">
      <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-muted/30">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold tracking-tight">Programări Azi</CardTitle>
          <p className="text-xs font-medium text-muted-foreground">Monitorizare timp real pacienți</p>
        </div>
        <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 text-primary dark:border-primary/10 dark:bg-primary/5 font-bold text-[10px] uppercase tracking-wider py-1">
          LIVE
        </Badge>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted/50 rounded" />
                </div>
                <div className="h-6 w-20 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground/30">
              <Loader2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Nu există programări pentru astăzi.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {appointments.map((apt) => {
              const config = statusConfig[apt.status] ?? { 
                label: apt.status, 
                bg: "bg-muted", 
                dot: "bg-muted-foreground",
                text: "text-muted-foreground" 
              }
              const initials = apt.patient.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
              return (
                <div
                  key={apt.id}
                  className="group flex items-center justify-between gap-4 p-4 rounded-2xl hover:bg-muted/40 transition-all duration-300 border border-transparent hover:border-muted/50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <Avatar className="h-11 w-11 border-2 border-white dark:border-card shadow-sm ring-2 ring-muted/30 group-hover:ring-primary/30 transition-all">
                        <AvatarFallback className="bg-gradient-to-br from-primary/5 to-primary/10 text-primary dark:from-primary/10 dark:to-primary/20 text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-card shadow-sm ${config.dot}`} />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-bold leading-none truncate tracking-tight text-foreground/90">{apt.patient.name}</p>
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <span className="text-primary font-bold">●</span>
                        <span className="truncate">{formatDoctorName(apt.doctor.name)} {apt.department ? `· ${apt.department.name}` : ""}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="text-sm font-extrabold tabular-nums tracking-tighter text-foreground group-hover:text-primary transition-colors">
                      {apt.startTime}
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-current opacity-80 ${config.bg} ${config.text}`}>
                      {config.label}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
