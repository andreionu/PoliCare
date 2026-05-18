"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Clock, ChevronRight, Loader2, CheckCircle, PlayCircle, XCircle, Flag } from "lucide-react"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

interface Appointment {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  patient: { id: string; name: string; phone: string }
  department: { name: string } | null
  service: { name: string } | null
}

interface DashboardData {
  todayCount: number
  weekCount: number
  todayAppointments: Appointment[]
}

const statusLabels: Record<string, string> = {
  IN_ASTEPTARE: "În așteptare",
  CONFIRMAT: "Confirmat",
  IN_DESFASURARE: "În desfășurare",
  FINALIZAT: "Finalizat",
  ANULAT: "Anulat",
  NEPREZENTARE: "Neprezentare",
}

const statusColors: Record<string, string> = {
  IN_ASTEPTARE: "bg-amber-100 text-amber-700",
  CONFIRMAT: "bg-blue-100 text-blue-700",
  IN_DESFASURARE: "bg-purple-100 text-purple-700",
  FINALIZAT: "bg-green-100 text-green-700",
  ANULAT: "bg-red-100 text-red-700",
  NEPREZENTARE: "bg-gray-100 text-gray-700",
}

type ActionDef = { label: string; status: string; icon: React.ElementType; className: string }

const nextActions: Record<string, ActionDef[]> = {
  IN_ASTEPTARE: [
    { label: "Confirmă", status: "CONFIRMAT", icon: CheckCircle, className: "text-blue-600 hover:bg-blue-50" },
    { label: "Neprezentare", status: "NEPREZENTARE", icon: XCircle, className: "text-gray-500 hover:bg-gray-50" },
  ],
  CONFIRMAT: [
    { label: "Începe", status: "IN_DESFASURARE", icon: PlayCircle, className: "text-purple-600 hover:bg-purple-50" },
    { label: "Neprezentare", status: "NEPREZENTARE", icon: XCircle, className: "text-gray-500 hover:bg-gray-50" },
  ],
  IN_DESFASURARE: [
    { label: "Finalizează", status: "FINALIZAT", icon: Flag, className: "text-green-600 hover:bg-green-50" },
  ],
}

export default function DoctorDashboardPage() {
  const { toast } = useToast()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/doctor/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (apptId: string, newStatus: string) => {
    setUpdating(apptId)
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      setData((prev) =>
        prev
          ? {
              ...prev,
              todayAppointments: prev.todayAppointments.map((a) =>
                a.id === apptId ? { ...a, status: newStatus } : a
              ),
            }
          : prev
      )
      toast({ title: "Status actualizat", description: statusLabels[newStatus] })
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut actualiza statusul.", variant: "destructive" })
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const today = format(new Date(), "EEEE, d MMMM yyyy", { locale: ro })

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Dashboard</h1>
        <p className="text-muted-foreground capitalize text-sm">{today}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-6 rounded-2xl border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl sm:text-3xl font-black text-foreground">{data?.todayCount ?? 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-tight">Programări azi</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 sm:p-6 rounded-2xl border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl sm:text-3xl font-black text-foreground">{data?.weekCount ?? 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-tight">Săptămâna aceasta</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-black text-foreground">Programări de azi</h2>
          <Link href="/doctor/appointments" className="text-sm text-blue-600 font-bold flex items-center gap-1 hover:underline">
            Vezi toate <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {!data?.todayAppointments?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Calendar className="h-10 w-10 opacity-30" />
            <p className="font-semibold text-sm">Nicio programare pentru azi</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {data.todayAppointments.map((appt) => {
              const actions = nextActions[appt.status] ?? []
              const isUpdating = updating === appt.id
              return (
                <div key={appt.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="font-bold text-sm text-foreground truncate">{appt.patient.name}</p>
                        <Badge className={statusColors[appt.status] ?? "bg-gray-100 text-gray-700"}>
                          {statusLabels[appt.status] ?? appt.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{appt.startTime} – {appt.endTime}</p>
                      {(actions.length > 0 || isUpdating) && (
                        <div className="flex flex-wrap items-center gap-1 mt-2">
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            actions.map((action) => {
                              const Icon = action.icon
                              return (
                                <Button
                                  key={action.status}
                                  variant="ghost"
                                  size="sm"
                                  className={`h-7 px-2.5 rounded-lg text-xs font-bold gap-1 ${action.className}`}
                                  onClick={() => handleStatusChange(appt.id, action.status)}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                  {action.label}
                                </Button>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </main>
  )
}
