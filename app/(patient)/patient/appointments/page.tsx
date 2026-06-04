"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar, Loader2, Plus, XCircle, CreditCard,
  CheckCircle2, Clock, Stethoscope, MapPin,
} from "lucide-react"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { PatientBookingDialog } from "@/components/patient-booking-dialog"
import { useToast } from "@/hooks/use-toast"
import { cn, formatDoctorName } from "@/lib/utils"

const statusLabels: Record<string, string> = {
  IN_ASTEPTARE:   "În așteptare",
  CONFIRMAT:      "Confirmat",
  IN_DESFASURARE: "În desfășurare",
  FINALIZAT:      "Finalizat",
  ANULAT:         "Anulat",
  NEPREZENTARE:   "Neprezentare",
}

const statusColors: Record<string, string> = {
  IN_ASTEPTARE:   "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMAT:      "bg-blue-50 text-blue-700 border-blue-200",
  IN_DESFASURARE: "bg-purple-50 text-purple-700 border-purple-200",
  FINALIZAT:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  ANULAT:         "bg-red-50 text-red-600 border-red-200",
  NEPREZENTARE:   "bg-slate-50 text-slate-500 border-slate-200",
}

const paymentColors: Record<string, string> = {
  UNPAID:   "bg-slate-50 text-slate-500 border-slate-200",
  PENDING:  "bg-amber-50 text-amber-700 border-amber-200",
  PAID:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",
}

const paymentLabels: Record<string, string> = {
  UNPAID:   "Neachitat",
  PENDING:  "În procesare",
  PAID:     "Plătit",
  REFUNDED: "Rambursat",
}

const FILTERS = [
  { value: "all",           label: "Toate" },
  { value: "IN_ASTEPTARE",  label: "În așteptare" },
  { value: "CONFIRMAT",     label: "Confirmate" },
  { value: "FINALIZAT",     label: "Finalizate" },
  { value: "ANULAT",        label: "Anulate" },
]

