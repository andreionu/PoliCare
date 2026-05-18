"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  Edit,
  KeyRound,
  Loader2,
  Phone,
  Mail,
  Star,
  Clock,
  Users,
  User,
  Calendar,
  AlertCircle,
  Save,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Schedule {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

interface DoctorDetail {
  id: string
  name: string
  email: string
  phone: string
  avatar: string | null
  gender: string | null
  specialty: string
  experience: string
  rating: number
  status: string
  bio: string | null
  department: { id: string; name: string }
  schedules: Schedule[]
  appointments: Array<{
    id: string
    date: string
    startTime: string
    status: string
    patient: { id: string; name: string }
    department: { id: string; name: string } | null
  }>
  hasAccount: boolean
}

interface Patient {
  id: string
  name: string
  phone: string
  status: string
  primaryDoctorId: string | null
}

const DAY_NAMES = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"]
const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 0] // Mon–Sun order

const doctorStatusLabels: Record<string, string> = {
  ACTIV: "Activ",
  IN_CONCEDIU: "În concediu",
  INDISPONIBIL: "Indisponibil",
}

const doctorStatusColors: Record<string, string> = {
  ACTIV: "bg-green-100 text-green-700",
  IN_CONCEDIU: "bg-yellow-100 text-yellow-700",
  INDISPONIBIL: "bg-red-100 text-red-700",
}

const MALE_DOCTOR_PHOTOS = [
  "https://images.unsplash.com/photo-1659353885824-1199aeeebfc6?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1631558555818-ff6889981468?w=200&h=200&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1666886573553-453e9cdbd967?w=200&h=200&fit=crop&auto=format",
  "https://images.pexels.com/photos/4021801/pexels-photo-4021801.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
  "https://images.pexels.com/photos/14438788/pexels-photo-14438788.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
]

const FEMALE_DOCTOR_PHOTOS = [
  "https://images.unsplash.com/photo-1758691462848-ba1e929da259?w=200&h=200&fit=crop&auto=format",
  "https://images.pexels.com/photos/5327584/pexels-photo-5327584.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
  "https://images.pexels.com/photos/7088524/pexels-photo-7088524.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
  "https://images.pexels.com/photos/5452291/pexels-photo-5452291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
]

function getAvatarSrc(doctor: DoctorDetail) {
  const generic = ["/male-doctor.png", "/female-doctor.png", "/placeholder.svg", ""]
  if (!doctor.avatar || generic.includes(doctor.avatar)) {
    const isFemale = doctor.gender === "FEMININ"
      || (!doctor.gender && /[ae]$/i.test(doctor.name.replace(/^Dr\.\s*/i, "").split(" ")[0] || ""))
    const pool = isFemale ? FEMALE_DOCTOR_PHOTOS : MALE_DOCTOR_PHOTOS
    const hash = doctor.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return pool[hash % pool.length]
  }
  return doctor.avatar
}

const aptStatusLabels: Record<string, string> = {
  IN_ASTEPTARE: "În așteptare",
  CONFIRMAT: "Confirmat",
  IN_DESFASURARE: "În desfășurare",
  FINALIZAT: "Finalizat",
  ANULAT: "Anulat",
  NEPREZENTARE: "Neprezentare",
}

