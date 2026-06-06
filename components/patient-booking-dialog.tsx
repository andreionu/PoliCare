"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ChevronRight, ChevronLeft, Calendar, Clock, Check, Stethoscope } from "lucide-react"
import { cn, formatDoctorName } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { DatePicker } from "@/components/ui/date-picker"

interface PatientBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBooked?: () => void
}

interface Department { id: string; name: string; description: string | null }
interface Doctor { id: string; name: string; specialty: string; departmentId: string; status: string }
interface Service { id: string; name: string; duration: number; price: number | null; departmentId: string }

const timeSlots = [
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30",
]

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

function isSlotOccupied(slot: string, end: string, occupied: { startTime: string; endTime: string }[]) {
  return occupied.some((o) => slot < o.endTime && end > o.startTime)
}

const stepLabels = ["Medic", "Data & Ora", "Confirmare"]

export function PatientBookingDialog({ open, onOpenChange, onBooked }: PatientBookingDialogProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [departments, setDepartments] = useState<Department[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [settings, setSettings] = useState<any>(null)

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [notes, setNotes] = useState("")

  const [occupiedSlots, setOccupiedSlots] = useState<{ startTime: string; endTime: string }[]>([])
  const [checkingSlots, setCheckingSlots] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      fetch("/api/departments").then((r) => r.json()),
      fetch("/api/doctors?status=ACTIV").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([depts, docs, svcs, sett]) => {
        setDepartments(Array.isArray(depts) ? depts : [])
        setDoctors(Array.isArray(docs) ? docs : [])
        setServices(Array.isArray(svcs) ? svcs : [])
        setSettings(sett)
      })
      .catch(() => toast({ title: "Eroare", description: "Nu s-au putut încărca datele.", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) { setOccupiedSlots([]); return }
    setCheckingSlots(true)
    fetch(`/api/appointments?doctorId=${selectedDoctorId}&date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => setOccupiedSlots(data.map((a: any) => ({ startTime: a.startTime, endTime: a.endTime }))))
      .catch(() => {})
      .finally(() => setCheckingSlots(false))
  }, [selectedDoctorId, selectedDate])

  const filteredDoctors = selectedDeptId
    ? doctors.filter((d) => d.departmentId === selectedDeptId)
    : doctors

  const filteredServices = selectedDeptId
    ? services.filter((s) => s.departmentId === selectedDeptId)
    : []

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId)
  const selectedDept = departments.find((d) => d.id === selectedDeptId)
  const selectedService = services.find((s) => s.id === selectedServiceId)
  const duration = selectedService?.duration ?? settings?.defaultAppointmentDuration ?? 30

  const today = new Date().toISOString().split("T")[0]

  const reset = () => {
    setStep(1)
    setSelectedDeptId(null)
    setSelectedDoctorId(null)
    setSelectedServiceId(null)
    setSelectedDate("")
    setSelectedTime("")
    setNotes("")
    setOccupiedSlots([])
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (!selectedDoctorId || !selectedDeptId || !selectedDate || !selectedTime) return
    setSubmitting(true)
    const endTime = addMinutes(selectedTime, duration)
    try {
      const res = await fetch("/api/patient/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          departmentId: selectedDeptId,
          serviceId: selectedServiceId ?? null,
          date: selectedDate,
          startTime: selectedTime,
          endTime,
          duration,
          notes: notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Eroare")
      toast({ title: "Programare înregistrată!", description: "Vei fi contactat pentru confirmare." })
      onBooked?.()
      handleClose()
    } catch (e: any) {
      toast({ title: "Eroare", description: e.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const canGoStep2 = !!selectedDeptId && !!selectedDoctorId
  const canGoStep3 = !!selectedDate && !!selectedTime

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-24px)] sm:max-w-2xl rounded-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-5 pb-0 shrink-0">
          <DialogTitle className="font-black text-lg">Programare Nouă</DialogTitle>
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1">
            {stepLabels.map((label, i) => {
              const n = i + 1
              const done = step > n
              const active = step === n
              return (
                <div key={n} className="flex items-center gap-1.5 shrink-0">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all shrink-0",
                    done ? "bg-teal-600 text-white" : active ? "bg-teal-600 text-white" : "bg-slate-100 text-muted-foreground"
                  )}>
                    {done ? <Check className="h-3 w-3" /> : n}
                  </div>
                  <span className={cn("text-xs font-bold whitespace-nowrap", active ? "text-teal-600" : "text-muted-foreground")}>{label}</span>
                  {i < stepLabels.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 mx-0.5 shrink-0" />}
                </div>
              )
            })}
          </div>
        </DialogHeader>

        <div className="px-4 sm:px-6 py-5 min-h-[280px] overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : step === 1 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wide text-muted-foreground">Departament</Label>
                <div className="grid grid-cols-2 gap-2">
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => { setSelectedDeptId(dept.id); setSelectedDoctorId(null); setSelectedServiceId(null) }}
                      className={cn(
                        "p-3 rounded-xl border text-left text-sm font-bold transition-all",
                        selectedDeptId === dept.id
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-slate-100 hover:border-teal-200 hover:bg-teal-50/50 text-foreground"
                      )}
                    >
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDeptId && (
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wide text-muted-foreground">Medic</Label>
                  {filteredDoctors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Niciun medic disponibil în acest departament.</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredDoctors.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedDoctorId(doc.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                            selectedDoctorId === doc.id
                              ? "border-teal-500 bg-teal-50"
                              : "border-slate-100 hover:border-teal-200 hover:bg-teal-50/50"
                          )}
                        >
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <Stethoscope className="h-4 w-4 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold">{formatDoctorName(doc.name)}</p>
                            <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                          </div>
                          {selectedDoctorId === doc.id && <Check className="h-4 w-4 text-teal-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedDeptId && filteredServices.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wide text-muted-foreground">Serviciu (opțional)</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedServiceId(null)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                        !selectedServiceId ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-100 text-muted-foreground hover:border-teal-200"
                      )}
                    >
                      Fără preferință
                    </button>
                    {filteredServices.map((svc) => (
                      <button
                        key={svc.id}
                        onClick={() => setSelectedServiceId(svc.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                          selectedServiceId === svc.id ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-100 text-muted-foreground hover:border-teal-200"
                        )}
                      >
                        {svc.name}{svc.price ? ` · ${svc.price} RON` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : step === 2 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wide text-muted-foreground">Data</Label>
                <DatePicker
                  value={selectedDate}
                  onChange={(v) => { setSelectedDate(v); setSelectedTime("") }}
                  min={today}
                  className="h-10 rounded-xl w-full sm:w-52"
                />
              </div>

              {selectedDate && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-black uppercase tracking-wide text-muted-foreground">Ora</Label>
                    {checkingSlots && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {timeSlots.map((slot) => {
                      const end = addMinutes(slot, duration)
                      const occupied = isSlotOccupied(slot, end, occupiedSlots)
                      return (
                        <button
                          key={slot}
                          disabled={occupied}
                          onClick={() => setSelectedTime(slot)}
                          className={cn(
                            "py-2.5 rounded-lg text-xs font-bold border transition-all",
                            occupied
                              ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                              : selectedTime === slot
                              ? "border-teal-500 bg-teal-500 text-white"
                              : "border-slate-100 hover:border-teal-300 hover:bg-teal-50 text-foreground"
                          )}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">Durată estimată: {duration} min</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-2">Rezumat</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <Stethoscope className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{selectedDoctor ? formatDoctorName(selectedDoctor.name) : ""}</p>
                    <p className="text-xs text-muted-foreground">{selectedDept?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-sm font-bold">
                    {format(new Date(selectedDate), "d MMMM yyyy", { locale: ro })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-sm font-bold">
                    {selectedTime} – {addMinutes(selectedTime, duration)}
                  </p>
                </div>
                {selectedService && (
                  <Badge className="bg-teal-100 text-teal-700">{selectedService.name}</Badge>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wide text-muted-foreground">Motive / Note (opțional)</Label>
                <Textarea
                  placeholder="Descrieți motivul consultației sau alte detalii relevante..."
                  className="rounded-xl resize-none"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t bg-slate-50/50 shrink-0">
          <Button
            variant="ghost"
            onClick={() => step === 1 ? handleClose() : setStep(step - 1)}
            className="rounded-xl"
          >
            {step === 1 ? "Anulează" : <><ChevronLeft className="h-4 w-4 mr-1" /> Înapoi</>}
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !canGoStep2 : !canGoStep3}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-1"
            >
              Continuă <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmă Programarea
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
