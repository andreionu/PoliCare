"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Bell, ChevronRight, Loader2, Clock, Plus, CreditCard, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { PatientBookingDialog } from "@/components/patient-booking-dialog"
import { formatDoctorName } from "@/lib/utils"

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

export default function PatientDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bookingOpen, setBookingOpen] = useState(false)

  const fetchData = () => {
    fetch("/api/patient/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">Bun venit!</h1>
          <p className="text-muted-foreground">Iată un rezumat al programărilor dvs.</p>
        </div>
        <Button
          onClick={() => setBookingOpen(true)}
          className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Programare Nouă
        </Button>
      </div>

      {data?.unpaidSummary?.count > 0 && (
        <Card className="rounded-2xl border-amber-200 bg-amber-50 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 p-5">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-amber-900">
                {data.unpaidSummary.count === 1
                  ? "1 programare neachitată"
                  : `${data.unpaidSummary.count} programări neachitate`}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Total de plată: <strong>{data.unpaidSummary.total.toLocaleString("ro-RO")} lei</strong>
              </p>
            </div>
            <Link href="/patient/appointments">
              <Button size="sm" className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shrink-0">
                Plătește acum
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="font-black text-foreground">Programări viitoare</h2>
          <Link href="/patient/appointments" className="text-sm text-teal-600 font-bold flex items-center gap-1 hover:underline">
            Vezi toate <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {!data?.upcomingAppointments?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
            <Calendar className="h-8 w-8 opacity-30" />
            <p className="text-sm font-semibold">Nicio programare viitoare</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {data.upcomingAppointments.map((appt: any) => (
              <div key={appt.id} className="flex items-start sm:items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <Clock className="h-4 w-4 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm text-foreground">{appt.doctor?.name ? formatDoctorName(appt.doctor.name) : ""}</p>
                    <Badge className={statusColors[appt.status] ?? "bg-gray-100 text-gray-700"}>
                      {statusLabels[appt.status] ?? appt.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(appt.date), "d MMMM yyyy", { locale: ro })} · {appt.startTime}
                    {appt.department && ` · ${appt.department.name}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {data?.recentNotifications?.length > 0 && (
        <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b">
            <h2 className="font-black text-foreground">Notificări recente</h2>
          </div>
          <div className="divide-y divide-border/50">
            {data.recentNotifications.map((notif: any) => (
              <div key={notif.id} className="flex items-start gap-3 p-4">
                <Bell className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(notif.sentAt), "d MMM yyyy HH:mm", { locale: ro })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <PatientBookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        onBooked={fetchData}
      />
    </main>
  )
}