export default function DoctorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const doctorId = params.id as string

  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"

  const [doctor, setDoctor] = useState<DoctorDetail | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  // Create account modal
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [accountForm, setAccountForm] = useState({ email: "", temporaryPassword: "" })
  const [creatingAccount, setCreatingAccount] = useState(false)


  // Schedule state (7 days)
  const defaultSchedules = WEEK_DAYS.map((day) => ({
    dayOfWeek: day,
    startTime: "08:00",
    endTime: "17:00",
    isActive: day !== 0 && day !== 6, // Mon–Fri active by default
  }))
  const [schedules, setSchedules] = useState(defaultSchedules)
  const [savingSchedule, setSavingSchedule] = useState(false)

  // Edit doctor modal
  const [showEditDoctor, setShowEditDoctor] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "", specialty: "", phone: "", email: "", bio: "", experience: "", status: "",
  })
  const [savingDoctor, setSavingDoctor] = useState(false)

  const fetchDoctor = useCallback(async () => {
    try {
      const [doctorRes, schedulesRes, allPatientsRes] = await Promise.all([
        fetch(`/api/doctors/${doctorId}`),
        fetch(`/api/doctors/${doctorId}/schedules`),
        fetch("/api/patients"),
      ])

      if (!doctorRes.ok) throw new Error("Failed to fetch doctor")

      const doctorData = await doctorRes.json()
      setDoctor(doctorData)

      if (schedulesRes.ok) {
        const schedulesData: Schedule[] = await schedulesRes.json()
        if (schedulesData.length > 0) {
          // Merge fetched schedules into our 7-day template
          setSchedules(
            WEEK_DAYS.map((day) => {
              const found = schedulesData.find((s) => s.dayOfWeek === day)
              return found
                ? { dayOfWeek: day, startTime: found.startTime, endTime: found.endTime, isActive: found.isActive }
                : { dayOfWeek: day, startTime: "08:00", endTime: "17:00", isActive: day !== 0 && day !== 6 }
            })
          )
        }
      }

      if (allPatientsRes.ok) {
        const patientsData = await allPatientsRes.json()
        setPatients(patientsData)
      }
    } catch (error) {
      console.error("Error fetching doctor:", error)
      toast({ title: "Eroare", description: "Nu s-au putut încărca datele medicului.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [doctorId, toast])

  useEffect(() => {
    fetchDoctor()
  }, [fetchDoctor])

  const doctorPatients = patients.filter((p) => p.primaryDoctorId === doctorId)

  const handleOpenEdit = () => {
    if (!doctor) return
    setEditForm({
      name: doctor.name,
      specialty: doctor.specialty,
      phone: doctor.phone,
      email: doctor.email,
      bio: doctor.bio || "",
      experience: doctor.experience,
      status: doctor.status,
    })
    setShowEditDoctor(true)
  }

  const handleSaveDoctor = async () => {
    if (!doctor) return
    setSavingDoctor(true)
    try {
      const response = await fetch(`/api/doctors/${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          specialty: editForm.specialty,
          phone: editForm.phone,
          email: editForm.email,
          bio: editForm.bio || null,
          experience: editForm.experience,
          status: editForm.status,
          departmentId: doctor.department.id,
        }),
      })
      if (!response.ok) throw new Error("Failed to update doctor")
      await fetchDoctor()
      setShowEditDoctor(false)
      toast({ title: "Succes", description: "Datele medicului au fost actualizate." })
    } catch (error) {
      console.error("Error updating doctor:", error)
      toast({ title: "Eroare", description: "Nu s-au putut salva modificările.", variant: "destructive" })
    } finally {
      setSavingDoctor(false)
    }
  }

  const handleOpenCreateAccount = () => {
    if (!doctor) return
    setAccountForm({ email: doctor.email, temporaryPassword: "" })
    setShowCreateAccount(true)
  }

  const handleCreateAccount = async () => {
    if (!accountForm.email || !accountForm.temporaryPassword) {
      toast({ title: "Eroare", description: "Completați toate câmpurile.", variant: "destructive" })
      return
    }
    setCreatingAccount(true)
    try {
      const response = await fetch(`/api/doctors/${doctorId}/account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountForm),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Eroare")
      await fetchDoctor()
      setShowCreateAccount(false)
      toast({
        title: "Cont creat",
        description: `Email: ${data.email} | Parola temporară: ${accountForm.temporaryPassword}`,
      })
    } catch (error: any) {
      toast({ title: "Eroare", description: error.message, variant: "destructive" })
    } finally {
      setCreatingAccount(false)
    }
  }

  const handleSaveSchedule = async () => {
    setSavingSchedule(true)
    try {
      const response = await fetch(`/api/doctors/${doctorId}/schedules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
      })
      if (!response.ok) throw new Error("Failed to save schedule")
      toast({ title: "Succes", description: "Programul a fost salvat." })
    } catch (error) {
      console.error("Error saving schedule:", error)
      toast({ title: "Eroare", description: "Nu s-a putut salva programul.", variant: "destructive" })
    } finally {
      setSavingSchedule(false)
    }
  }

  const updateScheduleDay = (dayOfWeek: number, field: string, value: string | boolean) => {
    setSchedules((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s))
    )
  }

  if (loading) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  if (!doctor) {
    return (
      <>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Medicul nu a fost găsit.</p>
          <Button onClick={() => router.push("/doctors")}>Înapoi la Medici</Button>
        </div>
      </>
    )
  }

  return (
    <>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-2">
            <div className="flex items-center gap-5">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Înapoi la medici"
                onClick={() => router.push("/doctors")}
                className="rounded-xl h-10 w-10 hover:bg-slate-100 shrink-0 border border-slate-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-5">
                <img
                  src={getAvatarSrc(doctor)}
                  alt={doctor.name}
                  className="h-20 w-20 rounded-2xl object-cover shadow-lg shadow-primary/20 ring-4 ring-white"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{doctor.name}</h1>
                    <Badge className={cn("px-2.5 py-0.5 rounded-full border-none font-bold text-[10px] uppercase tracking-wider", doctorStatusColors[doctor.status])}>
                      {doctorStatusLabels[doctor.status] || doctor.status}
                    </Badge>
                  </div>
                  <p className="text-slate-500 font-semibold flex items-center gap-2">
                    <span className="text-primary/70">{doctor.specialty}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span>{doctor.department.name}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isSuperAdmin && !doctor?.hasAccount && (
                <Button
                  variant="outline"
                  onClick={handleOpenCreateAccount}
                  className="rounded-xl h-11 px-6 font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-all flex-1 sm:flex-none"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Creare Cont
                </Button>
              )}
              {isSuperAdmin && doctor?.hasAccount && (
                <Badge className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-xl">
                  Cont activ
                </Badge>
              )}
              <Button
                variant="outline"
                onClick={handleOpenEdit}
                className="rounded-xl h-11 px-6 font-bold border-slate-200 hover:bg-slate-50 transition-all flex-1 sm:flex-none"
              >
                <Edit className="h-4 w-4 mr-2 text-primary" />
                Editează Profil
              </Button>
            </div>
          </div>

          {/* Info cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <User className="w-24 h-24 rotate-12" />
              </div>
              <div className="relative">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Contact & Profil
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-primary/20 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Telefon</p>
                      <p className="font-bold text-slate-900">{doctor.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-primary/20 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Email</p>
                      <p className="font-bold text-slate-900 truncate">{doctor.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-primary/20 transition-colors">
                      <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-amber-500 shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Experiență</p>
                        <p className="font-bold text-slate-900">{doctor.experience}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-primary/20 transition-colors">
                      <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-yellow-500 shrink-0">
                        <Star className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Rating</p>
                        <p className="font-bold text-slate-900">{doctor.rating.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                  {doctor.bio && (
                    <div className="mt-4 p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/50">
                      <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                        "{doctor.bio}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6 border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <Calendar className="w-24 h-24 -rotate-12" />
              </div>
              <div className="relative h-full flex flex-col">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Statistici Performanță
                </h3>
                <div className="space-y-4 flex-1">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-extrabold text-2xl text-slate-900 tracking-tight">{doctorPatients.length}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Pacienți Asignați</p>
                      </div>
                    </div>
                    <div className="h-1 w-24 bg-slate-200 rounded-full overflow-hidden">
                       <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min((doctorPatients.length / 50) * 100, 100)}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-extrabold text-2xl text-slate-900 tracking-tight">{doctor.appointments.length}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Programări Recente</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="rounded-lg bg-white border-slate-200 font-bold text-slate-600">
                      Total
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-extrabold text-2xl text-slate-900 tracking-tight">
                          {schedules.filter((s) => s.isActive).length}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Zile Active / Săptămână</p>
                      </div>
                    </div>
                    <div className="flex -space-x-1">
                      {WEEK_DAYS.map((day) => {
                        const sched = schedules.find(s => s.dayOfWeek === day);
                        return (
                          <div 
                            key={day} 
                            className={cn(
                              "h-2 w-2 rounded-full ring-2 ring-white",
                              sched?.isActive ? "bg-primary" : "bg-slate-200"
                            )}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="schedule" className="space-y-6">
            <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl h-14 border border-slate-200/60 w-full sm:w-auto">
              <TabsTrigger 
                value="schedule" 
                className="rounded-xl px-8 h-11 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md font-bold text-sm transition-all"
              >
                Program
              </TabsTrigger>
              <TabsTrigger 
                value="patients" 
                className="rounded-xl px-8 h-11 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md font-bold text-sm transition-all"
              >
                Pacienți <span className="ml-2 px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-500">{doctorPatients.length}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="appointments" 
                className="rounded-xl px-8 h-11 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md font-bold text-sm transition-all"
              >
                Programări <span className="ml-2 px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-500">{doctor.appointments.length}</span>
              </TabsTrigger>
            </TabsList>

            {/* Schedule tab */}
            <TabsContent value="schedule" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <Card className="p-8 border-slate-100 shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Program săptămânal</h3>
                    <p className="text-sm text-slate-500 font-medium">Configurează intervalele de lucru pentru fiecare zi.</p>
                  </div>
                  <Button 
                    onClick={handleSaveSchedule} 
                    disabled={savingSchedule}
                    className="rounded-xl h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-200 transition-all active:scale-95 group w-full sm:w-auto"
                  >
                    {savingSchedule ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvare...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />Salvează Program</>
                    )}
                  </Button>
                </div>

                <div className="grid gap-3">
                  {schedules.map((s) => (
                    <div 
                      key={s.dayOfWeek} 
                      className={cn(
                        "flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl transition-all duration-300 border",
                        s.isActive 
                          ? "bg-white border-slate-100 shadow-sm" 
                          : "bg-slate-50 border-transparent opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-4 w-full sm:w-32">
                        <Switch
                          checked={s.isActive}
                          onCheckedChange={(checked) => updateScheduleDay(s.dayOfWeek, "isActive", checked)}
                          className="data-[state=checked]:bg-primary"
                        />
                        <span className={cn(
                          "text-sm font-black uppercase tracking-wider",
                          s.isActive ? "text-slate-900" : "text-slate-400"
                        )}>
                          {DAY_NAMES[s.dayOfWeek]}
                        </span>
                      </div>

                      {s.isActive ? (
                        <div className="flex items-center gap-3 w-full sm:flex-1">
                          <div className="relative flex-1 sm:max-w-[160px]">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                              type="time"
                              value={s.startTime}
                              onChange={(e) => updateScheduleDay(s.dayOfWeek, "startTime", e.target.value)}
                              className="pl-9 h-11 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-primary/20 font-bold transition-all"
                            />
                          </div>
                          <span className="text-slate-300 font-black">/</span>
                          <div className="relative flex-1 sm:max-w-[160px]">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="time"
                              value={s.endTime}
                              onChange={(e) => updateScheduleDay(s.dayOfWeek, "endTime", e.target.value)}
                              className="pl-9 h-11 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-primary/20 font-bold transition-all"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <span className="text-sm font-bold text-slate-300 uppercase tracking-widest italic">Zi liberă / Indisponibil</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Patients tab */}
            <TabsContent value="patients" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              {doctorPatients.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2 bg-slate-50/50 rounded-[32px]">
                  <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Users className="h-8 w-8 text-slate-300" />
                  </div>
                  <h4 className="font-bold text-slate-900">Niciun pacient asignat</h4>
                  <p className="text-sm text-slate-500 mt-1">Acest medic nu are momentan pacienți în lista principală.</p>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {doctorPatients.map((patient) => (
                    <Card key={patient.id} className="p-5 border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all group rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg border border-indigo-100 group-hover:scale-110 transition-transform">
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 tracking-tight">{patient.name}</p>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">{patient.phone}</p>
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            "px-2.5 py-0.5 rounded-full border-none font-bold text-[10px] uppercase tracking-wider",
                            patient.status === "ACTIV" ? "bg-green-100 text-green-700" :
                            patient.status === "PROGRAMAT" ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                          )}
                        >
                          {patient.status === "NOU" ? "Nou" :
                           patient.status === "ACTIV" ? "Activ" :
                           patient.status === "PROGRAMAT" ? "Programat" : "Inactiv"}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Appointments tab */}
            <TabsContent value="appointments" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              {doctor.appointments.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2 bg-slate-50/50 rounded-[32px]">
                   <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Calendar className="h-8 w-8 text-slate-300" />
                  </div>
                  <h4 className="font-bold text-slate-900">Nicio programare recentă</h4>
                  <p className="text-sm text-slate-500 mt-1">Calendarul de activitate este gol pentru ultimele 30 de zile.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {doctor.appointments.map((apt) => (
                    <Card key={apt.id} className="p-5 border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all rounded-2xl">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                          <div className="text-center bg-slate-50 p-3 rounded-2xl min-w-[100px] border border-slate-100">
                            <p className="text-xl font-black text-slate-900 leading-none">{new Date(apt.date).getDate()}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-500 mt-1.5">{new Date(apt.date).toLocaleDateString("ro-RO", { month: "long" })}</p>
                            <div className="mt-2 h-0.5 w-4 bg-primary mx-auto rounded-full" />
                            <p className="text-xs font-black text-primary mt-2">{apt.startTime}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Pacient</p>
                            <p className="font-black text-lg text-slate-900 tracking-tight">{apt.patient.name}</p>
                            <p className="text-sm font-bold text-slate-500 mt-0.5">{apt.department?.name || "—"}</p>
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            "px-3 py-1 rounded-full border-none font-black text-[10px] uppercase tracking-wider",
                            apt.status === "CONFIRMAT" ? "bg-emerald-100 text-emerald-700" :
                            apt.status === "FINALIZAT" ? "bg-blue-100 text-blue-700" :
                            apt.status === "ANULAT" ? "bg-rose-100 text-rose-700" :
                            "bg-amber-100 text-amber-700"
                          )}
                        >
                          {aptStatusLabels[apt.status] || apt.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Edit Doctor Modal */}
      <Dialog open={showEditDoctor} onOpenChange={setShowEditDoctor}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editează Medic</DialogTitle>
            <DialogDescription>Actualizează datele pentru {doctor.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nume complet</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Specialitate</Label>
              <Input value={editForm.specialty} onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Experiență</Label>
              <Input placeholder="ex: 10 ani" value={editForm.experience} onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="ACTIV">Activ</option>
                <option value="IN_CONCEDIU">În concediu</option>
                <option value="INDISPONIBIL">Indisponibil</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                rows={3}
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDoctor(false)} disabled={savingDoctor}>Anulează</Button>
            <Button onClick={handleSaveDoctor} disabled={savingDoctor}>
              {savingDoctor ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Se salvează...</> : "Salvează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Account Modal */}
      <Dialog open={showCreateAccount} onOpenChange={setShowCreateAccount}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Creare Cont Medic</DialogTitle>
            <DialogDescription>Setați credențialele de autentificare pentru {doctor?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={accountForm.email}
                onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                placeholder="email@policare.ro"
              />
            </div>
            <div className="space-y-2">
              <Label>Parolă temporară</Label>
              <Input
                type="text"
                value={accountForm.temporaryPassword}
                onChange={(e) => setAccountForm({ ...accountForm, temporaryPassword: e.target.value })}
                placeholder="Minim 6 caractere"
              />
              <p className="text-xs text-muted-foreground">Comunicați această parolă medicului. El o va putea schimba după autentificare.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateAccount(false)} disabled={creatingAccount}>Anulează</Button>
            <Button onClick={handleCreateAccount} disabled={creatingAccount}>
              {creatingAccount ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Se creează...</> : "Creare Cont"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
