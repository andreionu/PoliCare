"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"

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

const statusConfig: Record<string, { label: string; className: string }> = {
  CONFIRMAT: { label: "Confirmat", className: "bg-green-100 text-green-700 border-green-200" },
  IN_ASTEPTARE: { label: "În așteptare", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  IN_DESFASURARE: { label: "În desfășurare", className: "bg-purple-100 text-purple-700 border-purple-200" },
  FINALIZAT: { label: "Finalizat", className: "bg-muted text-muted-foreground" },
  ANULAT: { label: "Anulat", className: "bg-red-100 text-red-700 border-red-200" },
  NEPREZENTARE: { label: "Neprezentare", className: "bg-gray-100 text-gray-600 border-gray-200" },
}

export function RecentAppointments({ appointments, loading }: RecentAppointmentsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Programări Azi</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nu există programări pentru astăzi.</p>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => {
              const config = statusConfig[apt.status] ?? { label: apt.status, className: "bg-muted text-muted-foreground" }
              const initials = apt.patient.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
              return (
                <div
                  key={apt.id}
                  className="flex items-center justify-between gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{apt.patient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Dr. {apt.doctor.name}
                        {apt.department ? ` • ${apt.department.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium tabular-nums">{apt.startTime}</div>
                    <Badge variant="outline" className={config.className}>
                      {config.label}
                    </Badge>
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
