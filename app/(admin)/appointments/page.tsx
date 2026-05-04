"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  User,
  MoreHorizontal,
  ArrowRight,
  CalendarX,
  Pencil,
  UserX,
  ExternalLink,
  Play,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { useDebounce } from "@/hooks/use-debounce"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
  avatar: string | null
}

interface Department {
  id: string
  name: string
  color: string | null
}

interface Service {
  id: string
  name: string
  duration: number
  departmentId: string
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
  service?: Service | null
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
    case "CONFIRMAT": return "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30"
    case "IN_ASTEPTARE": return "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30"
    case "IN_DESFASURARE": return "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/30"
    case "ANULAT": return "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/30"
    case "FINALIZAT": return "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30"
    case "NEPREZENTARE": return "bg-slate-50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800/30"
    default: return "bg-slate-50 border-slate-100"
  }
}

const getStatusTextColor = (status: string) => {
  switch (status) {
    case "CONFIRMAT": return "text-emerald-700 dark:text-emerald-400"
    case "IN_ASTEPTARE": return "text-amber-700 dark:text-amber-400"
    case "IN_DESFASURARE": return "text-indigo-700 dark:text-indigo-400"
    case "ANULAT": return "text-rose-700 dark:text-rose-400"
    case "FINALIZAT": return "text-blue-700 dark:text-blue-400"
    case "NEPREZENTARE": return "text-slate-600 dark:text-slate-400"
    default: return "text-slate-600"
  }
}

