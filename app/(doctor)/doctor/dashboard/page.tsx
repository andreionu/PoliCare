"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Clock, ChevronRight, Loader2, CheckCircle, PlayCircle, XCircle, Flag, Phone } from "lucide-react"
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
  IN_ASTEPTARE:   "În așteptare",
  CONFIRMAT:      "Confirmat",
  IN_DESFASURARE: "În desfășurare",
  FINALIZAT:      "Finalizat",
  ANULAT:         "Anulat",
  NEPREZENTARE:   "Neprezentare",
  INCHEIATA:      "Încheiată",
}

const statusColors: Record<string, string> = {
  IN_ASTEPTARE:   "bg-amber-100 text-amber-700",
  CONFIRMAT:      "bg-blue-100 text-blue-700",
  IN_DESFASURARE: "bg-purple-100 text-purple-700",
  FINALIZAT:      "bg-green-100 text-green-700",
  ANULAT:         "bg-red-100 text-red-700",
  NEPREZENTARE:   "bg-gray-100 text-gray-700",
  INCHEIATA:      "bg-slate-100 text-slate-600",
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

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-foreground text-lg">Programări de azi</h2>
          <Link href="/doctor/appointments" className="text-sm text-blue-600 font-bold flex items-center gap-1 hover:underline">
            Vezi toate <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {!data?.todayAppointments?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Calendar className="h-10 w-10 opacity-30" />
            <p className="font-semibold text-sm">Nicio programare pentru azi</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.todayAppointments.map((appt) => {
              const actions = nextActions[appt.status] ?? []
              const isUpdating = updating === appt.id
              const accentColor =
                appt.status === "FINALIZAT"      ? "bg-green-400"  :
                appt.status === "IN_DESFASURARE" ? "bg-purple-400" :
                appt.status === "CONFIRMAT"      ? "bg-blue-400"   :
                appt.status === "ANULAT"         ? "bg-red-400"    :
                appt.status === "NEPREZENTARE"   ? "bg-gray-400"   :
                appt.status === "INCHEIATA"      ? "bg-slate-400"  :
                "bg-amber-400"
              return (
                <div
                  key={appt.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden flex flex-col"
                >
                  <div className={`h-1 w-full ${accentColor}`} />
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <Clock className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{appt.patient.name}</p>
                          <p className="text-xs text-muted-foreground">{appt.startTime} – {appt.endTime}</p>
                        </div>
                      </div>
                      <Badge className={`${statusColors[appt.status] ?? "bg-gray-100 text-gray-700"} text-[10px] shrink-0`}>
                        {statusLabels[appt.status] ?? appt.status}
                      </Badge>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {appt.patient.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{appt.patient.phone}</span>
                        </div>
                      )}
                      {(appt.service || appt.department) && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {appt.service?.name ?? appt.department?.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {(actions.length > 0 || isUpdating) && (
                      <div className="flex flex-wrap gap-1 mt-auto pt-1">
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
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