function AppointmentCard({
  appt,
  cancelling,
  confirmCancel,
  paying,
  onPay,
  onRequestCancel,
  onConfirmCancel,
  onCancelCancel,
}: {
  appt: any
  cancelling: string | null
  confirmCancel: string | null
  paying: string | null
  onPay: (id: string) => void
  onRequestCancel: (id: string) => void
  onConfirmCancel: (id: string) => void
  onCancelCancel: () => void
}) {
  const cancellable  = ["IN_ASTEPTARE", "CONFIRMAT"].includes(appt.status)
  const payable      = !["ANULAT", "NEPREZENTARE"].includes(appt.status)
                       && appt.paymentStatus === "UNPAID"
                       && appt.service?.price != null
                       && appt.service.price > 0
  const isCancelling = cancelling === appt.id
  const isPaying     = paying    === appt.id
  const awaitingConfirm = confirmCancel === appt.id
  const isPast       = ["FINALIZAT", "ANULAT", "NEPREZENTARE"].includes(appt.status)

  const apptDate = new Date(appt.date)

  return (
    <div className={cn(
      "bg-white rounded-2xl border transition-shadow hover:shadow-md overflow-hidden",
      isPast ? "border-slate-100 opacity-80" : "border-slate-200 shadow-sm",
    )}>
      {/* Top accent bar by status */}
      <div className={cn(
        "h-1 w-full",
        appt.status === "CONFIRMAT"      && "bg-blue-400",
        appt.status === "IN_ASTEPTARE"   && "bg-amber-400",
        appt.status === "IN_DESFASURARE" && "bg-purple-500",
        appt.status === "FINALIZAT"      && "bg-emerald-400",
        appt.status === "ANULAT"         && "bg-red-400",
        appt.status === "NEPREZENTARE"   && "bg-slate-300",
      )} />

      <div className="p-4 sm:p-5">
        {/* Date + badges row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Date pill */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn(
              "flex flex-col items-center justify-center rounded-xl w-12 h-12 shrink-0 text-center",
              isPast ? "bg-slate-50" : "bg-teal-50",
            )}>
              <span className={cn("text-lg font-black leading-none", isPast ? "text-slate-500" : "text-teal-700")}>
                {format(apptDate, "d")}
              </span>
              <span className={cn("text-[10px] font-bold uppercase tracking-wide", isPast ? "text-slate-400" : "text-teal-600")}>
                {format(apptDate, "MMM", { locale: ro })}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground capitalize">
                {format(apptDate, "EEEE", { locale: ro })}
              </p>
              <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {appt.startTime}–{appt.endTime}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap justify-end gap-1.5 shrink-0">
            <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full border", statusColors[appt.status] ?? "bg-slate-50 text-slate-500 border-slate-200")}>
              {statusLabels[appt.status] ?? appt.status}
            </span>
            {appt.paymentStatus && (appt.paymentStatus !== "UNPAID" || payable) && (
              <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1", paymentColors[appt.paymentStatus] ?? "bg-slate-50 text-slate-500 border-slate-200")}>
                {appt.paymentStatus === "PAID" && <CheckCircle2 className="h-3 w-3" />}
                {paymentLabels[appt.paymentStatus] ?? appt.paymentStatus}
              </span>
            )}
          </div>
        </div>

        {/* Doctor + department */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-teal-600 shrink-0" />
            <p className="font-bold text-sm text-foreground">
              {appt.doctor?.name ? formatDoctorName(appt.doctor.name) : "—"}
            </p>
          </div>
          {(appt.department || appt.service) && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {[appt.department?.name, appt.service?.name].filter(Boolean).join(" · ")}
                {appt.service?.price ? <span className="font-semibold text-foreground"> · {appt.service.price} RON</span> : null}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {(payable || cancellable || isCancelling || awaitingConfirm) && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            {awaitingConfirm ? (
              <>
                <span className="text-xs text-muted-foreground mr-1">Anulezi programarea?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 px-4 rounded-xl text-xs"
                  onClick={() => onConfirmCancel(appt.id)}
                >
                  Da, anulează
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-4 rounded-xl text-xs"
                  onClick={onCancelCancel}
                >
                  Nu
                </Button>
              </>
            ) : (
              <>
                {payable && (
                  <Button
                    size="sm"
                    className="h-8 px-4 rounded-xl text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                    disabled={isPaying}
                    onClick={() => onPay(appt.id)}
                  >
                    {isPaying
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <CreditCard className="h-3.5 w-3.5" />}
                    Plătește acum
                  </Button>
                )}
                {cancellable && !isCancelling && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3 rounded-xl text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600 gap-1.5 ml-auto"
                    onClick={() => onRequestCancel(appt.id)}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Anulează
                  </Button>
                )}
                {isCancelling && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PatientAppointmentsPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [bookingOpen, setBookingOpen]   = useState(false)
  const [cancelling, setCancelling]     = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const [paying, setPaying]             = useState<string | null>(null)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      const res  = await fetch(`/api/patient/appointments?${params}`)
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
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "ANULAT" } : a))
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
      const res  = await fetch("/api/payments/checkout", {
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

  // Split into upcoming/active and past
  const upcoming = appointments.filter(a => !["FINALIZAT", "ANULAT", "NEPREZENTARE"].includes(a.status))
  const past     = appointments.filter(a =>  ["FINALIZAT", "ANULAT", "NEPREZENTARE"].includes(a.status))

  const cardProps = {
    cancelling, confirmCancel, paying,
    onPay: handlePay,
    onRequestCancel: (id: string) => setConfirmCancel(id),
    onConfirmCancel: handleCancel,
    onCancelCancel:  () => setConfirmCancel(null),
  }

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">Programările Mele</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Se încarcă..." : `${appointments.length} programări`}
          </p>
        </div>
        <Button
          onClick={() => setBookingOpen(true)}
          className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Programare Nouă
        </Button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold border transition-all",
              statusFilter === f.value
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <Calendar className="h-12 w-12 opacity-20" />
          <p className="font-semibold">Nicio programare găsită</p>
          <Button
            variant="outline"
            onClick={() => setBookingOpen(true)}
            className="rounded-xl mt-2 gap-2"
          >
            <Plus className="h-4 w-4" />
            Adaugă prima programare
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 px-1">
                Viitoare & active — {upcoming.length}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {upcoming.map(appt => (
                  <AppointmentCard key={appt.id} appt={appt} {...cardProps} />
                ))}
              </div>
            </section>
          )}

          {/* Past */}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 px-1">
                Istoricul programărilor — {past.length}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {past.map(appt => (
                  <AppointmentCard key={appt.id} appt={appt} {...cardProps} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <PatientBookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        onBooked={fetchAppointments}
      />
    </main>
  )
}