const DAYS_OF_WEEK = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"]
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
  const router = useRouter()
  const prefillApplied = useRef(false)

  // View and UI state
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()))
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [declineModalOpen, setDeclineModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [editFormData, setEditFormData] = useState({ date: "", startTime: "", status: "", notes: "", serviceId: "" })
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
  const [services, setServices] = useState<Service[]>([])
  const [settings, setSettings] = useState<any>(null)

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
    serviceId: "",
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
      const [appointmentsRes, patientsRes, doctorsRes, departmentsRes, servicesRes, settingsRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/patients"),
        fetch("/api/doctors"),
        fetch("/api/departments"),
        fetch("/api/services"),
        fetch("/api/settings"),
      ])

      if (!appointmentsRes.ok || !patientsRes.ok || !doctorsRes.ok || !departmentsRes.ok || !servicesRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const [appointmentsData, patientsData, doctorsData, departmentsData, servicesData, settingsData] = await Promise.all([
        appointmentsRes.json(),
        patientsRes.json(),
        doctorsRes.json(),
        departmentsRes.json(),
        servicesRes.json(),
        settingsRes.json(),
      ])

      setAppointments(appointmentsData)
      setPatients(patientsData)
      setDoctors(doctorsData)
      setDepartments(departmentsData)
      setServices(servicesData)
      setSettings(settingsData)
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
      // Only auto-open if we came from a patient context, not doctor calendar
      setIsNewAppointmentOpen(true)
    } else if (doctorId) {
      setViewMode("calendar")
    }
  }, [loading, searchParams])

  // Real-time availability check when doctor + date + time are all filled (debounced 400ms)
  useEffect(() => {
    const { doctorId, date, time, serviceId } = appointmentFormData
    if (!doctorId || !date || !time) {
      setAvailabilityWarning(null)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      const duration = services.find(s => s.id === serviceId)?.duration || 30
      const [hours, minutes] = time.split(":").map(Number)
      const totalMinutes = hours * 60 + minutes + duration
      const endH = Math.floor(totalMinutes / 60)
      const endM = totalMinutes % 60
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
  }, [appointmentFormData.doctorId, appointmentFormData.date, appointmentFormData.time, appointmentFormData.serviceId, services])

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
      serviceId: appointment.service?.id || "",
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingAppointment) return

    setSaving(true)
    try {
      // Recalculate end time based on duration
      const duration = services.find(s => s.id === editFormData.serviceId)?.duration || editingAppointment.duration || 30
      const [hours, minutes] = editFormData.startTime.split(":").map(Number)
      const totalMinutes = hours * 60 + minutes + duration
      const endHours = Math.floor(totalMinutes / 60)
      const endMinutes = totalMinutes % 60
      const endTime = `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`

      const response = await fetch(`/api/appointments/${editingAppointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: editFormData.date,
          startTime: editFormData.startTime,
          endTime,
          duration,
          status: editFormData.status,
          notes: editFormData.notes || null,
          serviceId: editFormData.serviceId || null,
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
      serviceId: !appointmentFormData.serviceId,
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

      // Calculate end time
      const service = services.find(s => s.id === appointmentFormData.serviceId)
      const duration = service?.duration || 30
      const [hours, minutes] = appointmentFormData.time.split(":").map(Number)
      const totalMinutes = hours * 60 + minutes + duration
      const endHours = Math.floor(totalMinutes / 60)
      const endMinutes = totalMinutes % 60
      const endTime = `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: appointmentFormData.date,
          startTime: appointmentFormData.time,
          endTime: endTime,
          duration: duration,
          status: "IN_ASTEPTARE",
          type: service?.name || "CONSULTATIE",
          notes: appointmentFormData.notes || null,
          patientId: patientId,
          doctorId: appointmentFormData.doctorId,
          departmentId: appointmentFormData.departmentId,
          serviceId: appointmentFormData.serviceId,
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
        serviceId: "",
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
        const urlDoctorId = searchParams.get("doctorId")
        if (urlDoctorId && apt.doctorId !== urlDoctorId) return false

        const matchesSearch =
          apt.patient.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          apt.doctor.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        const matchesFilter = statusFilter === "Toate" || getStatusDisplay(apt.status) === statusFilter
        return matchesSearch && matchesFilter
      }),
    [appointments, debouncedSearchTerm, statusFilter, searchParams],
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

  const dynamicTimeSlots = useMemo(() => {
    if (!settings) return ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]
    const slots = []
    let curr = settings.workdayStart
    while (curr < settings.workdayEnd) {
      slots.push(curr)
      const [h, m] = curr.split(":").map(Number)
      const nextM = m + 60 // Admin view uses 1h slots by default
      const nextH = h + Math.floor(nextM / 60)
      curr = `${String(nextH).padStart(2, "0")}:${String(nextM % 60).padStart(2, "0")}`
    }
    return slots
  }, [settings])

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

  const handleEmptySlotClick = (dayIndex: number, timeStr: string) => {
    const date = new Date(currentWeekStart)
    date.setDate(currentWeekStart.getDate() + (dayIndex - 1))
    
    setAppointmentFormData(prev => ({
      ...prev,
      date: date.toISOString().split("T")[0],
      time: timeStr,
      doctorId: searchParams.get("doctorId") || prev.doctorId
    }))
    setIsNewAppointmentOpen(true)
  }

  return (
    <>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1600px] mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-xs font-semibold mb-4 border border-primary/10 uppercase tracking-wider">
                Management Portal
              </div>
              <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">Programări</h1>
              <p className="text-muted-foreground text-lg">Eficiență și organizare în gestionarea calendarului clinicii.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 h-11 px-5 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all rounded-xl" onClick={handleBulkReminders} disabled={sendingBulkReminders}>
                {sendingBulkReminders ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                Trimite Remindere
              </Button>
              <Button className="gap-2 h-11 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all rounded-xl" onClick={() => setIsNewAppointmentOpen(true)}>
                <Plus className="w-4 h-4" />
                Programare Nouă
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <CalendarIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Programări</p>
                  <p className="text-3xl font-bold tracking-tight">{appointments.length}</p>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Confirmate</p>
                  <p className="text-3xl font-bold tracking-tight">{stats.confirmed}</p>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">În Așteptare</p>
                  <p className="text-3xl font-bold tracking-tight">{stats.waiting}</p>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Loader2 className="w-7 h-7 text-white animate-[spin_3s_linear_infinite]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">În Desfășurare</p>
                  <p className="text-3xl font-bold tracking-tight">{stats.inProgress}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-white dark:bg-card/50 p-4 rounded-2xl shadow-sm border border-border/50">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full xl:w-auto">
              <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Caută pacient, medic sau procedură..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-all"
                />
              </div>

              <Select 
                value={searchParams.get("doctorId") || "all"} 
                onValueChange={(val) => {
                  const params = new URLSearchParams(searchParams.toString())
                  if (val === "all") params.delete("doctorId")
                  else params.set("doctorId", val)
                  router.push(`/appointments?${params.toString()}`)
                }}
              >
                <SelectTrigger className="w-full sm:w-[220px] h-12 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-medium data-[state=open]:ring-2 data-[state=open]:ring-primary">
                  <div className="flex items-center gap-2 truncate text-foreground">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Toți Medicii" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl max-h-[300px]">
                  <SelectItem value="all" className="font-semibold text-primary">Toți Medicii</SelectItem>
                  {doctors.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex p-1 bg-muted/50 rounded-xl items-center">
                {["Toate", "Confirmat", "În așteptare", "Anulat"].map((status) => (
                  <Button
                    key={status}
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className={`h-10 px-4 rounded-lg transition-all ${
                      statusFilter === status 
                        ? "bg-white dark:bg-card shadow-sm text-primary font-semibold" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto self-start xl:self-center">
              <div className="h-10 w-[1px] bg-border mx-2 hidden xl:block" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`flex-1 sm:flex-none gap-2 h-11 px-5 rounded-xl transition-all ${
                  viewMode === "list" 
                    ? "bg-primary/5 text-primary font-bold border border-primary/10" 
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <List className="w-5 h-5" />
                Listă
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("calendar")}
                className={`flex-1 sm:flex-none gap-2 h-11 px-5 rounded-xl transition-all ${
                  viewMode === "calendar" 
                    ? "bg-primary/5 text-primary font-bold border border-primary/10" 
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <CalendarDays className="w-5 h-5" />
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
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
                      <CalendarX className="w-10 h-10 text-primary/50" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white dark:bg-card border-2 border-background flex items-center justify-center shadow-sm">
                      <Search className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Nicio programare găsită</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                    Nu am găsit programări care să corespundă criteriilor de filtrare selectate. Încearcă să resetezi filtrele sau să cauți alt pacient.
                  </p>
                  <Button 
                    variant="outline" 
                    className="h-11 px-6 rounded-xl border-primary/20 text-primary hover:bg-primary/5 transition-all font-semibold"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("Toate");
                    }}
                  >
                    Resetează toate filtrele
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  <div className="grid grid-cols-1 gap-4">
                    {filteredAppointments.map((appointment) => (
                      <div key={appointment.id} className="group relative bg-white dark:bg-card/50 rounded-2xl border border-border/50 p-5 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                          {/* Patient info with Avatar */}
                          <div className="flex items-center gap-4 w-full lg:w-[320px] shrink-0">
                            <Avatar className="h-14 w-14 border-2 border-background shadow-sm ring-2 ring-muted/50">
                              <AvatarFallback className="bg-gradient-to-br from-primary/5 to-primary/10 text-primary font-bold text-lg">
                                {appointment.patient.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-foreground text-lg tracking-tight group-hover:text-primary transition-colors truncate max-w-[160px]">{appointment.patient.name}</span>
                                  <Badge variant={getStatusColor(appointment.status)} className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBgColor(appointment.status)} ${getStatusTextColor(appointment.status)} border-none shadow-sm shrink-0`}>
                                    {getStatusDisplay(appointment.status)}
                                  </Badge>
                                </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {appointment.type && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium uppercase tracking-tight">
                                    {appointment.type}
                                  </span>
                                )}
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                <span className="font-medium text-xs text-muted-foreground/70">#{appointment.id.substring(0,6)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Middle section: Doctor & Time */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 flex-1 gap-4 lg:gap-8 py-4 lg:py-0 border-y lg:border-none border-border/50">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                                <User className="w-3 h-3" />
                                Medic
                              </span>
                              <span className="text-sm font-semibold text-foreground/90">{appointment.doctor.name}</span>
                              <span className="text-xs text-muted-foreground">{appointment.department?.name || "General"}</span>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                                <CalendarIcon className="w-3 h-3" />
                                Dată
                              </span>
                              <span className="text-sm font-semibold text-foreground/90">{new Date(appointment.date).toLocaleDateString("ro-RO", { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                              <span className="text-xs text-muted-foreground">{new Date(appointment.date).getFullYear()}</span>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                Programare
                              </span>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-sm font-bold text-foreground">{appointment.startTime}</span>
                                <span className="text-[10px] font-medium text-muted-foreground">({appointment.duration} min)</span>
                              </div>
                              {/* Notification Indicators */}
                              {appointment.notifications && appointment.notifications.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  {appointment.notifications.find(n => n.type === "EMAIL") && (
                                    <div className={`p-1 rounded bg-muted/50 ${appointment.notifications.find(n => n.type === "EMAIL")?.status === "SENT" ? "text-green-600" : "text-red-500"}`} title="Email Status">
                                      <Mail className="w-3 h-3" />
                                    </div>
                                  )}
                                  {appointment.notifications.find(n => n.type === "SMS") && (
                                    <div className={`p-1 rounded bg-muted/50 ${appointment.notifications.find(n => n.type === "SMS")?.status === "SENT" ? "text-green-600" : "text-red-500"}`} title="SMS Status">
                                      <Phone className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 self-end lg:self-center w-full lg:w-[220px] shrink-0 justify-end">
                            {appointment.status === "IN_ASTEPTARE" && (
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-10 px-4 border-emerald-100 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl font-bold transition-all" 
                                  onClick={() => handleConfirmClick(appointment)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Confirmă
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-10 px-4 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/50 rounded-xl font-bold transition-all" 
                                  onClick={() => handleDeclineClick(appointment)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Respinge
                                </Button>
                              </div>
                            )}
                            
                            {appointment.status === "CONFIRMAT" && (
                              <div className="flex gap-2">
                                <Button 
                                  className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold shadow-md shadow-indigo-100 transition-all" 
                                  onClick={() => handleStartAppointment(appointment)} 
                                  disabled={saving}
                                >
                                  <ArrowRight className="w-4 h-4 mr-2" />
                                  Începe
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl border-primary/10 text-primary hover:bg-primary/5 transition-all"
                                  onClick={() => handleSendReminder(appointment)}
                                  disabled={sendingReminder === appointment.id}
                                  title="Trimite reminder"
                                >
                                  {sendingReminder === appointment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                                </Button>
                              </div>
                            )}

                            {appointment.status === "IN_DESFASURARE" && (
                              <Button 
                                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold shadow-md shadow-emerald-100 transition-all" 
                                onClick={() => handleFinishAppointment(appointment)} 
                                disabled={saving}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Finalizează
                              </Button>
                            )}

                            {!["FINALIZAT", "ANULAT", "NEPREZENTARE"].includes(appointment.status) && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl hover:bg-muted transition-all"
                                onClick={() => handleEditClick(appointment)}
                                title="Reprogramează"
                              >
                                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted transition-all">
                                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl border-none p-1.5">
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 px-2 pb-1">
                                  Acțiuni
                                </DropdownMenuLabel>

                                {/* View patient profile */}
                                <DropdownMenuItem
                                  className="rounded-lg cursor-pointer gap-2 font-medium"
                                  onClick={() => window.open(`/patients/${appointment.patient.id}`, "_blank")}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Profil Pacient
                                </DropdownMenuItem>

                                {/* Reschedule / Edit — always available if not terminal */}
                                {!["FINALIZAT", "ANULAT", "NEPREZENTARE"].includes(appointment.status) && (
                                  <DropdownMenuItem
                                    className="rounded-lg cursor-pointer gap-2 font-medium"
                                    onClick={() => handleEditClick(appointment)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                    Reprogramează
                                  </DropdownMenuItem>
                                )}

                                {/* IN_ASTEPTARE: Confirm + Decline */}
                                {appointment.status === "IN_ASTEPTARE" && (
                                  <>
                                    <DropdownMenuSeparator className="my-1" />
                                    <DropdownMenuItem
                                      className="rounded-lg cursor-pointer gap-2 font-medium text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50"
                                      onClick={() => handleConfirmClick(appointment)}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Confirmă
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="rounded-lg cursor-pointer gap-2 font-medium text-destructive focus:text-destructive focus:bg-destructive/10"
                                      onClick={() => handleDeclineClick(appointment)}
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Respinge
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="rounded-lg cursor-pointer gap-2 font-medium text-orange-600 focus:text-orange-600 focus:bg-orange-50"
                                      onClick={() => handleNoShow(appointment)}
                                      disabled={saving}
                                    >
                                      <UserX className="w-4 h-4" />
                                      Neprezentare
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {/* CONFIRMAT: Start + Reminder + No-show */}
                                {appointment.status === "CONFIRMAT" && (
                                  <>
                                    <DropdownMenuSeparator className="my-1" />
                                    <DropdownMenuItem
                                      className="rounded-lg cursor-pointer gap-2 font-medium text-indigo-700 focus:text-indigo-700 focus:bg-indigo-50"
                                      onClick={() => handleStartAppointment(appointment)}
                                      disabled={saving}
                                    >
                                      <Play className="w-4 h-4" />
                                      Începe Consultația
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="rounded-lg cursor-pointer gap-2 font-medium"
                                      onClick={() => handleSendReminder(appointment)}
                                      disabled={sendingReminder === appointment.id}
                                    >
                                      <Bell className="w-4 h-4" />
                                      Trimite Reminder
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="rounded-lg cursor-pointer gap-2 font-medium text-orange-600 focus:text-orange-600 focus:bg-orange-50"
                                      onClick={() => handleNoShow(appointment)}
                                      disabled={saving}
                                    >
                                      <UserX className="w-4 h-4" />
                                      Neprezentare
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {/* IN_DESFASURARE: Finish */}
                                {appointment.status === "IN_DESFASURARE" && (
                                  <>
                                    <DropdownMenuSeparator className="my-1" />
                                    <DropdownMenuItem
                                      className="rounded-lg cursor-pointer gap-2 font-medium text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50"
                                      onClick={() => handleFinishAppointment(appointment)}
                                      disabled={saving}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Finalizează
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {/* Terminal statuses: allow decline/cancel if not already */}
                                {appointment.status === "FINALIZAT" && (
                                  <>
                                    <DropdownMenuSeparator className="my-1" />
                                    <DropdownMenuItem
                                      className="rounded-lg cursor-pointer gap-2 font-medium"
                                      onClick={() => handleEditClick(appointment)}
                                    >
                                      <Pencil className="w-4 h-4" />
                                      Editează Note
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  {dynamicTimeSlots.map((time) => (
                    <div key={time} className="grid grid-cols-8 min-h-[80px]">
                      <div className="p-3 text-sm font-medium text-muted-foreground border-r flex items-start">
                        {time}
                      </div>
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                        const appointmentsInSlot = calendarIndex.get(`${day}-${time.split(":")[0]}`) ?? []
                        return (
                          <div 
                            key={day} 
                            className="relative border-r last:border-r-0 p-2 hover:bg-primary/5 transition-colors cursor-pointer group/cell min-h-[5rem]"
                            onClick={(e) => {
                              if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.empty-click-area')) {
                                handleEmptySlotClick(day, time)
                              }
                            }}
                          >
                            <div className="empty-click-area absolute inset-0 z-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none">
                              {appointmentsInSlot.length === 0 && <Plus className="w-6 h-6 text-primary/40" />}
                            </div>
                            <div className="relative z-10">
                              {appointmentsInSlot.map((apt) => (
                                <div
                                  key={apt.id}
                                  onClick={() => handleEditClick(apt)}
                                  className={`group/apt relative p-2.5 rounded-xl border-l-4 mb-2 cursor-pointer shadow-sm hover:shadow-md hover:translate-y-[-1px] transition-all duration-200 ${getStatusBgColor(apt.status)} border-background/20`}
                                  style={{ borderLeftColor: getStatusColor(apt.status) === 'default' ? 'var(--primary)' : getStatusColor(apt.status) === 'secondary' ? '#f59e0b' : '#10b981' }}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${getStatusTextColor(apt.status)}`}>
                                      {apt.startTime}
                                    </span>
                                    <div className="opacity-0 group-hover/apt:opacity-100 transition-opacity">
                                      <MoreHorizontal className={`w-3 h-3 ${getStatusTextColor(apt.status)}`} />
                                    </div>
                                  </div>
                                  <div className={`text-xs font-bold truncate ${getStatusTextColor(apt.status)}`}>
                                    {apt.patient.name}
                                  </div>
                                  <div className={`text-[10px] truncate opacity-80 font-medium ${getStatusTextColor(apt.status)} mt-0.5`}>
                                    {apt.doctor.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

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
          <DialogHeader className="pb-4 border-b">

            <DialogTitle className="text-2xl font-bold tracking-tight">Programare Nouă</DialogTitle>
            <DialogDescription className="text-muted-foreground">Completează detaliile pentru a rezerva un loc în calendar.</DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleAddAppointment(); }} className="space-y-6">
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
                    required={patientMode === "new"}
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
                      required={patientMode === "new"}
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
                      required={patientMode === "new"}
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
                      required={patientMode === "new"}
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
                required
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
              <Label htmlFor="service" className="block text-sm font-medium text-foreground">
                Serviciu <span className="text-destructive">*</span>
              </Label>
              <Select
                required
                value={appointmentFormData.serviceId}
                onValueChange={(value) => {
                  setAppointmentFormData({ ...appointmentFormData, serviceId: value })
                  setAppointmentErrors({ ...appointmentErrors, serviceId: false })
                }}
              >
                <SelectTrigger className={`mt-2 ${appointmentErrors.serviceId ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Selectează serviciul" />
                </SelectTrigger>
                <SelectContent>
                  {services
                    .filter((s) => !appointmentFormData.departmentId || s.departmentId === appointmentFormData.departmentId)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.duration} min)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {appointmentErrors.serviceId && (
                <p className="text-sm text-destructive mt-1">Serviciul este obligatoriu</p>
              )}
            </div>

            <div>
              <Label htmlFor="doctor" className="block text-sm font-medium text-foreground">
                Medic <span className="text-destructive">*</span>
              </Label>
              <Select
                required
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
                        <div className="flex items-center gap-3">
                          <Avatar className="h-6 w-6 rounded-lg">
                            <AvatarImage src={doc.avatar || ""} alt={doc.name} />
                            <AvatarFallback className="text-[10px] font-bold bg-muted">
                              {doc.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{doc.name}</span>
                        </div>
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
                  required
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
                  required
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
                    {["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
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

          <DialogFooter className="pt-6 border-t mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsNewAppointmentOpen(false)} disabled={saving} className="rounded-xl h-11 px-6 font-semibold text-muted-foreground hover:bg-accent">
              Anulează
            </Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl h-11 px-8 font-bold text-white transition-all">
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
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="pb-4 border-b">

            <DialogTitle className="text-2xl font-bold tracking-tight">Confirmă Programarea</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Verifică detaliile și trimite confirmarea către pacientul <span className="font-semibold text-foreground">{selectedAppointment?.patient.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <XCircle className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{selectedAppointment?.patient.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedAppointment?.date && new Date(selectedAppointment?.date).toLocaleDateString("ro-RO")} la {selectedAppointment?.startTime}
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

          <DialogFooter className="pt-6 border-t mt-6">
            <Button variant="ghost" onClick={() => setConfirmModalOpen(false)} disabled={saving} className="rounded-xl h-11 px-6 font-semibold text-muted-foreground hover:bg-accent">
              Anulează
            </Button>
            <Button onClick={handleFinalConfirm} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 rounded-xl h-11 px-8 font-bold text-white transition-all">
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
          <DialogHeader className="pb-4 border-b">

            <DialogTitle className="text-2xl font-bold tracking-tight text-rose-600">Respinge Programarea</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Această acțiune va anula programarea și va notifica pacientul <span className="font-semibold text-foreground">{selectedAppointment?.patient.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <XCircle className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{selectedAppointment?.patient.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedAppointment?.date && new Date(selectedAppointment?.date).toLocaleDateString("ro-RO")} la {selectedAppointment?.startTime}
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

          <DialogFooter className="pt-6 border-t mt-6">
            <Button variant="ghost" onClick={() => setDeclineModalOpen(false)} disabled={saving} className="rounded-xl h-11 px-6 font-semibold text-muted-foreground hover:bg-accent">
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleFinalDecline} disabled={saving || !declineReason || !declineMessage} className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-destructive/20 transition-all">
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
          <DialogHeader className="pb-4 border-b">

            <DialogTitle className="text-2xl font-bold tracking-tight">Reprogramează / Editează</DialogTitle>
            <DialogDescription className="text-muted-foreground italic">
              Actualizează detaliile programării pentru <span className="font-semibold text-foreground not-italic">{editingAppointment?.patient.name}</span>.
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
              <Label>Serviciu</Label>
              <Select
                value={editFormData.serviceId}
                onValueChange={(value) => setEditFormData({ ...editFormData, serviceId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează serviciul" />
                </SelectTrigger>
                <SelectContent>
                  {services
                    .filter(s => !editingAppointment?.department?.id || s.departmentId === editingAppointment.department.id)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.duration} min)</SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                  {["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"].map((t) => (
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

          <DialogFooter className="pt-6 border-t mt-6">
            <Button variant="ghost" onClick={() => setEditModalOpen(false)} disabled={saving} className="rounded-xl h-11 px-6 font-semibold text-muted-foreground hover:bg-accent">
              Anulează
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl h-11 px-8 font-bold text-white">
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Se salvează...</>
              ) : (
                "Salvează Modificările"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </main>
    </>
  )
}
