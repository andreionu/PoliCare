"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MoreHorizontal, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Type for patient from API
interface Patient {
  id: string
  name: string
  cnp: string
  age: number | null
  gender: string
  phone: string
  email: string | null
  status: string
  primaryDoctor: {
    id: string
    name: string
    specialty: string
  } | null
  createdAt: string
  _count: {
    appointments: number
    medicalRecords: number
  }
}

export default function PatientsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [role, setRole] = useState<"super-admin" | "front-desk" | null>(null)
  const [loading, setLoading] = useState(true)

  // Modal state
  const [showAddPatient, setShowAddPatient] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newPatient, setNewPatient] = useState({
    name: "",
    cnp: "",
    age: "",
    gender: "",
    email: "",
    phone: "",
  })

  // Real patient data from API
  const [patients, setPatients] = useState<Patient[]>([])

  // Fetch patients from API
  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setPatients(data)
    } catch (error) {
      console.error("Error fetching patients:", error)
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca pacienții.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Read role from local storage to pass to layout
    const storedRole = localStorage.getItem("userRole") as "super-admin" | "front-desk" | null
    setRole(storedRole)

    // Fetch patients from database
    fetchPatients()
  }, [])

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddPatient = async () => {
    // Basic validation
    if (!newPatient.name || !newPatient.cnp || !newPatient.phone || !newPatient.gender) {
      toast({
        title: "Eroare",
        description: "Vă rugăm să completați toate câmpurile obligatorii (Nume, CNP, Gen, Telefon).",
        variant: "destructive"
      })
      return
    }

    setSaving(true)

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPatient.name,
          cnp: newPatient.cnp,
          age: newPatient.age ? Number(newPatient.age) : null,
          gender: newPatient.gender,
          phone: newPatient.phone,
          email: newPatient.email || null,
          status: "NOU",
        }),
      })

      if (!response.ok) throw new Error("Failed to create patient")

      // Refresh the list
      await fetchPatients()

      setShowAddPatient(false)
      setNewPatient({
        name: "",
        cnp: "",
        age: "",
        gender: "",
        email: "",
        phone: "",
      })

      toast({
        title: "Succes",
        description: "Pacientul a fost adăugat cu succes.",
      })
    } catch (error) {
      console.error("Error creating patient:", error)
      toast({
        title: "Eroare",
        description: "Nu s-a putut adăuga pacientul.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Delete patient
  const handleDeletePatient = async (id: string) => {
    try {
      const response = await fetch(`/api/patients/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete patient")

      await fetchPatients()

      toast({
        title: "Succes",
        description: "Pacientul a fost șters.",
      })
    } catch (error) {
      console.error("Error deleting patient:", error)
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge pacientul.",
        variant: "destructive"
      })
    }
  }

  // Helper to format status for display
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      NOU: "Nou",
      ACTIV: "Activ",
      PROGRAMAT: "Programat",
      INACTIV: "Inactiv",
    }
    return statusMap[status] || status
  }

  // Helper to format gender for display
  const getGenderDisplay = (gender: string) => {
    const genderMap: Record<string, string> = {
      MASCULIN: "Masculin",
      FEMININ: "Feminin",
      ALTUL: "Altul",
    }
    return genderMap[gender] || gender
  }

  return (
    <AdminLayout userRole={role}>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Pacienți</h1>
              <p className="text-muted-foreground mt-1">Gestionează baza de date a pacienților</p>
            </div>
            <Button size="lg" onClick={() => setShowAddPatient(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Pacient Nou
            </Button>
          </div>

          {/* Filters and Search */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută după nume, CNP sau ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                 {/* Filters could go here */}
              </div>
            </div>
          </Card>

          {/* Patients List */}
          <div className="grid gap-4">
            {loading ? (
              <Card className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Se încarcă pacienții...</p>
              </Card>
            ) : filteredPatients.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? "Nu s-au găsit pacienți." : "Nu există pacienți. Adaugă primul pacient!"}
                </p>
              </Card>
            ) : (
              filteredPatients.map((patient) => (
                <Card key={patient.id} className="p-4 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg hover:underline cursor-pointer">{patient.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{patient.cnp}</span>
                          <span>•</span>
                          <span>{patient.age ? `${patient.age} ani` : "Vârstă nedefinită"}</span>
                          <span>•</span>
                          <span>{getGenderDisplay(patient.gender)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="hidden md:block text-right">
                        <p className="text-sm font-medium">Doctor asignat</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.primaryDoctor?.name || "Nealocat"}
                        </p>
                      </div>

                      <Badge
                        variant={patient.status === "ACTIV" ? "secondary" : "outline"}
                        className={patient.status === "PROGRAMAT" ? "bg-green-100 text-green-700 hover:bg-green-100 border-none" : ""}
                      >
                        {getStatusDisplay(patient.status)}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Vezi Fișa</DropdownMenuItem>
                          <DropdownMenuItem>Programare Nouă</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeletePatient(patient.id)}
                          >
                            Șterge
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Add Patient Modal */}
      <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adaugă Pacient Nou</DialogTitle>
            <DialogDescription>Introduceți datele personale ale noului pacient</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nume Complet *</Label>
              <Input
                id="name"
                placeholder="ex: Andrei Popescu"
                value={newPatient.name}
                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
              />
            </div>
            
             <div className="space-y-2">
              <Label htmlFor="cnp">CNP *</Label>
              <Input
                id="cnp"
                placeholder="ex: 1900101..."
                value={newPatient.cnp}
                onChange={(e) => setNewPatient({ ...newPatient, cnp: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Vârstă</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="ex: 35"
                  value={newPatient.age}
                  onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gen *</Label>
                <select
                  id="gender"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newPatient.gender}
                  onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                >
                  <option value="">Selectează</option>
                  <option value="MASCULIN">Masculin</option>
                  <option value="FEMININ">Feminin</option>
                  <option value="ALTUL">Altul</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon *</Label>
              <Input
                id="phone"
                placeholder="07xx xxx xxx"
                value={newPatient.phone}
                onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
              />
            </div>

             <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplu.com"
                value={newPatient.email}
                onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPatient(false)} disabled={saving}>
              Anulează
            </Button>
            <Button onClick={handleAddPatient} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se salvează...
                </>
              ) : (
                "Salvează Pacient"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
