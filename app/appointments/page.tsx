"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  CalendarIcon,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Search,
  Loader2,
  Bell,
  Mail,
  Phone,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { useDebounce } from "@/hooks/use-debounce"

// Types
interface Notification {
  id: string
  type: "EMAIL" | "SMS"
  event: "CONFIRMATION" | "CANCELLATION" | "REMINDER" | "CUSTOM"
  status: "SENT" | "FAILED"
  recipient: string
  createdAt: string
}

interface Patient {
  id: string
  name: string
  phone: string
  email: string | null
}

interface Doctor {
  id: string
  name: string
  specialty: string | null
  departmentId: string | null
}

interface Department {
  id: string
  name: string
  color: string | null
}

interface Appointment {
  id: string
  date: string
  startTime: string
  endTime: string | null
  duration: number
  status: string
  type: string | null
  notes: string | null
  patient: Patient
  doctor: Doctor
  department: Department | null
  notifications?: Notification[]
}

const getMonday = (date: Date) => {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

// Status mapping for display
const getStatusDisplay = (status: string) => {
  switch (status) {
    case "CONFIRMAT": return "Confirmat"
    case "IN_ASTEPTARE": return "În așteptare"
    case "IN_DESFASURARE": return "În desfășurare"
    case "ANULAT": return "Anulat"
    case "FINALIZAT": return "Finalizat"
    case "NEPREZENTARE": return "Neprezentare"
    default: return status
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "CONFIRMAT": return "default"
    case "IN_ASTEPTARE": return "secondary"
    case "ANULAT": return "destructive"
    case "FINALIZAT": return "default"
    default: return "secondary"
  }
}

const getStatusBgColor = (status: string) => {
  switch (status) {
    case "CONFIRMAT": return "bg-green-100 border-green-200"
    case "IN_ASTEPTARE": return "bg-yellow-100 border-yellow-200"
    case "IN_DESFASURARE": return "bg-purple-100 border-purple-200"
    case "ANULAT": return "bg-red-100 border-red-200"
    case "FINALIZAT": return "bg-blue-100 border-blue-200"
    case "NEPREZENTARE": return "bg-gray-100 border-gray-200"
    default: return "bg-gray-100 border-gray-200"
  }
}

const getStatusTextColor = (status: string) => {
  switch (status) {
    case "CONFIRMAT": return "text-green-900"
    case "IN_ASTEPTARE": return "text-yellow-900"
    case "IN_DESFASURARE": return "text-purple-900"
    case "ANULAT": return "text-red-900"
    case "FINALIZAT": return "text-blue-900"
    case "NEPREZENTARE": return "text-gray-700"
    default: return "text-gray-900"
  }
}

const DAYS_OF_WEEK = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"]
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
]
const DECLINE_REASONS: Record<string, string> = {
  "Doctor Indisponibil":
    "Ne cerem scuze, dar doctorul nu este disponibil la data și ora selectată. Vă rugăm să reprogramați consultația pentru o altă oră convenabilă.",
  "Serviciu Neacoperit":
    "Din păcate, serviciul solicitat nu este disponibil în clinica noastră. Vă recomandăm să ne contactați pentru a discuta alternative.",
  "Date Incomplete":
    "Pentru a procesa programarea, avem nevoie de informații suplimentare. Vă rugăm să ne contactați pentru a completa datele necesare.",
  "Conflict Program":
    "Există un conflict în programul clinicii la data și ora selectată. Vă rugăm să alegeți un alt interval orar.",
  Altul: "",
}

