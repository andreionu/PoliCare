"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar, Loader2, CheckCircle, PlayCircle, XCircle, Flag, ClipboardList, Clock, Phone } from "lucide-react"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

interface Appointment {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  notes: string | null
  patient: { id: string; name: string; phone: string }
  department: { name: string } | null
  service: { name: string } | null
}

interface ConsultForm {
  symptoms: string
  diagnosis: string
  treatment: string
  prescription: string
  notes: string
  followUpRequired: boolean
  followUpDate: string
}

const emptyForm: ConsultForm = {
  symptoms: "", diagnosis: "", treatment: "",
  prescription: "", notes: "", followUpRequired: false, followUpDate: "",
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

export default function DoctorAppointmentsPage() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")

  // Consultation dialog state
  const [consultAppt, setConsultAppt] = useState<Appointment | null>(null)
  const [consultForm, setConsultForm] = useState<ConsultForm>(emptyForm)
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null)
  const [consultLoading, setConsultLoading] = useState(false)
  const [consultSaving, setConsultSaving] = useState(false)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (dateFilter) params.set("date", dateFilter)
      params.set("page", String(page))
      const res = await fetch(`/api/doctor/appointments?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAppointments(data.appointments)
      setTotal(data.total)
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, dateFilter, page])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [statusFilter, dateFilter])

  const handleStatusChange = async (apptId: string, newStatus: string) => {
    setUpdating(apptId)
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      setAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status: newStatus } : a))
      )
      toast({ title: "Status actualizat", description: statusLabels[newStatus] })
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut actualiza statusul.", variant: "destructive" })
    } finally {
      setUpdating(null)
    }
  }

  const openConsultDialog = async (appt: Appointment) => {
    setConsultAppt(appt)
    setConsultForm(emptyForm)
    setExistingRecordId(null)
    setConsultLoading(true)
    try {
      const res = await fetch(`/api/medical-records?patientId=${appt.patient.id}`)
      if (res.ok) {
        const records = await res.json()
        const existing = records.find((r: any) => r.appointmentId === appt.id)
        if (existing) {
          setExistingRecordId(existing.id)
          setConsultForm({
            symptoms: existing.symptoms ?? "",
            diagnosis: existing.diagnosis ?? "",
            treatment: existing.treatment ?? "",
            prescription: existing.prescription ?? "",
            notes: existing.notes ?? "",
            followUpRequired: existing.followUpRequired ?? false,
            followUpDate: existing.followUpDate
              ? format(new Date(existing.followUpDate), "yyyy-MM-dd")
              : "",
          })
        }
      }
    } catch { /* ignore */ } finally {
      setConsultLoading(false)
    }
  }

  const handleConsultSave = async () => {
    if (!consultAppt) return
    setConsultSaving(true)
    try {
      const payload = {
        patientId: consultAppt.patient.id,
        appointmentId: consultAppt.id,
        visitDate: consultAppt.date,
        symptoms: consultForm.symptoms || null,
        diagnosis: consultForm.diagnosis || null,
        treatment: consultForm.treatment || null,
        prescription: consultForm.prescription || null,
        notes: consultForm.notes || null,
        followUpRequired: consultForm.followUpRequired,
        followUpDate: consultForm.followUpRequired && consultForm.followUpDate
          ? consultForm.followUpDate : null,
      }

      const url = existingRecordId
        ? `/api/medical-records/${existingRecordId}`
        : "/api/medical-records"
      const method = existingRecordId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()

      toast({ title: "Consultație salvată" })
      setConsultAppt(null)

      // Offer to finalize if still in progress
      if (["CONFIRMAT", "IN_DESFASURARE"].includes(consultAppt.status)) {
        handleStatusChange(consultAppt.id, "FINALIZAT")
      }
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut salva consultația.", variant: "destructive" })
    } finally {
      setConsultSaving(false)
    }
  }

  const f = (field: keyof ConsultForm) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
    setConsultForm((prev) => ({ ...prev, [field]: e.target.value }))

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Programările Mele</h1>
        <p className="text-muted-foreground text-sm">{total} programări găsite</p>
      </div>

      {/* Status pills + date filter */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              statusFilter === "all"
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            Toate
          </button>
          {Object.entries(statusLabels).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(statusFilter === val ? "all" : val)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                statusFilter === val
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-9 rounded-xl w-full sm:w-44 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <Calendar className="h-10 w-10 opacity-30" />
          <p className="font-semibold text-sm">Nicio programare găsită</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(
            appointments.reduce<Record<string, Appointment[]>>((acc, appt) => {
              const day = appt.date.slice(0, 10)
              ;(acc[day] ??= []).push(appt)
              return acc
            }, {})
          )
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([day, dayAppts]) => (
              <div key={day}>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-sm font-bold text-slate-700 capitalize">
                    {format(new Date(day + "T12:00:00"), "EEEE, d MMMM yyyy", { locale: ro })}
                  </p>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium">{dayAppts.length} programări</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dayAppts.map((appt) => {
            const actions = nextActions[appt.status] ?? []
            const isUpdating = updating === appt.id
            const canConsult = ["CONFIRMAT", "IN_DESFASURARE", "FINALIZAT"].includes(appt.status)
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
                        <p className="text-xs text-muted-foreground">{appt.startTime}–{appt.endTime}</p>
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
                        <span className="truncate">{appt.service?.name ?? appt.department?.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-1 mt-auto pt-1">
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        {actions.map((action) => {
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
                        })}
                        {canConsult && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1 text-teal-600 hover:bg-teal-50"
                            onClick={() => openConsultDialog(appt)}
                          >
                            <ClipboardList className="h-3.5 w-3.5" />
                            Consultație
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">
            Pagina {page} din {totalPages} · {total} programări
          </p>
          <div className="flex items-center gap-1 flex-wrap justify-center">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-8 px-3 text-xs"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…")
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                ) : (
                  <Button
                    key={p}
                    variant={page === p ? "default" : "outline"}
                    size="sm"
                    className="rounded-xl h-8 w-8 p-0 text-xs"
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </Button>
                )
              )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-8 px-3 text-xs"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Următor
            </Button>
          </div>
        </div>
      )}

      {/* Consultation Dialog */}
      <Dialog open={!!consultAppt} onOpenChange={(open) => { if (!open) setConsultAppt(null) }}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Fișă consultație — {consultAppt?.patient.name}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {consultAppt && format(new Date(consultAppt.date), "d MMMM yyyy", { locale: ro })} · {consultAppt?.startTime}
              {consultAppt?.service && ` · ${consultAppt.service.name}`}
            </p>
          </DialogHeader>

          {consultLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Simptome</label>
                <Textarea
                  value={consultForm.symptoms}
                  onChange={f("symptoms")}
                  placeholder="Descrieți simptomele pacientului..."
                  className="rounded-xl resize-none min-h-[72px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Diagnostic</label>
                <Textarea
                  value={consultForm.diagnosis}
                  onChange={f("diagnosis")}
                  placeholder="Diagnostic stabilit..."
                  className="rounded-xl resize-none min-h-[72px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Tratament</label>
                <Textarea
                  value={consultForm.treatment}
                  onChange={f("treatment")}
                  placeholder="Schema de tratament recomandată..."
                  className="rounded-xl resize-none min-h-[72px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Prescripție</label>
                <Textarea
                  value={consultForm.prescription}
                  onChange={f("prescription")}
                  placeholder="Medicamente prescrise, doze..."
                  className="rounded-xl resize-none min-h-[60px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Notițe suplimentare</label>
                <Textarea
                  value={consultForm.notes}
                  onChange={f("notes")}
                  placeholder="Observații, recomandări de stil de viață..."
                  className="rounded-xl resize-none min-h-[60px]"
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="followUp"
                  checked={consultForm.followUpRequired}
                  onChange={(e) => setConsultForm((p) => ({ ...p, followUpRequired: e.target.checked }))}
                  className="h-4 w-4 rounded accent-teal-600"
                />
                <label htmlFor="followUp" className="text-sm font-medium">Necesită control ulterior</label>
              </div>
              {consultForm.followUpRequired && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Dată control</label>
                  <Input
                    type="date"
                    value={consultForm.followUpDate}
                    onChange={f("followUpDate")}
                    className="rounded-xl h-10"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setConsultAppt(null)}>
              Anulează
            </Button>
            <Button
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
              onClick={handleConsultSave}
              disabled={consultSaving || consultLoading}
            >
              {consultSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {existingRecordId ? "Actualizează" : "Salvează consultația"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
