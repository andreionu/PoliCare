"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Heart, Users, Baby, Eye, Ear, ChevronRight, Check, Loader2, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface BookingWizardProps {
  onClose: () => void
  initialDepartmentId?: string | null
}

interface Department {
  id: string
  name: string
  description: string | null
  color: string | null
}

interface Doctor {
  id: string
  name: string
  specialty: string | null
  departmentId: string | null
  status: string
}

interface Service {
  id: string
  name: string
  duration: number
  departmentId: string
}

interface ExistingAppointment {
  startTime: string
  endTime: string
}

const departmentIcons: Record<string, any> = {
  Cardiologie: Heart,
  Pediatrie: Baby,
  ORL: Ear,
  Oftalmologie: Eye,
  Dermatologie: Users,
  default: Heart,
}

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
]

const stepLabels = ["Departament", "Serviciu", "Medic", "Data & Ora", "Date"]

export function BookingWizard({ onClose, initialDepartmentId }: BookingWizardProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(initialDepartmentId ? 2 : 1)
  const [departments, setDepartments] = useState<Department[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(initialDepartmentId ?? null)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [otherServiceDescription, setOtherServiceDescription] = useState("")
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const [occupiedSlots, setOccupiedSlots] = useState<ExistingAppointment[]>([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/departments").then(r => r.json()),
      fetch("/api/doctors").then(r => r.json()),
      fetch("/api/services").then(r => r.json()),
    ])
      .then(([depts, docs, svcs]) => {
        setDepartments(depts)
        setDoctors(docs)
        setServices(svcs)
      })
      .catch(() => toast({ title: "Eroare", description: "Nu s-au putut încărca datele.", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedDoctor || !selectedDate) { setOccupiedSlots([]); return }
    setCheckingAvailability(true)
    fetch(`/api/appointments?doctorId=${selectedDoctor}&date=${selectedDate}`)
      .then(r => r.json())
      .then(data => setOccupiedSlots(data.map((a: any) => ({ startTime: a.startTime, endTime: a.endTime }))))
      .catch(() => {})
      .finally(() => setCheckingAvailability(false))
  }, [selectedDoctor, selectedDate])

  const sanitize = (s: string) => s.trim().replace(/[<>]/g, "")
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  const validatePhone = (p: string) => /^[0-9+\s()-]{10,20}$/.test(p)

  const getServiceDuration = () => {
    if (!selectedServiceId) return 30
    return services.find(s => s.id === selectedServiceId)?.duration ?? 30
  }

  const isSlotOccupied = (time: string) => {
    const duration = getServiceDuration()
    const [h, m] = time.split(":").map(Number)
    const slotStart = h * 60 + m
    const slotEnd = slotStart + duration
    return occupiedSlots.some(occ => {
      const [oh1, om1] = occ.startTime.split(":").map(Number)
      const [oh2, om2] = occ.endTime.split(":").map(Number)
      return slotStart < oh2 * 60 + om2 && slotEnd > oh1 * 60 + om1
    })
  }

  const canProceed = () => {
    if (step === 1) return !!selectedDepartment
    if (step === 2) return !!selectedServiceId && (selectedServiceId !== "other" || otherServiceDescription.trim() !== "")
    if (step === 3) return !!selectedDoctor
    if (step === 4) return !!selectedDate && !!selectedTime && !isSlotOccupied(selectedTime)
    if (step === 5) return !!(formData.name && formData.phone && formData.email)
    return false
  }

  const handleSubmit = async () => {
    const name = sanitize(formData.name)
    const email = sanitize(formData.email.toLowerCase())
    const phone = sanitize(formData.phone)

    if (name.length < 2) {
      toast({ title: "Eroare", description: "Introduceți un nume valid.", variant: "destructive" }); return
    }
    if (!validateEmail(email)) {
      toast({ title: "Eroare", description: "Introduceți un email valid.", variant: "destructive" }); return
    }

    setSubmitting(true)
    try {
      let patientId: string
      const existing = await fetch(`/api/patients?phone=${encodeURIComponent(phone)}`).then(r => r.json())
      const found = existing.find((p: any) => p.phone === phone)
      if (found) {
        patientId = found.id
      } else {
        const created = await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, email, status: "NOU" }),
        }).then(r => r.json())
        patientId = created.id
      }

      const duration = getServiceDuration()
      const [hours, minutes] = selectedTime.split(":").map(Number)
      const total = hours * 60 + minutes + duration
      const endTime = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate, startTime: selectedTime, endTime, duration,
          status: "IN_ASTEPTARE",
          type: selectedServiceId ? services.find(s => s.id === selectedServiceId)?.name : "CONSULTATIE",
          notes: selectedServiceId === "other" ? sanitize(otherServiceDescription) : null,
          patientId, doctorId: selectedDoctor, departmentId: selectedDepartment,
          serviceId: selectedServiceId === "other" ? null : selectedServiceId,
          sendEmail: true, sendSMS: true,
        }),
      })

      if (res.status === 409) {
        const data = await res.json()
        toast({ title: "Conflict", description: data.message || "Intervalul a fost ocupat.", variant: "destructive" })
        setStep(4); setSubmitting(false); return
      }
      if (!res.ok) throw new Error()

      setIsSubmitted(true)
      setTimeout(() => onClose(), 3000)
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut finaliza programarea. Reîncearcă.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredDoctors = selectedDepartment ? doctors.filter(d => d.departmentId === selectedDepartment) : []
  const filteredServices = selectedDepartment ? services.filter(s => s.departmentId === selectedDepartment) : []

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white rounded-2xl p-10 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-black italic text-slate-900 mb-2">Programare Realizată!</h3>
            <p className="text-sm text-slate-500">Vei primi un email de confirmare în curând.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#206070]">Rezervare Online</p>
              <h2 className="text-lg font-black italic text-slate-900 leading-tight">Programare PoliCare</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Step bar */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-colors duration-150 shrink-0",
                  step >= s ? "bg-[#206070] text-white" : "bg-slate-100 text-slate-400"
                )}>
                  {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {i < 4 && (
                  <div className={cn("h-0.5 flex-1 mx-1 rounded-full transition-colors duration-150", step > s ? "bg-[#206070]" : "bg-slate-100")} />
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{stepLabels[step - 1]}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Step 1 — Department */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-500">Alege departamentul dorit:</p>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                ))
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {departments.map((dept) => {
                    const Icon = departmentIcons[dept.name] || departmentIcons.default
                    return (
                      <button
                        key={dept.id}
                        onClick={() => { setSelectedDepartment(dept.id); setSelectedServiceId(null); setSelectedDoctor(null) }}
                        className={cn(
                          "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors duration-150",
                          selectedDepartment === dept.id
                            ? "border-[#206070] bg-[#206070]/5 text-[#206070]"
                            : "border-slate-100 bg-white hover:border-slate-200 text-slate-600"
                        )}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-black uppercase tracking-tight">{dept.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Service */}
          {step === 2 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-500 mb-3">Alege serviciul necesar:</p>
              {filteredServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => { setSelectedServiceId(service.id); setOtherServiceDescription("") }}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border-2 flex items-center justify-between transition-colors duration-150",
                    selectedServiceId === service.id
                      ? "border-[#206070] bg-[#206070]/5"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  )}
                >
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">{service.name}</p>
                    <p className="text-xs text-slate-400">{service.duration} min</p>
                  </div>
                  {selectedServiceId === service.id && <Check className="w-4 h-4 text-[#206070] shrink-0" />}
                </button>
              ))}
              <button
                onClick={() => setSelectedServiceId("other")}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border-2 text-left transition-colors duration-150",
                  selectedServiceId === "other"
                    ? "border-[#206070] bg-[#206070]/5"
                    : "border-slate-100 bg-white hover:border-slate-200"
                )}
              >
                <p className="text-sm font-bold text-slate-500">Alt serviciu / Specific</p>
              </button>
              {selectedServiceId === "other" && (
                <Textarea
                  placeholder="Descrieți motivul consultației..."
                  value={otherServiceDescription}
                  onChange={(e) => setOtherServiceDescription(e.target.value)}
                  className="rounded-xl bg-slate-50 border-slate-200 text-sm mt-2"
                  rows={3}
                />
              )}
            </div>
          )}

          {/* Step 3 — Doctor */}
          {step === 3 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-500 mb-3">
                Echipa din {departments.find(d => d.id === selectedDepartment)?.name}:
              </p>
              {filteredDoctors.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Niciun medic disponibil în acest departament.</p>
              ) : filteredDoctors.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoctor(doc.id)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border-2 flex items-center gap-3 transition-colors duration-150",
                    selectedDoctor === doc.id
                      ? "border-[#206070] bg-[#206070]/5"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#206070] to-[#40A0D0] flex items-center justify-center text-white text-sm font-black shrink-0">
                    {doc.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">{doc.name}</p>
                    <p className="text-xs text-slate-400">{doc.specialty}</p>
                  </div>
                  {selectedDoctor === doc.id && <Check className="w-4 h-4 text-[#206070] ml-auto shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* Step 4 — Date & Time */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-slate-500 mb-1.5 block">Data programării</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime("") }}
                  min={new Date().toISOString().split("T")[0]}
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm"
                />
              </div>

              {selectedDate && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-500">Interval orar</Label>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {getServiceDuration()} min
                    </span>
                  </div>
                  {checkingAvailability ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-[#206070] animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5">
                      {timeSlots.map((time) => {
                        const occupied = isSlotOccupied(time)
                        return (
                          <button
                            key={time}
                            disabled={occupied}
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              "h-9 rounded-lg text-xs font-bold transition-colors duration-150",
                              occupied
                                ? "bg-slate-50 text-slate-200 cursor-not-allowed"
                                : selectedTime === time
                                  ? "bg-[#206070] text-white"
                                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                            )}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">Intervalele gri sunt deja ocupate.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5 — Contact */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-500 space-y-1 mb-2">
                <p><span className="font-bold text-slate-700">Data:</span> {selectedDate} la {selectedTime}</p>
                <p><span className="font-bold text-slate-700">Medic:</span> {doctors.find(d => d.id === selectedDoctor)?.name}</p>
                <p><span className="font-bold text-slate-700">Durată:</span> {getServiceDuration()} min</p>
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-500 mb-1.5 block">Nume complet *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: sanitize(e.target.value) })}
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm"
                  placeholder="Ion Popescu"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-500 mb-1.5 block">Telefon *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: sanitize(e.target.value) })}
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm"
                  placeholder="0712 345 678"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-500 mb-1.5 block">Email *</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: sanitize(e.target.value) })}
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm"
                  placeholder="nume@email.com"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="h-9 px-4 rounded-xl text-sm font-bold text-slate-400"
          >
            Înapoi
          </Button>

          {step < 5 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="h-9 px-5 bg-[#206070] hover:bg-[#1a4d5a] rounded-xl text-sm font-bold"
            >
              Continuă <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !canProceed()}
              className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-bold"
            >
              {submitting ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Se trimite...</> : <><Check className="mr-1.5 w-4 h-4" />Confirmă</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
