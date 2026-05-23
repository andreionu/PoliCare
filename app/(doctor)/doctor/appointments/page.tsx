"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar, Loader2, CheckCircle, PlayCircle, XCircle, Flag, ClipboardList } from "lucide-react"
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

export default function DoctorAppointmentsPage() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [total, setTotal] = useState(0)
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
  }, [statusFilter, dateFilter])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

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
        <p className="text-muted-foreground">{total} programări găsite</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-10 rounded-xl w-full sm:w-44"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate statusurile</SelectItem>
            {Object.entries(statusLabels).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
            {appointments.map((appt) => {
              const actions = nextActions[appt.status] ?? []
              const isUpdating = updating === appt.id
              const canConsult = ["CONFIRMAT", "IN_DESFASURARE", "FINALIZAT"].includes(appt.status)
              return (
                <div key={appt.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-bold text-sm text-foreground">{appt.patient.name}</p>
                    <Badge className={statusColors[appt.status] ?? "bg-gray-100 text-gray-700"}>
                      {statusLabels[appt.status] ?? appt.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden sm:inline ml-auto">{appt.patient.phone}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {format(new Date(appt.date), "d MMMM yyyy", { locale: ro })} · {appt.startTime}–{appt.endTime}
                    {appt.department && ` · ${appt.department.name}`}
                    {appt.service && ` · ${appt.service.name}`}
                  </p>
                  <div className="flex flex-wrap items-center gap-1">
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
                              <span className="hidden xs:inline">{action.label}</span>
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
                            <span className="hidden xs:inline">Consultație</span>
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Consultation Dialog */}
      <Dialog open={!!consultAppt} onOpenChange={(open) => { if (!open) setConsultAppt(null) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
