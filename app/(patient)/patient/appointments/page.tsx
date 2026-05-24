"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Loader2, Plus, XCircle, CreditCard, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { PatientBookingDialog } from "@/components/patient-booking-dialog"
import { useToast } from "@/hooks/use-toast"
import { cn, formatDoctorName } from "@/lib/utils"

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

const paymentColors: Record<string, string> = {
  UNPAID: "bg-slate-100 text-slate-600",
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  REFUNDED: "bg-purple-100 text-purple-700",
}

const paymentLabels: Record<string, string> = {
  UNPAID: "Neachitat",
  PENDING: "În procesare",
  PAID: "Plătit",
  REFUNDED: "Rambursat",
}

export default function PatientAppointmentsPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [bookingOpen, setBookingOpen] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const [paying, setPaying] = useState<string | null>(null)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      const res = await fetch(`/api/patient/appointments?${params}`)
      const data = await res.json()
      setAppointments(Array.isArray(data) ? data : [])
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  useEffect(() => {
    const payment = searchParams.get("payment")
    if (payment === "success") {
      toast({ title: "Plată efectuată!", description: "Mulțumim! Programarea dvs. a fost achitată." })
      fetchAppointments()
    } else if (payment === "cancelled") {
      toast({ title: "Plată anulată", description: "Nu a fost efectuată nicio tranzacție.", variant: "destructive" })
    }
  }, [])

  const handleCancel = async (id: string) => {
    setCancelling(id)
    setConfirmCancel(null)
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ANULAT" }),
      })
      if (!res.ok) throw new Error()
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: "ANULAT" } : a))
      toast({ title: "Programare anulată" })
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut anula programarea.", variant: "destructive" })
    } finally {
      setCancelling(null)
    }
  }

  const handlePay = async (apptId: string) => {
    setPaying(apptId)
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: apptId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Eroare")
      window.location.href = data.url
    } catch (e: any) {
      toast({ title: "Eroare", description: e.message, variant: "destructive" })
      setPaying(null)
    }
  }

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">Programările Mele</h1>
          <p className="text-muted-foreground">{appointments.length} programări</p>
        </div>
        <Button
          onClick={() => setBookingOpen(true)}
          className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Programare Nouă
        </Button>
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-56 h-10 rounded-xl">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate statusurile</SelectItem>
          {Object.entries(statusLabels).map(([val, label]) => (
            <SelectItem key={val} value={val}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Calendar className="h-10 w-10 opacity-30" />
            <p className="font-semibold text-sm">Nicio programare găsită</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {appointments.map((appt: any) => {
              const cancellable = ["IN_ASTEPTARE", "CONFIRMAT"].includes(appt.status)
              const payable = !["ANULAT", "NEPREZENTARE"].includes(appt.status)
                && appt.paymentStatus === "UNPAID"
                && appt.service?.price != null
                && appt.service.price > 0
              const isCancelling = cancelling === appt.id
              const isPaying = paying === appt.id
              const awaitingConfirm = confirmCancel === appt.id
              return (
                <div key={appt.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col gap-2">
                    {/* Top row: name + badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-sm text-foreground">{appt.doctor?.name ? formatDoctorName(appt.doctor.name) : ""}</p>
                      <Badge className={statusColors[appt.status] ?? "bg-gray-100 text-gray-700"}>
                        {statusLabels[appt.status] ?? appt.status}
                      </Badge>
                      {appt.paymentStatus && (appt.paymentStatus !== "UNPAID" || (appt.service?.price != null && appt.service.price > 0)) && (
                        <Badge className={paymentColors[appt.paymentStatus] ?? "bg-slate-100 text-slate-600"}>
                          {appt.paymentStatus === "PAID" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {paymentLabels[appt.paymentStatus] ?? appt.paymentStatus}
                        </Badge>
                      )}
                    </div>
                    {/* Info line */}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {format(new Date(appt.date), "d MMMM yyyy", { locale: ro })} · {appt.startTime}–{appt.endTime}
                      {appt.department && ` · ${appt.department.name}`}
                      {appt.service && ` · ${appt.service.name}`}
                      {appt.service?.price && ` · ${appt.service.price} RON`}
                    </p>
                    {/* Actions row */}
                    {(payable || cancellable || isCancelling || awaitingConfirm) && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {payable && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-3 rounded-lg text-xs text-teal-600 hover:bg-teal-50 gap-1"
                            disabled={isPaying}
                            onClick={() => handlePay(appt.id)}
                          >
                            {isPaying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                            Plătește
                          </Button>
                        )}
                        {cancellable && !isCancelling && !awaitingConfirm && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-3 rounded-lg text-xs text-rose-500 hover:bg-rose-50 gap-1"
                            onClick={() => setConfirmCancel(appt.id)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Anulează
                          </Button>
                        )}
                        {isCancelling && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {awaitingConfirm && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-muted-foreground">Ești sigur?</span>
                            <Button size="sm" variant="destructive" className="h-7 px-3 rounded-lg text-xs" onClick={() => handleCancel(appt.id)}>Da</Button>
                            <Button size="sm" variant="ghost" className="h-7 px-3 rounded-lg text-xs" onClick={() => setConfirmCancel(null)}>Nu</Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <PatientBookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        onBooked={fetchAppointments}
      />
    </main>
  )
}
