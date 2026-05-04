"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Heart, Users, Baby, Eye, Ear, ChevronRight, Check, Loader2, Clock, AlertCircle, CalendarX } from "lucide-react"
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
  avatar: string | null
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
  const [preferences, setPreferences] = useState({ email: true, sms: true })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const [occupiedSlots, setOccupiedSlots] = useState<ExistingAppointment[]>([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/departments").then(r => r.json()),
      fetch("/api/doctors").then(r => r.json()),
      fetch("/api/services").then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ])
      .then(([depts, docs, svcs, sett]) => {
        setDepartments(depts)
        setDoctors(docs)
        setServices(svcs)
        setSettings(sett)
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

  const sanitize = (s: string) => s.replace(/[<>]/g, "")
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  const validatePhone = (p: string) => /^[0-9+\s()-]{10,20}$/.test(p)

  const getServiceDuration = () => {
    if (!selectedServiceId) return 30
    return services.find(s => s.id === selectedServiceId)?.duration ?? 30
  }

  const isSlotOccupied = (time: string) => {
    if (selectedDate) {
      const today = new Date()
      // Adjust for local timezone if needed, but simple comparison works for most cases
      const isToday = selectedDate === new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0]
      if (isToday) {
        const [h, m] = time.split(":").map(Number)
        if (h < today.getHours() || (h === today.getHours() && m <= today.getMinutes())) {
          return true // Time has passed today
        }
      }
    }

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
    const name = sanitize(formData.name).trim()
    const email = sanitize(formData.email.toLowerCase()).trim()
    const phone = sanitize(formData.phone).trim()

    if (name.length < 2) {
      toast({ title: "Eroare", description: "Introduceți un nume valid.", variant: "destructive" }); return
    }
    if (!validateEmail(email)) {
      toast({ title: "Eroare", description: "Introduceți un email valid.", variant: "destructive" }); return
    }

    setSubmitting(true)
    try {
      let patientId: string
      // Smart lookup by phone OR email
      const existing = await fetch(`/api/patients?phone=${encodeURIComponent(phone)}&email=${encodeURIComponent(email)}`).then(r => r.json())
      const found = existing.find((p: any) => p.phone === phone || p.email === email)
      
      if (found) {
        patientId = found.id
        // Update profile if they provided new contact info
        if (found.phone !== phone || found.email !== email || found.name !== name) {
          await fetch(`/api/patients/${found.id}`, {
             method: "PUT",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ name, phone, email })
          })
        }
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
          sendEmail: preferences.email, sendSMS: preferences.sms,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl h-[90vh] sm:h-[640px] flex flex-col animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-300">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#206070] mb-0.5">Rezervare Online</p>
              <h2 className="text-xl font-black text-slate-900 leading-tight">Programare PoliCare</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl h-9 w-9 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Step bar */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-200 shrink-0",
                  step >= s ? "bg-[#206070] text-white shadow-sm shadow-[#206070]/30" : "bg-slate-100 text-slate-400"
                )}>
                  {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {i < 4 && (
                  <div className={cn("h-0.5 flex-1 mx-1.5 rounded-full transition-colors duration-300", step > s ? "bg-[#206070]" : "bg-slate-100")} />
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{stepLabels[step - 1]}</p>
        </div>

        {/* Content */}
        <form onSubmit={(e) => { e.preventDefault(); if (step === 5) handleSubmit(); }} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Step 1 — Department */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-500">Alege departamentul dorit:</p>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                ))
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {departments.map((dept) => {
                    const Icon = departmentIcons[dept.name] || departmentIcons.default
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => { setSelectedDepartment(dept.id); setSelectedServiceId(null); setSelectedDoctor(null) }}
                        className={cn(
                          "p-5 rounded-xl border-2 flex flex-col items-center gap-2.5 transition-all duration-150 hover:-translate-y-0.5",
                          selectedDepartment === dept.id
                            ? "border-[#206070] bg-[#206070]/5 text-[#206070] shadow-sm"
                            : "border-slate-100 bg-slate-50/50 hover:border-slate-200 text-slate-500"
                        )}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-bold tracking-tight text-center leading-tight">{dept.name}</span>
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
                  {doc.avatar ? (
                    <img 
                      src={doc.avatar} 
                      alt={doc.name} 
                      className="w-10 h-10 rounded-xl object-cover shrink-0" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#206070] to-[#40A0D0] flex items-center justify-center text-white text-sm font-black shrink-0">
                      {doc.name.charAt(0)}
                    </div>
                  )}
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
                  onChange={(e) => {
                    const date = new Date(e.target.value)
                    const jsDay = date.getDay()
                    const adminDay = (jsDay + 6) % 7
                    if (settings && !settings.workingDays.split(",").includes(String(adminDay))) {
                      toast({ title: "Zi nelucrătoare", description: "Clinica este închisă în această zi.", variant: "destructive" })
                      return
                    }
                    setSelectedDate(e.target.value)
                    setSelectedTime("")
                  }}
                  min={new Date().toISOString().split("T")[0]}
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm"
                />
              </div>

              {selectedDate && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-500">Interval orar</Label>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                        {settings?.workdayStart} - {settings?.workdayEnd}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {getServiceDuration()} min
                      </span>
                    </div>
                  </div>
                  {checkingAvailability ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-[#206070] animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {(() => {
                        const slots = []
                        if (settings) {
                          let curr = settings.workdayStart
                          const end = settings.workdayEnd
                          while (curr < end) {
                            slots.push(curr)
                            const [h, m] = curr.split(":").map(Number)
                            const nextM = m + 15
                            const nextH = h + Math.floor(nextM / 60)
                            curr = `${String(nextH).padStart(2, "0")}:${String(nextM % 60).padStart(2, "0")}`
                          }
                        } else {
                          // Fallback to defaults while loading
                          return ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"].map(time => {
                            const occupied = isSlotOccupied(time)
                            return (
                              <button key={time} type="button" disabled className="h-10 rounded-xl text-xs font-semibold bg-slate-50 text-slate-200">{time}</button>
                            )
                          })
                        }
                        
                        const availableSlotsCount = slots.filter(time => !isSlotOccupied(time)).length
                        
                        if (slots.length > 0 && availableSlotsCount === 0) {
                          return (
                            <div className="col-span-4 sm:col-span-6 flex flex-col items-center justify-center py-6 text-center">
                              <CalendarX className="w-8 h-8 text-slate-300 mb-2" />
                              <p className="text-sm font-semibold text-slate-600">Nu mai sunt locuri disponibile.</p>
                              <p className="text-xs text-slate-400 mt-1">Te rugăm să alegi o altă zi pentru programare.</p>
                            </div>
                          )
                        }

                        return slots.map((time) => {
                          const occupied = isSlotOccupied(time)
                          return (
                            <button
                              key={time}
                              type="button"
                              disabled={occupied}
                              onClick={() => setSelectedTime(time)}
                              className={cn(
                                "h-10 rounded-xl text-xs font-semibold transition-all duration-150",
                                occupied
                                  ? "bg-slate-50 text-slate-200 cursor-not-allowed"
                                  : selectedTime === time
                                    ? "bg-[#206070] text-white shadow-sm"
                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                              )}
                            >
                              {time}
                            </button>
                          )
                        })
                      })()}
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

          {step === 5 && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rezumat programare</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><p className="text-[10px] text-slate-400 mb-0.5">Data</p><p className="text-xs font-bold text-slate-800">{selectedDate}</p></div>
                  <div><p className="text-[10px] text-slate-400 mb-0.5">Ora</p><p className="text-xs font-bold text-slate-800">{selectedTime}</p></div>
                  <div><p className="text-[10px] text-slate-400 mb-0.5">Durată</p><p className="text-xs font-bold text-slate-800">{getServiceDuration()} min</p></div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 mb-0.5">Medic</p>
                  <p className="text-xs font-bold text-slate-800">{doctors.find(d => d.id === selectedDoctor)?.name}</p>
                </div>
              </div>

              {/* Form fields — 2 cols on sm+ */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-500 mb-1.5 block">Nume complet *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: sanitize(e.target.value) })}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200"
                    placeholder="Ion Popescu"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-500 mb-1.5 block">Telefon *</Label>
                  <Input
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: sanitize(e.target.value) })}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200"
                    placeholder="0712 345 678"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-500 mb-1.5 block">Email *</Label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: sanitize(e.target.value) })}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200"
                    placeholder="nume@email.com"
                  />
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="pt-2">
                <p className="text-xs font-bold text-slate-500 mb-3">Opțiuni de confirmare</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white">
                    <button
                      type="button"
                      onClick={() => setPreferences({ ...preferences, email: !preferences.email })}
                      className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors", preferences.email ? "bg-[#206070] text-white" : "border-2 border-slate-200 bg-white")}
                    >
                      {preferences.email && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex-1 cursor-pointer" onClick={() => setPreferences({ ...preferences, email: !preferences.email })}>
                      <p className="text-sm font-semibold text-slate-700">Doresc confirmare pe Email</p>
                      <p className="text-xs text-slate-400">Vei primi detaliile programării pe email.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white">
                    <button
                      type="button"
                      onClick={() => setPreferences({ ...preferences, sms: !preferences.sms })}
                      className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors", preferences.sms ? "bg-[#206070] text-white" : "border-2 border-slate-200 bg-white")}
                    >
                      {preferences.sms && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex-1 cursor-pointer" onClick={() => setPreferences({ ...preferences, sms: !preferences.sms })}>
                      <p className="text-sm font-semibold text-slate-700">Doresc SMS cu remindere</p>
                      <p className="text-xs text-slate-400">Notificare imediată și cu 24h înainte.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white rounded-b-3xl sm:rounded-b-2xl">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="h-10 px-5 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            Înapoi
          </Button>

          {step < 5 ? (
            <Button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="h-10 px-6 bg-[#206070] hover:bg-[#1a4d5a] rounded-xl text-sm font-bold shadow-sm shadow-[#206070]/20"
            >
              Continuă <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={submitting || !canProceed()}
              className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-bold shadow-sm"
            >
              {submitting ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Se trimite...</> : <><Check className="mr-1.5 w-4 h-4" />Confirmă</>}
            </Button>
          )}
        </div>
        </form>
      </div>
    </div>
  )
}
