"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
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
  Loader2,
  Phone,
  Mail,
  Star,
  Clock,
  Users,
  Calendar,
  AlertCircle,
  Save,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

  const [doctor, setDoctor] = useState<DoctorDetail | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)

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
    const storedRole = localStorage.getItem("userRole") as string | null
    setRole(storedRole)
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
      <AdminLayout userRole={role as "super-admin" | "front-desk" | null}>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    )
  }

  if (!doctor) {
    return (
      <AdminLayout userRole={role as "super-admin" | "front-desk" | null}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Medicul nu a fost găsit.</p>
          <Button onClick={() => router.push("/doctors")}>Înapoi la Medici</Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout userRole={role as "super-admin" | "front-desk" | null}>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/doctors")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                  {doctor.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{doctor.name}</h1>
                  <p className="text-muted-foreground text-sm">{doctor.specialty} — {doctor.department.name}</p>
                </div>
                <Badge className={`ml-2 ${doctorStatusColors[doctor.status] || ""} border-none`}>
                  {doctorStatusLabels[doctor.status] || doctor.status}
                </Badge>
              </div>
            </div>
            <Button variant="outline" onClick={handleOpenEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editează
            </Button>
          </div>

          {/* Info cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Contact & profil</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{doctor.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{doctor.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{doctor.experience} experiență</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{doctor.rating.toFixed(1)} / 5.0</span>
                </div>
                {doctor.bio && <p className="text-muted-foreground mt-2 leading-relaxed">{doctor.bio}</p>}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Statistici</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{doctorPatients.length} pacienți asignați</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{doctor.appointments.length} programări recente</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {schedules.filter((s) => s.isActive).length} zile active / săptămână
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="schedule">
            <TabsList>
              <TabsTrigger value="schedule">Program</TabsTrigger>
              <TabsTrigger value="patients">Pacienți ({doctorPatients.length})</TabsTrigger>
              <TabsTrigger value="appointments">Programări recente ({doctor.appointments.length})</TabsTrigger>
            </TabsList>

            {/* Schedule tab */}
            <TabsContent value="schedule" className="mt-4">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold">Program săptămânal</h3>
                  <Button onClick={handleSaveSchedule} disabled={savingSchedule}>
                    {savingSchedule ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Se salvează...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" />Salvează Program</>
                    )}
                  </Button>
                </div>
                <div className="space-y-3">
                  {schedules.map((s) => (
                    <div key={s.dayOfWeek} className="flex items-center gap-4">
                      <div className="w-28 text-sm font-medium">{DAY_NAMES[s.dayOfWeek]}</div>
                      <Switch
                        checked={s.isActive}
                        onCheckedChange={(checked) => updateScheduleDay(s.dayOfWeek, "isActive", checked)}
                      />
                      {s.isActive ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={s.startTime}
                            onChange={(e) => updateScheduleDay(s.dayOfWeek, "startTime", e.target.value)}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">—</span>
                          <Input
                            type="time"
                            value={s.endTime}
                            onChange={(e) => updateScheduleDay(s.dayOfWeek, "endTime", e.target.value)}
                            className="w-32"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Zi liberă</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Patients tab */}
            <TabsContent value="patients" className="mt-4">
              {doctorPatients.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Nu există pacienți asignați acestui medic.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {doctorPatients.map((patient) => (
                    <Card key={patient.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-sm text-muted-foreground">{patient.phone}</p>
                          </div>
                        </div>
                        <Badge
                          className={
                            patient.status === "ACTIV" ? "bg-green-100 text-green-700 border-none" :
                            patient.status === "PROGRAMAT" ? "bg-yellow-100 text-yellow-700 border-none" :
                            "bg-gray-100 text-gray-600 border-none"
                          }
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
            <TabsContent value="appointments" className="mt-4">
              {doctor.appointments.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Nu există programări recente.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {doctor.appointments.map((apt) => (
                    <Card key={apt.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <p className="text-lg font-bold">{new Date(apt.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}</p>
                            <p className="text-xs text-muted-foreground">{apt.startTime}</p>
                          </div>
                          <div>
                            <p className="font-medium">{apt.patient.name}</p>
                            <p className="text-sm text-muted-foreground">{apt.department?.name || "—"}</p>
                          </div>
                        </div>
                        <Badge
                          className={
                            apt.status === "CONFIRMAT" ? "bg-green-100 text-green-700 border-none" :
                            apt.status === "FINALIZAT" ? "bg-blue-100 text-blue-700 border-none" :
                            apt.status === "ANULAT" ? "bg-red-100 text-red-700 border-none" :
                            "bg-yellow-100 text-yellow-700 border-none"
                          }
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
    </AdminLayout>
  )
}
