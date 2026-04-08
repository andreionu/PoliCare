"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  UserPlus, 
  Stethoscope, 
  Clock, 
  Users, 
  Star, 
  Loader2, 
  Plus, 
  UserX, 
  MoreHorizontal, 
  ArrowRight,
  TrendingUp,
  Activity,
  Award,
  ChevronRight,
  Mail,
  Phone
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Types
interface Doctor {
  id: string
  name: string
  email: string
  phone: string
  avatar: string | null
  specialty: string
  experience: string
  rating: number
  status: string
  bio: string | null
  department: {
    id: string
    name: string
  }
  _count: {
    appointments: number
    patients: number
  }
}

interface Department {
  id: string
  name: string
}

export default function DoctorsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const departmentIdFilter = searchParams.get("departmentId") ?? undefined

  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    email: "",
    phone: "",
    bio: "",
    experience: "",
    departmentId: "",
  })
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // Fetch doctors from API
  const fetchDoctors = async (search?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (departmentIdFilter) params.set("departmentId", departmentIdFilter)
      const response = await fetch(`/api/doctors${params.size ? `?${params}` : ""}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setDoctors(data)
    } catch (error) {
      console.error("Error fetching doctors:", error)
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca medicii.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setDepartments(data)
    } catch (error) {
      console.error("Error fetching departments:", error)
    }
  }

  useEffect(() => {
    fetchDoctors(debouncedSearch)
  }, [debouncedSearch, departmentIdFilter])

  useEffect(() => {
    fetchDepartments()
  }, [])

  const handleAddDoctor = async () => {
    const newErrors: Record<string, boolean> = {}
    if (!formData.name) newErrors.name = true
    if (!formData.specialty) newErrors.specialty = true
    if (!formData.email) newErrors.email = true
    if (!formData.phone) newErrors.phone = true
    if (!formData.departmentId) newErrors.departmentId = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to add")

      toast({
        title: "Succes",
        description: "Medicul a fost adăugat cu succes.",
      })
      setIsAddDoctorOpen(false)
      setFormData({
        name: "",
        specialty: "",
        email: "",
        phone: "",
        bio: "",
        experience: "",
        departmentId: "",
      })
      fetchDoctors()
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu s-a putut adăuga medicul.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "ACTIV": return "Activ"
      case "INACTIV": return "În repaus"
      case "CONCEDIU": return "Concediu"
      default: return status
    }
  }

  // Calculations for stats
  const stats = useMemo(() => {
    return {
      total: doctors.length,
      active: doctors.filter(d => d.status === "ACTIV").length,
      avgRating: doctors.length > 0 ? (doctors.reduce((acc, d) => acc + d.rating, 0) / doctors.length).toFixed(1) : "0.0"
    }
  }, [doctors])

  return (
    <AdminLayout>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-xs font-semibold mb-4 border border-primary/10 uppercase tracking-wider">
                Management Portal
              </div>
              <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">Medici</h1>
              <p className="text-muted-foreground text-lg italic">Gestiunea echipei de specialiști și a programului de consultații.</p>
            </div>
            <Button 
              className="gap-2 h-11 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all rounded-xl font-bold text-white" 
              onClick={() => setIsAddDoctorOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Medic Nou
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: "Total Medici", val: stats.total, icon: Stethoscope, color: "text-primary", bg: "bg-primary/5", shadow: "shadow-primary/10" },
              { label: "Sesiuni Active", val: stats.active, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50", shadow: "shadow-emerald-200" },
              { label: "Rating Mediu", val: stats.avgRating, icon: Award, color: "text-amber-600", bg: "bg-amber-50", shadow: "shadow-amber-200" },
            ].map((stat, i) => (
              <Card key={i} className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm rounded-2xl">
                <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity", stat.bg)} />
                <div className="flex items-center gap-4 relative z-10">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", stat.bg, stat.shadow)}>
                    <stat.icon className={cn("w-7 h-7", stat.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <p className={cn("text-3xl font-bold tracking-tight", stat.color)}>{loading ? "..." : stat.val}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-white dark:bg-card/50 p-4 rounded-2xl shadow-sm border border-border/50">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full xl:w-auto">
              <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Caută după nume sau specialitate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl transition-all font-medium"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto self-start xl:self-center">
              <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Afișare: <span className="text-foreground">{loading ? "..." : doctors.length} specialiști</span>
              </p>
            </div>
          </div>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm" />
              ))
            ) : doctors.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-card/50 rounded-2xl border border-border/50">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">
                  <UserX className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Niciun medic găsit</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                  {searchQuery 
                    ? `Nu am găsit niciun medic care să corespundă căutării "${searchQuery}".` 
                    : "Nu există medici înregistrați în acest moment."}
                </p>
                <Button 
                  variant="outline" 
                  className="h-11 px-6 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                  onClick={() => setSearchQuery("")}
                >
                  Resetează căutarea
                </Button>
              </div>
            ) : (
              doctors.map((doctor) => (
                <Card 
                  key={doctor.id} 
                  className="group relative bg-white dark:bg-card/50 rounded-2xl border border-border/50 p-6 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary to-primary/80 rounded-2xl blur-sm opacity-20 group-hover:opacity-40 transition-opacity" />
                      <Avatar className="h-16 w-16 rounded-2xl border-2 border-white shadow-sm relative z-10">
                        <AvatarImage src={doctor.avatar || "/placeholder.svg"} className="object-cover" />
                        <AvatarFallback className="bg-slate-100 text-primary font-bold text-lg uppercase">
                          {doctor.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <Badge className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border shadow-sm",
                      doctor.status === "ACTIV" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    )}>
                      {getStatusDisplay(doctor.status)}
                    </Badge>
                  </div>

                  <div className="space-y-4 flex-1">
                    <div>
                      <h3 className="font-bold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors leading-none uppercase mb-2">{doctor.name}</h3>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <Stethoscope className="w-3 h-3 text-primary" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{doctor.specialty}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100/60">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Pacienți</p>
                        <p className="text-lg font-bold text-foreground">{doctor._count?.patients || 0}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Experiență</p>
                        <p className="text-lg font-bold text-foreground">{doctor.experience}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-xl border border-amber-100">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-[11px] font-bold text-amber-700">{doctor.rating}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                           <Award className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 pt-6 border-t border-slate-100/60">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-widest text-[#206070] border-[#206070]/10 hover:bg-slate-50"
                      asChild
                    >
                      <Link href={`/doctors/${doctor.id}`}>Profil</Link>
                    </Button>
                    <Button
                      className="flex-1 h-10 bg-white text-slate-900 border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                      onClick={() => router.push(`/appointments?doctorId=${doctor.id}`)}
                    >
                      Calendar
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <Dialog open={isAddDoctorOpen} onOpenChange={setIsAddDoctorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-none shadow-2xl p-0">
          <div className="p-8 space-y-8">
            <DialogHeader>
              <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">Adaugă Medic Nou</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                Înregistrează un nou specialist medical în baza de date **PoliCare**.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Nume Complet</Label>
                  <Input
                    placeholder="Dr. Andrei Ionescu"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      setErrors({ ...errors, name: false })
                    }}
                    className={cn("h-12 rounded-xl bg-muted/50 border-none px-4 font-medium", errors.name && "ring-2 ring-rose-500")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Departament</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) => {
                      setFormData({ ...formData, departmentId: value })
                      setErrors({ ...errors, departmentId: false })
                    }}
                  >
                    <SelectTrigger className={cn("h-12 rounded-xl bg-muted/50 border-none px-4 font-medium", errors.departmentId && "ring-2 ring-rose-500")}>
                      <SelectValue placeholder="Selectează departamentul" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id} className="rounded-lg my-1 mx-1">
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Specialitate</Label>
                  <Input
                    placeholder="Cardiologie"
                    value={formData.specialty}
                    onChange={(e) => {
                      setFormData({ ...formData, specialty: e.target.value })
                      setErrors({ ...errors, specialty: false })
                    }}
                    className={cn("h-12 rounded-xl bg-muted/50 border-none px-4 font-medium", errors.specialty && "ring-2 ring-rose-500")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Experiență (ani)</Label>
                  <Input
                    placeholder="ex: 12"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="h-12 rounded-xl bg-muted/50 border-none px-4 font-medium"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Email Profesional</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <Input
                      type="email"
                      placeholder="andrei.i@policare.ro"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value })
                        setErrors({ ...errors, email: false })
                      }}
                      className={cn("h-12 rounded-xl bg-muted/50 border-none pl-12 pr-4 font-medium", errors.email && "ring-2 ring-rose-500")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Telefon</Label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <Input
                      type="tel"
                      placeholder="07XX XXX XXX"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value })
                        setErrors({ ...errors, phone: false })
                      }}
                      className={cn("h-12 rounded-xl bg-muted/50 border-none pl-12 pr-4 font-medium", errors.phone && "ring-2 ring-rose-500")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Biografie & Detalii</Label>
                <Textarea
                  placeholder="Descrie parcursul profesional și expertiza..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="resize-none rounded-xl bg-muted/50 border-none p-4 font-medium"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-6">
              <Button 
                variant="ghost" 
                onClick={() => setIsAddDoctorOpen(false)} 
                disabled={saving} 
                className="h-11 rounded-xl font-bold uppercase tracking-widest text-muted-foreground/60 hover:bg-slate-50 px-6"
              >
                Anulează
              </Button>
              <Button 
                onClick={handleAddDoctor} 
                disabled={saving || departments.length === 0} 
                className="h-11 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl font-bold text-sm tracking-wide transition-all translate-y-0 active:scale-95 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    SALVARE...
                  </>
                ) : (
                  <>
                    SALVEAZĂ PROFILUL
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