export default function AppointmentsPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const prefillApplied = useRef(false)

  // View and UI state
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()))
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [declineModalOpen, setDeclineModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [editFormData, setEditFormData] = useState({ date: "", startTime: "", status: "", notes: "" })
  const [sendEmail, setSendEmail] = useState(true)
  const [sendSMS, setSendSMS] = useState(false)
  const [declineReason, setDeclineReason] = useState("")
  const [declineMessage, setDeclineMessage] = useState("")
  const [sendDeclineNotification, setSendDeclineNotification] = useState(true)
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing")
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [patientSearchTerm, setPatientSearchTerm] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("Toate")

  const debouncedPatientSearchTerm = useDebounce(patientSearchTerm, 200)
  const debouncedSearchTerm = useDebounce(searchTerm, 200)

  // Data state
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  // Loading states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)
  const [sendingBulkReminders, setSendingBulkReminders] = useState(false)

  const [appointmentFormData, setAppointmentFormData] = useState({
    patientName: "",
    patientPhone: "",
    patientEmail: "",
    patientGender: "",
    patientCnp: "",
    departmentId: "",
    doctorId: "",
    date: "",
    time: "",
    notes: "",
  })
  const [appointmentErrors, setAppointmentErrors] = useState<Record<string, boolean>>({})
  const [availabilityWarning, setAvailabilityWarning] = useState<string | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  // Fetch all data on mount
  const fetchData = async () => {
    try {
      const [appointmentsRes, patientsRes, doctorsRes, departmentsRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/patients"),
        fetch("/api/doctors"),
        fetch("/api/departments"),
      ])

      if (!appointmentsRes.ok || !patientsRes.ok || !doctorsRes.ok || !departmentsRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const [appointmentsData, patientsData, doctorsData, departmentsData] = await Promise.all([
        appointmentsRes.json(),
        patientsRes.json(),
        doctorsRes.json(),
        departmentsRes.json(),
      ])

      setAppointments(appointmentsData)
      setPatients(patientsData)
      setDoctors(doctorsData)
      setDepartments(departmentsData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca datele.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Pre-fill form from query params (doctorId / patientId / departmentId)
  useEffect(() => {
    if (loading || prefillApplied.current) return
    const doctorId = searchParams.get("doctorId")
    const patientId = searchParams.get("patientId")
    const departmentId = searchParams.get("departmentId")
    if (!doctorId && !patientId && !departmentId) return
    prefillApplied.current = true

    const updates: Partial<typeof appointmentFormData> = {}
    if (doctorId) updates.doctorId = doctorId
    if (departmentId) updates.departmentId = departmentId

    setAppointmentFormData((prev) => ({ ...prev, ...updates }))

    if (patientId) {
      setPatientMode("existing")
      setSelectedPatientId(patientId)
    }

    setIsNewAppointmentOpen(true)
  }, [loading, searchParams])

  // Real-time availability check when doctor + date + time are all filled (debounced 400ms)
  useEffect(() => {
    const { doctorId, date, time } = appointmentFormData
    if (!doctorId || !date || !time) {
      setAvailabilityWarning(null)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      const [hours, minutes] = time.split(":").map(Number)
      const endH = hours + Math.floor((minutes + 30) / 60)
      const endM = (minutes + 30) % 60
      const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`
      setCheckingAvailability(true)
      fetch(`/api/appointments/check?doctorId=${doctorId}&date=${date}&startTime=${time}&endTime=${endTime}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((data) => {
          setAvailabilityWarning(data.available ? null : data.reason)
        })
        .catch(() => {}) // ignore abort errors
        .finally(() => setCheckingAvailability(false))
    }, 400)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [appointmentFormData.doctorId, appointmentFormData.date, appointmentFormData.time])

  useEffect(() => {
    if (confirmModalOpen || declineModalOpen || isNewAppointmentOpen || editModalOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [confirmModalOpen, declineModalOpen, isNewAppointmentOpen, editModalOpen])

  useEffect(() => {
    if (declineReason && declineReason !== "Altul") {
      setDeclineMessage(DECLINE_REASONS[declineReason] || "")
    } else if (declineReason === "Altul") {
      setDeclineMessage("")
    }
  }, [declineReason])

  const handleConfirmClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setConfirmModalOpen(true)
  }

  const handleDeclineClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setDeclineReason("")
    setDeclineMessage("")
    setSendDeclineNotification(true)
    setDeclineModalOpen(true)
  }

  const handleFinalConfirm = async () => {
    if (!selectedAppointment) return

    setSaving(true)
    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMAT", sendEmail, sendSMS }),
      })

      if (!response.ok) throw new Error("Failed to confirm appointment")

      await fetchData()

      toast({
        title: "Programare confirmată",
        description: `Programarea pentru ${selectedAppointment.patient.name} a fost confirmată cu succes.`,
      })

      setConfirmModalOpen(false)
      setSelectedAppointment(null)
      setSendEmail(true)
      setSendSMS(false)
    } catch (error) {
      console.error("Error confirming appointment:", error)
      toast({
        title: "Eroare",
        description: "Nu s-a putut confirma programarea.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFinalDecline = async () => {
    if (!selectedAppointment) return

    setSaving(true)
    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ANULAT",
          notes: `Motiv: ${declineReason}. ${declineMessage}`,
          sendEmail: sendDeclineNotification,
          sendSMS: sendDeclineNotification,
        }),
      })

      if (!response.ok) throw new Error("Failed to decline appointment")

      await fetchData()

      toast({
        title: "Programare respinsă",
        description: `Programarea pentru ${selectedAppointment.patient.name} a fost respinsă.`,
        variant: "destructive",
      })

      setDeclineModalOpen(false)
      setSelectedAppointment(null)
      setDeclineReason("")
      setDeclineMessage("")
      setSendDeclineNotification(true)
    } catch (error) {
      console.error("Error declining appointment:", error)
      toast({
        title: "Eroare",
        description: "Nu s-a putut respinge programarea.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    const dateStr = new Date(appointment.date).toISOString().split("T")[0]
    setEditFormData({
      date: dateStr,
      startTime: appointment.startTime,
      status: appointment.status,
      notes: appointment.notes || "",
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingAppointment) return

    setSaving(true)
    try {
      // Recalculate end time based on duration
      const [hours, minutes] = editFormData.startTime.split(":").map(Number)
      const endHours = hours + Math.floor((minutes + editingAppointment.duration) / 60)
      const endMinutes = (minutes + editingAppointment.duration) % 60
      const endTime = `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`

      const response = await fetch(`/api/appointments/${editingAppointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: editFormData.date,
          startTime: editFormData.startTime,
          endTime,
          status: editFormData.status,
          notes: editFormData.notes || null,
        }),
      })

      if (response.status === 409) {
        const data = await response.json()
        toast({ title: "Conflict de programare", description: data.message || "Medicul nu este disponibil.", variant: "destructive" })
        setSaving(false)
        return
      }
      if (!response.ok) throw new Error("Failed to update appointment")

      await fetchData()
      setEditModalOpen(false)
      setEditingAppointment(null)
      toast({ title: "Programare actualizată", description: "Modificările au fost salvate cu succes." })
    } catch (error) {
      console.error("Error updating appointment:", error)
      toast({ title: "Eroare", description: "Nu s-a putut actualiza programarea.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleStartAppointment = async (appointment: Appointment) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_DESFASURARE" }),
      })
      if (!response.ok) throw new Error("Failed to start appointment")
      await fetchData()
      toast({ title: "Consultație începută", description: `Consultația pentru ${appointment.patient.name} este în desfășurare.` })
    } catch (error) {
      console.error("Error starting appointment:", error)
      toast({ title: "Eroare", description: "Nu s-a putut începe consultația.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleFinishAppointment = async (appointment: Appointment) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "FINALIZAT" }),
      })
      if (!response.ok) throw new Error("Failed to finish appointment")
      await fetchData()
      toast({
        title: "Consultație finalizată",
        description: `Consultația pentru ${appointment.patient.name} a fost finalizată. Adaugă fișă medicală în profilul pacientului.`,
      })
    } catch (error) {
      console.error("Error finishing appointment:", error)
      toast({ title: "Eroare", description: "Nu s-a putut finaliza consultația.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleNoShow = async (appointment: Appointment) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "NEPREZENTARE" }),
      })
      if (!response.ok) throw new Error("Failed to mark no-show")
      await fetchData()
      toast({ title: "Neprezentare înregistrată", description: `${appointment.patient.name} nu s-a prezentat la programare.`, variant: "destructive" })
    } catch (error) {
      console.error("Error marking no-show:", error)
      toast({ title: "Eroare", description: "Nu s-a putut actualiza statusul.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleSendReminder = async (appointment: Appointment) => {
    setSendingReminder(appointment.id)
    try {
      const res = await fetch("/api/notifications/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: appointment.id }),
      })
      if (!res.ok) throw new Error("Failed")
      toast({ title: "Reminder trimis", description: `Reminder trimis pentru ${appointment.patient.name}.` })
      await fetchData()
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut trimite reminder-ul.", variant: "destructive" })
    } finally {
      setSendingReminder(null)
    }
  }

  const handleBulkReminders = async () => {
    setSendingBulkReminders(true)
    try {
      const res = await fetch("/api/notifications/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error("Failed")
      toast({ title: "Remindere trimise", description: `${data.sent} reminder(e) au fost trimise.` })
      await fetchData()
    } catch {
      toast({ title: "Eroare", description: "Nu s-au putut trimite reminderele.", variant: "destructive" })
    } finally {
      setSendingBulkReminders(false)
    }
  }

  // Filter patients for search (memoized + debounced to avoid re-filtering on unrelated state changes)
  const filteredPatients = useMemo(
    () =>
      patients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(debouncedPatientSearchTerm.toLowerCase()) ||
          patient.phone.includes(debouncedPatientSearchTerm) ||
          (patient.email && patient.email.toLowerCase().includes(debouncedPatientSearchTerm.toLowerCase())),
      ),
    [patients, debouncedPatientSearchTerm],
  )

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatientId(patient.id)
    setAppointmentFormData({
      ...appointmentFormData,
      patientName: patient.name,
      patientPhone: patient.phone,
      patientEmail: patient.email || "",
    })
    setAppointmentErrors({
      ...appointmentErrors,
      patientName: false,
      patientPhone: false,
    })
  }

  const handleAddAppointment = async () => {
    const errors: Record<string, boolean> = {
      patientName: !appointmentFormData.patientName,
      patientPhone: !appointmentFormData.patientPhone,
      patientGender: patientMode === "new" && !appointmentFormData.patientGender,
      patientCnp: patientMode === "new" && !appointmentFormData.patientCnp,
      departmentId: !appointmentFormData.departmentId,
      doctorId: !appointmentFormData.doctorId,
      date: !appointmentFormData.date,
      time: !appointmentFormData.time,
    }

    if (patientMode === "existing" && !selectedPatientId) {
      errors.patientName = true
    }

    setAppointmentErrors(errors)

    if (Object.values(errors).some((error) => error)) {
      toast({
        title: "Eroare validare",
        description: "Te rugăm să completezi toate câmpurile obligatorii.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // If new patient mode, create patient first
      let patientId = selectedPatientId
      if (patientMode === "new") {
        const patientRes = await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: appointmentFormData.patientName,
            phone: appointmentFormData.patientPhone,
            email: appointmentFormData.patientEmail || null,
            gender: appointmentFormData.patientGender,
            cnp: appointmentFormData.patientCnp,
            status: "NOU",
          }),
        })
        if (!patientRes.ok) throw new Error("Failed to create patient")
        const newPatient = await patientRes.json()
        patientId = newPatient.id
      }

      // Calculate end time (30 min default)
      const [hours, minutes] = appointmentFormData.time.split(":").map(Number)
      const endHours = hours + Math.floor((minutes + 30) / 60)
      const endMinutes = (minutes + 30) % 60
      const endTime = `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: appointmentFormData.date,
          startTime: appointmentFormData.time,
          endTime: endTime,
          duration: 30,
          status: "IN_ASTEPTARE",
          type: "CONSULTATIE",
          notes: appointmentFormData.notes || null,
          patientId: patientId,
          doctorId: appointmentFormData.doctorId,
          departmentId: appointmentFormData.departmentId,
        }),
      })

      if (response.status === 409) {
        const data = await response.json()
        toast({ title: "Conflict de programare", description: data.message || "Medicul nu este disponibil.", variant: "destructive" })
        setSaving(false)
        return
      }
      if (!response.ok) throw new Error("Failed to create appointment")

      await fetchData()

      toast({
        title: "Programare creată",
        description: "Programarea a fost adăugată cu succes în sistem.",
      })

      setIsNewAppointmentOpen(false)
      setPatientMode("existing")
      setSelectedPatientId("")
      setPatientSearchTerm("")
      setAppointmentFormData({
        patientName: "",
        patientPhone: "",
        patientEmail: "",
        patientGender: "",
        patientCnp: "",
        departmentId: "",
        doctorId: "",
        date: "",
        time: "",
        notes: "",
      })
      setAppointmentErrors({})
      setAvailabilityWarning(null)
    } catch (error) {
      console.error("Error creating appointment:", error)
      toast({
        title: "Eroare",
        description: "Nu s-a putut crea programarea.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((apt) => {
        const matchesSearch =
          apt.patient.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          apt.doctor.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        const matchesFilter = statusFilter === "Toate" || getStatusDisplay(apt.status) === statusFilter
        return matchesSearch && matchesFilter
      }),
    [appointments, debouncedSearchTerm, statusFilter],
  )

  // Pre-index calendar slots for O(1) lookup instead of O(n) per cell
  const calendarIndex = useMemo(() => {
    const index = new Map<string, Appointment[]>()
    filteredAppointments.forEach((apt) => {
      const aptDate = new Date(apt.date)
      const aptDayOfWeek = aptDate.getDay() === 0 ? 7 : aptDate.getDay()
      const aptHour = apt.startTime.split(":")[0]
      const key = `${aptDayOfWeek}-${aptHour}`
      if (!index.has(key)) index.set(key, [])
      index.get(key)!.push(apt)
    })
    return index
  }, [filteredAppointments])

  const weekDates = useMemo(() => {
    const monday = new Date(currentWeekStart)
    return DAYS_OF_WEEK.map((_, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      return date.toLocaleDateString("ro-RO", { day: "numeric", month: "short" })
    })
  }, [currentWeekStart])

  const stats = useMemo(
    () => ({
      confirmed: appointments.filter((a) => a.status === "CONFIRMAT").length,
      waiting: appointments.filter((a) => a.status === "IN_ASTEPTARE").length,
      inProgress: appointments.filter((a) => a.status === "IN_DESFASURARE").length,
    }),
    [appointments],
  )

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1600px] mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-2">Programări</h1>
              <p className="text-muted-foreground">Gestionează programările și calendar</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={handleBulkReminders} disabled={sendingBulkReminders}>
                {sendingBulkReminders ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                Trimite Remindere
              </Button>
              <Button className="gap-2" onClick={() => setIsNewAppointmentOpen(true)}>
                <Plus className="w-4 h-4" />
                Programare Nouă
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-semibold">{appointments.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confirmate</p>
                  <p className="text-2xl font-semibold">{stats.confirmed}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">În Așteptare</p>
                  <p className="text-2xl font-semibold">{stats.waiting}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">În desfășurare</p>
                  <p className="text-2xl font-semibold">{stats.inProgress}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex gap-4 flex-1">
              <div className="relative max-w-md flex-1">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Caută pacient sau medic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {["Toate", "Confirmat", "În așteptare", "Anulat"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="gap-2"
              >
                <List className="w-4 h-4" />
                Listă
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className="gap-2"
              >
                <CalendarDays className="w-4 h-4" />
                Calendar
              </Button>
            </div>
          </div>

          {viewMode === "calendar" && (
            <div className="mb-6 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeekStart(getMonday(new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60)))}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Săptămâna Trecută
              </Button>
              <span className="text-sm font-medium">
                {new Date().toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeekStart(getMonday(new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60)))}
                className="gap-2"
              >
                Săptămâna Viitoare
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {viewMode === "list" ? (
            <Card>
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">Se încarcă programările...</p>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">Nu există programări.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">{appointment.patient.name}</span>
                            </div>
                            <Badge variant={getStatusColor(appointment.status)}>
                              {getStatusDisplay(appointment.status)}
                            </Badge>
                            {appointment.type && <Badge variant="outline">{appointment.type}</Badge>}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              <span>{appointment.doctor.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{new Date(appointment.date).toLocaleDateString("ro-RO")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                {appointment.startTime} ({appointment.duration} min)
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">{appointment.department?.name || "—"}</span>
                            </div>
                          </div>

                          {/* Notification status badges */}
                          {appointment.notifications && appointment.notifications.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                              {(() => {
                                const latestEmail = appointment.notifications!.find(n => n.type === "EMAIL")
                                const latestSMS = appointment.notifications!.find(n => n.type === "SMS")
                                return (
                                  <>
                                    {latestEmail && (
                                      <span
                                        title={`Email: ${latestEmail.status === "SENT" ? "Trimis" : "Eșuat"} (${latestEmail.event})`}
                                        className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md border ${
                                          latestEmail.status === "SENT"
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : "bg-red-50 text-red-700 border-red-200"
                                        }`}
                                      >
                                        <Mail className="w-3 h-3" />
                                        Email {latestEmail.status === "SENT" ? "trimis" : "eșuat"}
                                      </span>
                                    )}
                                    {latestSMS && (
                                      <span
                                        title={`SMS: ${latestSMS.status === "SENT" ? "Trimis" : "Eșuat"} (${latestSMS.event})`}
                                        className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md border ${
                                          latestSMS.status === "SENT"
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : "bg-red-50 text-red-700 border-red-200"
                                        }`}
                                      >
                                        <Phone className="w-3 h-3" />
                                        SMS {latestSMS.status === "SENT" ? "trimis" : "eșuat"}
                                      </span>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          {appointment.status === "IN_ASTEPTARE" && (
                            <>
                              <Button variant="default" size="sm" onClick={() => handleConfirmClick(appointment)}>
                                Confirmă
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeclineClick(appointment)}>
                                Respinge
                              </Button>
                            </>
                          )}
                          {appointment.status === "CONFIRMAT" && (
                            <>
                              <Button variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => handleStartAppointment(appointment)} disabled={saving}>
                                Începe
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => handleSendReminder(appointment)}
                                disabled={sendingReminder === appointment.id}
                                title="Trimite reminder pacientului"
                              >
                                {sendingReminder === appointment.id
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <Bell className="w-3 h-3" />}
                                Reminder
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeclineClick(appointment)}>
                                Anulează
                              </Button>
                            </>
                          )}
                          {appointment.status === "IN_DESFASURARE" && (
                            <>
                              <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleFinishAppointment(appointment)} disabled={saving}>
                                Finalizează
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleNoShow(appointment)} disabled={saving}>
                                Neprezentare
                              </Button>
                            </>
                          )}
                          {!["FINALIZAT", "ANULAT", "NEPREZENTARE"].includes(appointment.status) && (
                            <Button variant="outline" size="sm" onClick={() => handleEditClick(appointment)}>
                              Reprogramează
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card className="overflow-x-auto">
              <div className="min-w-[1200px]">
                <div className="grid grid-cols-8 border-b bg-muted/30">
                  <div className="p-4 font-medium text-sm text-muted-foreground border-r">Oră</div>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <div key={day} className="p-4 text-center border-r last:border-r-0">
                      <div className="font-semibold text-sm">{day}</div>
                      <div className="text-xs text-muted-foreground mt-1">{weekDates[index]}</div>
                    </div>
                  ))}
                </div>

                <div className="divide-y">
                  {TIME_SLOTS.map((time) => (
                    <div key={time} className="grid grid-cols-8 min-h-[80px]">
                      <div className="p-3 text-sm font-medium text-muted-foreground border-r flex items-start">
                        {time}
                      </div>
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                        const appointmentsInSlot = calendarIndex.get(`${day}-${time.split(":")[0]}`) ?? []
                        return (
                          <div key={day} className="border-r last:border-r-0 p-2 hover:bg-muted/30 transition-colors">
                            {appointmentsInSlot.map((apt) => (
                              <div
                                key={apt.id}
                                className={`p-2 rounded-lg border mb-2 cursor-pointer hover:shadow-md transition-shadow ${getStatusBgColor(apt.status)}`}
                              >
                                <div className={`text-xs font-semibold ${getStatusTextColor(apt.status)} mb-1`}>
                                  {apt.startTime}
                                </div>
                                <div className={`text-xs font-medium ${getStatusTextColor(apt.status)} mb-1`}>
                                  {apt.patient.name}
                                </div>
                                <div className={`text-xs ${getStatusTextColor(apt.status)} opacity-80`}>
                                  {apt.doctor.name}
                                </div>
                                <div className={`text-xs ${getStatusTextColor(apt.status)} opacity-70 mt-1`}>
                                  {apt.department?.name || "—"}
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Appointment Dialog */}
      <Dialog
        open={isNewAppointmentOpen}
        onOpenChange={(open) => {
          setIsNewAppointmentOpen(open)
          if (!open) {
            setPatientMode("existing")
            setSelectedPatientId("")
            setPatientSearchTerm("")
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Programare Nouă</DialogTitle>
            <DialogDescription>Completează detaliile programării</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Tabs value={patientMode} onValueChange={(v) => setPatientMode(v as "existing" | "new")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Pacient Existent</TabsTrigger>
                <TabsTrigger value="new">Pacient Nou</TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">
                    Caută pacient <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Caută după nume, telefon sau email..."
                      value={patientSearchTerm}
                      onChange={(e) => setPatientSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">Niciun pacient găsit</div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-accent transition-colors ${
                          selectedPatientId === patient.id ? "bg-accent" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-sm text-muted-foreground">{patient.phone}</p>
                          </div>
                          {selectedPatientId === patient.id && <CheckCircle className="w-5 h-5 text-primary" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {appointmentErrors.patientName && !selectedPatientId && (
                  <p className="text-sm text-destructive">Selectează un pacient</p>
                )}
              </TabsContent>

              <TabsContent value="new" className="space-y-4">
                <div>
                  <Label htmlFor="patientName" className="block text-sm font-medium text-foreground">
                    Nume pacient <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="patientName"
                    placeholder="Ion Popescu"
                    value={appointmentFormData.patientName}
                    onChange={(e) => {
                      setAppointmentFormData({ ...appointmentFormData, patientName: e.target.value })
                      setAppointmentErrors({ ...appointmentErrors, patientName: false })
                    }}
                    className={`mt-2 ${appointmentErrors.patientName ? "border-destructive" : ""}`}
                  />
                  {appointmentErrors.patientName && (
                    <p className="text-sm text-destructive mt-1">Numele pacientului este obligatoriu</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patientPhone" className="block text-sm font-medium text-foreground">
                      Telefon <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="patientPhone"
                      type="tel"
                      placeholder="+40 723 456 789"
                      value={appointmentFormData.patientPhone}
                      onChange={(e) => {
                        setAppointmentFormData({ ...appointmentFormData, patientPhone: e.target.value })
                        setAppointmentErrors({ ...appointmentErrors, patientPhone: false })
                      }}
                      className={`mt-2 ${appointmentErrors.patientPhone ? "border-destructive" : ""}`}
                    />
                    {appointmentErrors.patientPhone && (
                      <p className="text-sm text-destructive mt-1">Telefonul este obligatoriu</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="patientEmail" className="block text-sm font-medium text-foreground">
                      Email
                    </Label>
                    <Input
                      id="patientEmail"
                      type="email"
                      placeholder="pacient@email.com"
                      value={appointmentFormData.patientEmail}
                      onChange={(e) => setAppointmentFormData({ ...appointmentFormData, patientEmail: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-foreground">
                      Gen <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={appointmentFormData.patientGender}
                      onValueChange={(value) => {
                        setAppointmentFormData({ ...appointmentFormData, patientGender: value })
                        setAppointmentErrors({ ...appointmentErrors, patientGender: false })
                      }}
                    >
                      <SelectTrigger className={`mt-2 ${appointmentErrors.patientGender ? "border-destructive" : ""}`}>
                        <SelectValue placeholder="Selectează" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MASCULIN">Masculin</SelectItem>
                        <SelectItem value="FEMININ">Feminin</SelectItem>
                        <SelectItem value="ALTUL">Altul</SelectItem>
                      </SelectContent>
                    </Select>
                    {appointmentErrors.patientGender && <p className="text-sm text-destructive mt-1">Genul este obligatoriu</p>}
                  </div>
                  <div>
                    <Label htmlFor="patientCnp" className="block text-sm font-medium text-foreground">
                      CNP <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="patientCnp"
                      placeholder="1234567890123"
                      value={appointmentFormData.patientCnp}
                      onChange={(e) => {
                        setAppointmentFormData({ ...appointmentFormData, patientCnp: e.target.value })
                        setAppointmentErrors({ ...appointmentErrors, patientCnp: false })
                      }}
                      className={`mt-2 ${appointmentErrors.patientCnp ? "border-destructive" : ""}`}
                    />
                    {appointmentErrors.patientCnp && <p className="text-sm text-destructive mt-1">CNP-ul este obligatoriu</p>}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label htmlFor="department" className="block text-sm font-medium text-foreground">
                Departament <span className="text-destructive">*</span>
              </Label>
              <Select
                value={appointmentFormData.departmentId}
                onValueChange={(value) => {
                  setAppointmentFormData({ ...appointmentFormData, departmentId: value, doctorId: "" })
                  setAppointmentErrors({ ...appointmentErrors, departmentId: false })
                }}
              >
                <SelectTrigger className={`mt-2 ${appointmentErrors.departmentId ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Selectează departamentul" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {appointmentErrors.departmentId && (
                <p className="text-sm text-destructive mt-1">Departamentul este obligatoriu</p>
              )}
            </div>

            <div>
              <Label htmlFor="doctor" className="block text-sm font-medium text-foreground">
                Medic <span className="text-destructive">*</span>
              </Label>
              <Select
                value={appointmentFormData.doctorId}
                onValueChange={(value) => {
                  setAppointmentFormData({ ...appointmentFormData, doctorId: value })
                  setAppointmentErrors({ ...appointmentErrors, doctorId: false })
                }}
              >
                <SelectTrigger className={`mt-2 ${appointmentErrors.doctorId ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Selectează medicul" />
                </SelectTrigger>
                <SelectContent>
                  {doctors
                    .filter((doc) => !appointmentFormData.departmentId || doc.departmentId === appointmentFormData.departmentId)
                    .map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {appointmentErrors.doctorId && <p className="text-sm text-destructive mt-1">Medicul este obligatoriu</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="block text-sm font-medium text-foreground">
                  Data <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={appointmentFormData.date}
                  onChange={(e) => {
                    setAppointmentFormData({ ...appointmentFormData, date: e.target.value })
                    setAppointmentErrors({ ...appointmentErrors, date: false })
                  }}
                  className={`mt-2 ${appointmentErrors.date ? "border-destructive" : ""}`}
                />
                {appointmentErrors.date && <p className="text-sm text-destructive mt-1">Data este obligatorie</p>}
              </div>
              <div>
                <Label htmlFor="time" className="block text-sm font-medium text-foreground">
                  Ora <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={appointmentFormData.time}
                  onValueChange={(value) => {
                    setAppointmentFormData({ ...appointmentFormData, time: value })
                    setAppointmentErrors({ ...appointmentErrors, time: false })
                  }}
                >
                  <SelectTrigger className={`mt-2 ${appointmentErrors.time ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Selectează ora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00">09:00</SelectItem>
                    <SelectItem value="10:00">10:00</SelectItem>
                    <SelectItem value="11:00">11:00</SelectItem>
                    <SelectItem value="14:00">14:00</SelectItem>
                    <SelectItem value="15:00">15:00</SelectItem>
                    <SelectItem value="16:00">16:00</SelectItem>
                  </SelectContent>
                </Select>
                {appointmentErrors.time && <p className="text-sm text-destructive mt-1">Ora este obligatorie</p>}
              </div>
            </div>

            {/* Availability feedback */}
            {checkingAvailability && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Se verifică disponibilitatea...</span>
              </div>
            )}
            {!checkingAvailability && availabilityWarning && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{availabilityWarning}</span>
              </div>
            )}

            <div>
              <Label htmlFor="notes" className="block text-sm font-medium text-foreground">
                Observații
              </Label>
              <Textarea
                id="notes"
                placeholder="Menționează orice detalii importante..."
                value={appointmentFormData.notes}
                onChange={(e) => setAppointmentFormData({ ...appointmentFormData, notes: e.target.value })}
                rows={3}
                className="resize-none mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewAppointmentOpen(false)} disabled={saving}>
              Anulează
            </Button>
            <Button onClick={handleAddAppointment} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se salvează...
                </>
              ) : (
                "Creează Programare"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmă Programarea</DialogTitle>
            <DialogDescription>
              Ești sigur că vrei să confirmi această programare pentru {selectedAppointment?.patient.name}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <XCircle className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{selectedAppointment?.patient.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedAppointment?.date && new Date(selectedAppointment.date).toLocaleDateString("ro-RO")} la {selectedAppointment?.startTime}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{selectedAppointment?.doctor.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedAppointment?.department?.name || "—"}</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Opțiuni Notificare:</p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email"
                    checked={sendEmail}
                    onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                  />
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Trimite Notificare Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="sms" checked={sendSMS} onCheckedChange={(checked) => setSendSMS(checked as boolean)} />
                  <Label
                    htmlFor="sms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Trimite Notificare SMS
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)} disabled={saving}>
              Anulează
            </Button>
            <Button onClick={handleFinalConfirm} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se confirmă...
                </>
              ) : (
                "Confirmă & Notifică"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={declineModalOpen} onOpenChange={setDeclineModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              Respinge Programarea
            </DialogTitle>
            <DialogDescription>
              Această acțiune va anula programarea și va notifica pacientul {selectedAppointment?.patient.name} cu
              explicațiile tale.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <XCircle className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{selectedAppointment?.patient.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedAppointment?.date && new Date(selectedAppointment.date).toLocaleDateString("ro-RO")} la {selectedAppointment?.startTime}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{selectedAppointment?.doctor.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedAppointment?.department?.name || "—"}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Motiv Respingere</Label>
              <Select value={declineReason} onValueChange={setDeclineReason}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selectează un motiv..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Doctor Indisponibil">Doctor Indisponibil</SelectItem>
                  <SelectItem value="Serviciu Neacoperit">Serviciu Neacoperit în Clinică</SelectItem>
                  <SelectItem value="Date Incomplete">Date Incomplete Pacient</SelectItem>
                  <SelectItem value="Conflict Program">Conflict de Program</SelectItem>
                  <SelectItem value="Altul">Altul</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Mesaj către Pacient</Label>
              <Textarea
                placeholder={
                  declineReason === "Altul"
                    ? "Vă rugăm să descrieți motivul respingerii..."
                    : "Mesajul a fost completat automat în funcție de motiv selectat..."
                }
                value={declineMessage}
                onChange={(e) => setDeclineMessage(e.target.value)}
                rows={5}
                className={!declineMessage && declineReason ? "border-red-500 focus-visible:border-red-500" : ""}
              />
              {!declineMessage && declineReason && (
                <p className="text-xs text-red-500">Mesajul către pacient este obligatoriu</p>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="decline-notification"
                  checked={sendDeclineNotification}
                  onCheckedChange={(checked) => setSendDeclineNotification(checked as boolean)}
                />
                <Label
                  htmlFor="decline-notification"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Trimite explicația prin Email/SMS
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-2 ml-6">
                Pacientul va primi mesajul de mai sus prin metodele de comunicare preferate
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineModalOpen(false)} disabled={saving}>
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleFinalDecline} disabled={saving || !declineReason || !declineMessage}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se respinge...
                </>
              ) : (
                "Confirmă Respingerea"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reprogramează / Editează</DialogTitle>
            <DialogDescription>
              {editingAppointment?.patient.name} — {editingAppointment?.doctor.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Data</Label>
              <Input
                id="edit-date"
                type="date"
                value={editFormData.date}
                onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Ora</Label>
              <Select
                value={editFormData.startTime}
                onValueChange={(value) => setEditFormData({ ...editFormData, startTime: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează ora" />
                </SelectTrigger>
                <SelectContent>
                  {["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_ASTEPTARE">În așteptare</SelectItem>
                  <SelectItem value="CONFIRMAT">Confirmat</SelectItem>
                  <SelectItem value="IN_DESFASURARE">În desfășurare</SelectItem>
                  <SelectItem value="FINALIZAT">Finalizat</SelectItem>
                  <SelectItem value="ANULAT">Anulat</SelectItem>
                  <SelectItem value="NEPREZENTARE">Neprezentare</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Observații</Label>
              <Textarea
                id="edit-notes"
                placeholder="Note suplimentare..."
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={saving}>
              Anulează
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Se salvează...</>
              ) : (
                "Salvează"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
