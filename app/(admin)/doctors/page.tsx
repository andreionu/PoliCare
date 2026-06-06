"use client"

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
  Stethoscope,
  Star,
  Loader2,
  Plus,
  UserX,
  Activity,
  Award,
  Mail,
  Phone
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { Pagination } from "@/components/ui/pagination"
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
  gender: string | null
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
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
    gender: "",
  })
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // Fetch doctors from API
  const fetchDoctors = async (search?: string, currentPage = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(pageSize) })
      if (search) params.set("search", search)
      if (departmentIdFilter) params.set("departmentId", departmentIdFilter)
      const response = await fetch(`/api/doctors?${params}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const json = await response.json()
      const shuffled = [...json.data].sort(() => Math.random() - 0.5)
      setDoctors(shuffled)
      setTotalPages(json.totalPages)
      setTotalCount(json.total)
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
    setPage(1)
  }, [debouncedSearch, departmentIdFilter])

  useEffect(() => {
    fetchDoctors(debouncedSearch, page)
  }, [debouncedSearch, departmentIdFilter, page, pageSize])

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
        gender: "",
      })
      fetchDoctors(debouncedSearch, page)
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

  const formatName = (name: string) => name.replace(/^(Dr\.\s+)+/i, "Dr. ")

  const getInitials = (name: string) =>
    name.replace(/^Dr\.\s*/i, "").split(" ").filter(Boolean).map(n => n[0]).join("").substring(0, 2).toUpperCase()

  const getAvatarSrc = (doctor: Doctor) => {
    const generic = ["/male-doctor.png", "/female-doctor.png", "/placeholder.svg", ""]
    if (!doctor.avatar || generic.includes(doctor.avatar)) {
      const maleDoctors = [
        "https://images.unsplash.com/photo-1659353885824-1199aeeebfc6?w=200&h=200&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=200&h=200&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1631558555818-ff6889981468?w=200&h=200&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1666886573553-453e9cdbd967?w=200&h=200&fit=crop&auto=format",
        "https://images.pexels.com/photos/4021801/pexels-photo-4021801.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
        "https://images.pexels.com/photos/14438788/pexels-photo-14438788.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
      ]
      const femaleDoctors = [
        "https://images.unsplash.com/photo-1758691462848-ba1e929da259?w=200&h=200&fit=crop&auto=format",
        "https://images.pexels.com/photos/5327584/pexels-photo-5327584.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
        "https://images.pexels.com/photos/7088524/pexels-photo-7088524.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
        "https://images.pexels.com/photos/5452291/pexels-photo-5452291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
      ]
      const isFemale = doctor.gender === "FEMININ"
        || (!doctor.gender && /[ae]$/i.test(doctor.name.replace(/^Dr\.\s*/i, "").split(" ")[0] || ""))
      const pool = isFemale ? femaleDoctors : maleDoctors
      const hash = doctor.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
      return pool[hash % pool.length]
    }
    return doctor.avatar
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
    <>
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
              { label: "Total Medici", val: stats.total, icon: Stethoscope, color: "text-primary", bg: "bg-primary/5 dark:bg-primary/10", shadow: "shadow-primary/10" },
              { label: "Medici Activi", val: stats.active, icon: Activity, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15", shadow: "shadow-emerald-200 dark:shadow-none" },
              { label: "Rating Mediu", val: stats.avgRating, icon: Award, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/15", shadow: "shadow-amber-200 dark:shadow-none" },
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
                  className="group relative bg-white dark:bg-card/50 rounded-2xl border border-border/50 overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col"
                >
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border shadow-sm",
                      doctor.status === "ACTIV"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20"
                        : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20"
                    )}>
                      {getStatusDisplay(doctor.status)}
                    </Badge>
                  </div>

                  {/* Avatar — overlaps the header band */}
                  <div className="flex flex-col items-center text-center px-5 pt-5 pb-4">
                    <Avatar className="h-14 w-14 rounded-full ring-4 ring-white shadow-md mb-3">
                      <AvatarImage src={getAvatarSrc(doctor)} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                        {getInitials(doctor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-tight mb-1">{formatName(doctor.name)}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Stethoscope className="w-3 h-3 shrink-0" />
                      <p className="text-[11px] leading-tight">{doctor.specialty}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 text-center border-y border-border/40 flex-1">
                    <div className="py-3 px-2 border-r border-border/40">
                      <p className="text-sm font-bold text-foreground">{doctor._count?.patients || 0}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Pacienți</p>
                    </div>
                    <div className="py-3 px-2">
                      <div className="flex items-center justify-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <p className="text-sm font-bold text-foreground">{doctor.rating}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Rating</p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 p-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-8 rounded-lg text-xs font-semibold text-primary border-primary/15 hover:bg-primary/5 hover:border-primary/30"
                      asChild
                    >
                      <Link href={`/doctors/${doctor.id}`}>Profil</Link>
                    </Button>
                    <Button
                      className="flex-1 h-8 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20"
                      onClick={() => router.push(`/appointments?doctorId=${doctor.id}`)}
                    >
                      Calendar
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          <Pagination page={page} pageCount={totalPages} total={totalCount} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </main>

      <Dialog open={isAddDoctorOpen} onOpenChange={setIsAddDoctorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-none shadow-2xl p-0">
          <div className="p-8 space-y-8">
            <DialogHeader>

              <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">Adaugă Medic Nou</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                Înregistrează un nou specialist medical în baza de date **PoliCare**.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => { e.preventDefault(); handleAddDoctor(); }} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Nume Complet</Label>
                  <Input
                    required
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
                    required
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

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Gen</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-none px-4 font-medium">
                      <SelectValue placeholder="Selectează genul" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="MASCULIN" className="rounded-lg my-1 mx-1">Masculin</SelectItem>
                      <SelectItem value="FEMININ" className="rounded-lg my-1 mx-1">Feminin</SelectItem>
                      <SelectItem value="ALTUL" className="rounded-lg my-1 mx-1">Altul</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Specialitate</Label>
                  <Input
                    required
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
                      required
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
                      required
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

            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-6">
              <Button 
                type="button"
                variant="ghost" 
                onClick={() => setIsAddDoctorOpen(false)} 
                disabled={saving} 
                className="h-11 rounded-xl font-semibold text-muted-foreground hover:bg-accent px-6"
              >
                Anulează
              </Button>
              <Button 
                type="submit"
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
          </form>
        </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
