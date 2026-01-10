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
import { Search, UserPlus, Stethoscope, Clock, Users, Star, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

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
  const [searchQuery, setSearchQuery] = useState("")
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
  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/doctors")
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

  // Fetch departments for the select dropdown
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
    fetchDoctors()
    fetchDepartments()
  }, [])

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Stats
  const totalDoctors = doctors.length
  const activeDoctors = doctors.filter((d) => d.status === "ACTIV").length
  const onLeaveDoctors = doctors.filter((d) => d.status === "IN_CONCEDIU").length
  const avgRating = doctors.length > 0
    ? (doctors.reduce((sum, d) => sum + d.rating, 0) / doctors.length).toFixed(1)
    : "0"

  const handleAddDoctor = async () => {
    const newErrors: Record<string, boolean> = {}
    if (!formData.name) newErrors.name = true
    if (!formData.specialty) newErrors.specialty = true
    if (!formData.email) newErrors.email = true
    if (!formData.phone) newErrors.phone = true
    if (!formData.departmentId) newErrors.departmentId = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast({
        title: "Eroare validare",
        description: "Te rugăm să completezi toate câmpurile obligatorii.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const response = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          specialty: formData.specialty,
          experience: formData.experience || "0 ani",
          bio: formData.bio || null,
          departmentId: formData.departmentId,
          status: "ACTIV",
        }),
      })

      if (!response.ok) throw new Error("Failed to create doctor")

      await fetchDoctors()

      toast({
        title: "Medic adăugat",
        description: `Dr. ${formData.name} a fost adăugat cu succes în sistem.`,
      })

      setIsAddDoctorOpen(false)
      setFormData({ name: "", specialty: "", email: "", phone: "", bio: "", experience: "", departmentId: "" })
      setErrors({})
    } catch (error) {
      console.error("Error creating doctor:", error)
      toast({
        title: "Eroare",
        description: "Nu s-a putut adăuga medicul.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Helper to format status for display
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      ACTIV: "Activ",
      IN_CONCEDIU: "În concediu",
      INDISPONIBIL: "Indisponibil",
    }
    return statusMap[status] || status
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1600px] mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-2">Medici</h1>
              <p className="text-muted-foreground">Gestionează medicii și specialitățile</p>
            </div>
            <Button className="gap-2" onClick={() => setIsAddDoctorOpen(true)}>
              <UserPlus className="w-4 h-4" />
              Adaugă Medic
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Medici</p>
                  <p className="text-2xl font-semibold">{totalDoctors}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Medici Activi</p>
                  <p className="text-2xl font-semibold">{activeDoctors}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating Mediu</p>
                  <p className="text-2xl font-semibold">{avgRating}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">În Concediu</p>
                  <p className="text-2xl font-semibold">{onLeaveDoctors}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Caută medic sau specialitate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <Card className="p-8 text-center col-span-full">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Se încarcă medicii...</p>
              </Card>
            ) : filteredDoctors.length === 0 ? (
              <Card className="p-8 text-center col-span-full">
                <p className="text-muted-foreground">
                  {searchQuery ? "Nu s-au găsit medici." : "Nu există medici. Adaugă primul medic!"}
                </p>
              </Card>
            ) : (
              filteredDoctors.map((doctor) => (
                <Card key={doctor.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={doctor.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {doctor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{doctor.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{doctor.specialty}</p>
                      <Badge variant={doctor.status === "ACTIV" ? "default" : "secondary"}>
                        {getStatusDisplay(doctor.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{doctor._count?.patients || 0} pacienți</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{doctor.experience} experiență</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{doctor.rating}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-3">{doctor.department?.name}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        Vezi Profil
                      </Button>
                      <Button size="sm" className="flex-1">
                        Programează
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <Dialog open={isAddDoctorOpen} onOpenChange={setIsAddDoctorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adaugă Medic Nou</DialogTitle>
            <DialogDescription>Completează informațiile medicului</DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="name">
                Nume complet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Dr. Ion Popescu"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  setErrors({ ...errors, name: false })
                }}
                className={`mt-2 ${errors.name ? "border-destructive" : ""}`}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">Numele este obligatoriu</p>}
            </div>

            {/* Department */}
            <div>
              <Label htmlFor="department">
                Departament <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => {
                  setFormData({ ...formData, departmentId: value })
                  setErrors({ ...errors, departmentId: false })
                }}
              >
                <SelectTrigger className={`mt-2 ${errors.departmentId ? "border-destructive" : ""}`}>
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
              {errors.departmentId && <p className="text-sm text-destructive mt-1">Departamentul este obligatoriu</p>}
              {departments.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Nu există departamente. Creează mai întâi un departament.
                </p>
              )}
            </div>

            {/* Specialty */}
            <div>
              <Label htmlFor="specialty">
                Specialitate <span className="text-destructive">*</span>
              </Label>
              <Input
                id="specialty"
                placeholder="ex: Cardiologie"
                value={formData.specialty}
                onChange={(e) => {
                  setFormData({ ...formData, specialty: e.target.value })
                  setErrors({ ...errors, specialty: false })
                }}
                className={`mt-2 ${errors.specialty ? "border-destructive" : ""}`}
              />
              {errors.specialty && <p className="text-sm text-destructive mt-1">Specialitatea este obligatorie</p>}
            </div>

            {/* Experience */}
            <div>
              <Label htmlFor="experience">Experiență</Label>
              <Input
                id="experience"
                placeholder="ex: 10 ani"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="mt-2"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@policare.ro"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  setErrors({ ...errors, email: false })
                }}
                className={`mt-2 ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && <p className="text-sm text-destructive mt-1">Email-ul este obligatoriu</p>}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">
                Telefon <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+40 721 234 567"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value })
                  setErrors({ ...errors, phone: false })
                }}
                className={`mt-2 ${errors.phone ? "border-destructive" : ""}`}
              />
              {errors.phone && <p className="text-sm text-destructive mt-1">Telefonul este obligatoriu</p>}
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio">Biografie</Label>
              <Textarea
                id="bio"
                placeholder="Experiență profesională, calificări, domenii de expertiză..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="resize-none mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDoctorOpen(false)} disabled={saving}>
              Anulează
            </Button>
            <Button onClick={handleAddDoctor} disabled={saving || departments.length === 0}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se salvează...
                </>
              ) : (
                "Adaugă Medic"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
