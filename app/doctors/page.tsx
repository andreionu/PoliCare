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
import { Search, UserPlus, Stethoscope, Clock, Users, Star, Upload } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    email: "",
    phone: "",
    bio: "",
    photo: "",
  })
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const doctors = [
    {
      id: 1,
      name: "Dr. Ana Popescu",
      specialty: "Cardiologie",
      avatar: "/female-doctor.png",
      email: "ana.popescu@medicare.ro",
      phone: "+40 721 234 567",
      patients: 156,
      experience: "15 ani",
      rating: 4.9,
      status: "Activ",
      schedule: "Luni-Vineri, 9:00-17:00",
    },
    {
      id: 2,
      name: "Dr. Ion Marinescu",
      specialty: "ORL",
      avatar: "/male-doctor.png",
      email: "ion.marinescu@medicare.ro",
      phone: "+40 721 234 568",
      patients: 142,
      experience: "12 ani",
      rating: 4.8,
      status: "Activ",
      schedule: "Luni-Vineri, 10:00-18:00",
    },
    {
      id: 3,
      name: "Dr. Maria Ionescu",
      specialty: "Oftalmologie",
      avatar: "/female-doctor-2.jpg",
      email: "maria.ionescu@medicare.ro",
      phone: "+40 721 234 569",
      patients: 198,
      experience: "18 ani",
      rating: 4.9,
      status: "Activ",
      schedule: "Luni-Sâmbătă, 8:00-16:00",
    },
    {
      id: 4,
      name: "Dr. Andrei Popa",
      specialty: "Dermatologie",
      avatar: "/male-doctor-2.jpg",
      email: "andrei.popa@medicare.ro",
      phone: "+40 721 234 570",
      patients: 134,
      experience: "10 ani",
      rating: 4.7,
      status: "Activ",
      schedule: "Marți-Vineri, 11:00-19:00",
    },
    {
      id: 5,
      name: "Dr. Elena Dumitrescu",
      specialty: "Pediatrie",
      avatar: "/female-doctor-3.jpg",
      email: "elena.dumitrescu@medicare.ro",
      phone: "+40 721 234 571",
      patients: 210,
      experience: "20 ani",
      rating: 5.0,
      status: "Activ",
      schedule: "Luni-Vineri, 9:00-17:00",
    },
    {
      id: 6,
      name: "Dr. Cristian Radu",
      specialty: "Cardiologie",
      avatar: "/male-doctor-3.jpg",
      email: "cristian.radu@medicare.ro",
      phone: "+40 721 234 572",
      patients: 89,
      experience: "8 ani",
      rating: 4.6,
      status: "În concediu",
      schedule: "Luni-Vineri, 10:00-18:00",
    },
  ]

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddDoctor = () => {
    const newErrors: Record<string, boolean> = {}
    if (!formData.name) newErrors.name = true
    if (!formData.specialty) newErrors.specialty = true
    if (!formData.email) newErrors.email = true
    if (!formData.phone) newErrors.phone = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast({
        title: "Eroare validare",
        description: "Te rugăm să completezi toate câmpurile obligatorii.",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] New doctor data:", formData)

    toast({
      title: "Medic adăugat",
      description: `Dr. ${formData.name} a fost adăugat cu succes în sistem.`,
    })

    setIsAddDoctorOpen(false)
    setFormData({ name: "", specialty: "", email: "", phone: "", bio: "", photo: "" })
    setErrors({})
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
                  <p className="text-2xl font-semibold">{doctors.length}</p>
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
                  <p className="text-2xl font-semibold">{doctors.filter((d) => d.status === "Activ").length}</p>
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
                  <p className="text-2xl font-semibold">4.8</p>
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
                  <p className="text-2xl font-semibold">{doctors.filter((d) => d.status === "În concediu").length}</p>
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
            {filteredDoctors.map((doctor) => (
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
                    <Badge variant={doctor.status === "Activ" ? "default" : "secondary"}>{doctor.status}</Badge>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{doctor.patients} pacienți</span>
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
                  <p className="text-xs text-muted-foreground mb-3">{doctor.schedule}</p>
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
            ))}
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
            {/* Photo Upload */}
            <div>
              <Label>Fotografie profil</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  {formData.photo ? (
                    <img
                      src={formData.photo || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <UserPlus className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Upload className="w-4 h-4" />
                  Încarcă fotografie
                </Button>
              </div>
            </div>

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

            {/* Specialty */}
            <div>
              <Label htmlFor="specialty">
                Specialitate <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.specialty}
                onValueChange={(value) => {
                  setFormData({ ...formData, specialty: value })
                  setErrors({ ...errors, specialty: false })
                }}
              >
                <SelectTrigger className={`mt-2 ${errors.specialty ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Selectează specialitatea" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cardiologie">Cardiologie</SelectItem>
                  <SelectItem value="Dermatologie">Dermatologie</SelectItem>
                  <SelectItem value="ORL">ORL</SelectItem>
                  <SelectItem value="Oftalmologie">Oftalmologie</SelectItem>
                  <SelectItem value="Pediatrie">Pediatrie</SelectItem>
                  <SelectItem value="Ginecologie">Ginecologie</SelectItem>
                  <SelectItem value="Orthopedie">Orthopedie</SelectItem>
                  <SelectItem value="Neurologie">Neurologie</SelectItem>
                </SelectContent>
              </Select>
              {errors.specialty && <p className="text-sm text-destructive mt-1">Specialitatea este obligatorie</p>}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@medicare.ro"
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
            <Button variant="outline" onClick={() => setIsAddDoctorOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleAddDoctor}>Adaugă Medic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
