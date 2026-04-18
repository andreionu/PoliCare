"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MoreHorizontal, Loader2, UserX, Users, Activity, FileText, CheckCircle, CalendarIcon, Phone, Mail, User, ArrowRight, UserPlus } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
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
  cnp: string | null
  age: number | null
  gender: string | null
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

const STATUS_LABELS: Record<string, string> = {
  NOU: "Nou",
  ACTIV: "Activ",
  PROGRAMAT: "Programat",
  INACTIV: "Inactiv",
}

const GENDER_LABELS: Record<string, string> = {
  MASCULIN: "Masculin",
  FEMININ: "Feminin",
  ALTUL: "Altul",
}

export default function PatientsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") ?? "")
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

  // Merge state
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [duplicatePatientId, setDuplicatePatientId] = useState<string | null>(null)
  const [mergingPatient, setMergingPatient] = useState(false)

  // Real patient data from API
  const [patients, setPatients] = useState<Patient[]>([])
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Stats calculation
  const totalPatients = patients.length
  const activePatients = patients.filter((p) => p.status === "ACTIV").length
  const scheduledPatients = patients.filter((p) => p.status === "PROGRAMAT").length
  const totalMedicalRecords = patients.reduce((sum, p) => sum + (p._count?.medicalRecords || 0), 0)

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") as "super-admin" | "front-desk" | null
    setRole(storedRole)
    fetchPatients()
  }, [])

  useEffect(() => {
    fetchPatients(debouncedSearch || undefined)
  }, [debouncedSearch])

  const handleAddPatient = async () => {
    // Basic validation
    if (!newPatient.name || !newPatient.phone) {
      toast({
        title: "Eroare",
        description: "Vă rugăm să completați câmpurile obligatorii (Nume, Telefon).",
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

      if (response.status === 409) {
        const errorData = await response.json()
        setDuplicatePatientId(errorData.existingPatientId)
        setShowMergeDialog(true)
        setSaving(false)
        return
      }

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

  const handleMerge = async () => {
    if (!duplicatePatientId) return
    setMergingPatient(true)

    try {
      // Create new patient first
      const createResponse = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPatient.name,
          // Omitem CNP-ul pentru a evita o nouă coliziune până la contopire
          cnp: null, 
          age: newPatient.age ? Number(newPatient.age) : null,
          gender: newPatient.gender,
          phone: newPatient.phone,
          email: newPatient.email || null,
          status: "NOU",
        }),
      })

      if (!createResponse.ok) throw new Error("Failed to create temp patient")
      const tempPatient = await createResponse.json()

      // Apelăm endpoint de merge: Sursa (id-ul duplicat existent) -> Target (id-ul pacientului nou creat)
      const mergeResponse = await fetch("/api/patients/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePatientId: duplicatePatientId,
          targetPatientId: tempPatient.id
        })
      })

      if (!mergeResponse.ok) throw new Error("Failed to merge patients")

      // Returnăm CNP-ul către pacientul target (în momentul acesta source e șters)
      await fetch(`/api/patients/${tempPatient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnp: newPatient.cnp })
      })

      await fetchPatients()
      setShowMergeDialog(false)
      setShowAddPatient(false)
      setNewPatient({ name: "", cnp: "", age: "", gender: "", email: "", phone: "" })
      
      toast({
        title: "Contopire Reușită",
        description: "Contul vechi a fost arhivat și datele transferate.",
      })
    } catch (error) {
      console.error("Error merging:", error)
      toast({
        title: "Eroare Contopire",
        description: "Nu s-a putut efectua contopirea conturilor.",
        variant: "destructive"
      })
    } finally {
      setMergingPatient(false)
    }
  }

  // Fetch patients from API
  const fetchPatients = async (search?: string) => {
    setLoading(true)
    try {
      const url = search ? `/api/patients?search=${encodeURIComponent(search)}` : "/api/patients"
      const response = await fetch(url)
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

  const getStatusDisplay = (status: string) => STATUS_LABELS[status] ?? status
  const getGenderDisplay = (gender: string) => GENDER_LABELS[gender] ?? gender

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
              <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">Pacienți</h1>
              <p className="text-muted-foreground text-lg italic">Monitorizarea fișelor și istoricului medical al pacienților.</p>
            </div>
            <Button className="gap-2 h-11 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all rounded-xl" onClick={() => setShowAddPatient(true)}>
              <Plus className="w-4 h-4" />
              Pacient Nou
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Pacienți</p>
                  <p className="text-3xl font-bold tracking-tight">{totalPatients}</p>
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pacienți Activi</p>
                  <p className="text-3xl font-bold tracking-tight">{activePatients}</p>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Dosare Medicale</p>
                  <p className="text-3xl font-bold tracking-tight">{totalMedicalRecords}</p>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Programați</p>
                  <p className="text-3xl font-bold tracking-tight">{scheduledPatients}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-white dark:bg-card/50 p-4 rounded-2xl shadow-sm border">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full xl:w-auto">
              <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-blue-500" />
                <Input
                  placeholder="Caută după nume, CNP sau ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-all"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto self-start xl:self-center">
              <div className="h-10 w-[1px] bg-border mx-2 hidden xl:block" />
              <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Afișare: <span className="text-foreground">{totalPatients} pacienți</span>
              </p>
            </div>
          </div>

          {/* Patients List */}
          <div className="grid gap-6">
            {loading ? (
              <div className="p-20 text-center bg-white dark:bg-card/50 rounded-2xl border border-border/50">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
                <p className="text-muted-foreground font-medium animate-pulse">Se încarcă baza de date a pacienților...</p>
              </div>
            ) : patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-card/50 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
                    <UserX className="w-10 h-10 text-primary/50" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white dark:bg-card border-2 border-background flex items-center justify-center shadow-sm">
                    <Search className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Niciun pacient găsit</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                  {searchQuery 
                    ? `Nu am găsit niciun pacient care să corespundă căutării "${searchQuery}".`
                    : "Nu există pacienți înregistrați în acest moment."}
                </p>
                <Button 
                  variant="outline" 
                  className="h-11 px-6 rounded-xl border-primary/20 text-primary hover:bg-primary/5 transition-all font-semibold"
                  onClick={() => setSearchQuery("")}
                >
                  Resetează căutarea
                </Button>
              </div>
            ) : (
              patients.map((patient) => (
                <Card key={patient.id} className="group relative bg-white dark:bg-card/50 rounded-2xl border border-border/50 p-6 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="relative h-16 w-16 border-2 border-background shadow-sm ring-2 ring-muted/50 group-hover:ring-primary/20 transition-all rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 text-primary font-bold text-xl">
                        {patient.name.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <Link href={`/patients/${patient.id}`} className="text-xl font-bold text-foreground tracking-tight hover:text-primary transition-colors uppercase leading-none block">{patient.name}</Link>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            {patient.cnp || "CNP Indisponibil"}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                            <CalendarIcon className="w-3 h-3" />
                            {patient.age ? `${patient.age} ani` : "Vârstă —"}
                          </span>
                          {patient.gender && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5 border-l border-border/50 pl-4 ml-0">
                               {getGenderDisplay(patient.gender)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 lg:gap-12">
                      <div className="flex flex-col gap-1 min-w-[140px]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                          <Plus className="w-3 h-3" />
                          Doctor Asignat
                        </span>
                        <span className="text-sm font-bold text-foreground/90 truncate uppercase tracking-tight">
                           {patient.primaryDoctor?.name || "Nealocat"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 min-w-[100px]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                          <Activity className="w-3 h-3" />
                          Status
                        </span>
                        <Badge
                          variant={patient.status === "ACTIV" ? "default" : "secondary"}
                          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider w-fit ${
                            patient.status === "ACTIV" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                              : patient.status === "PROGRAMAT"
                                ? "bg-blue-50 text-blue-700 border-blue-100"
                                : "bg-slate-50 text-slate-700 border-slate-100"
                          } border shadow-sm`}
                        >
                          {getStatusDisplay(patient.status)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-10 px-5 border-primary/10 text-primary font-bold hover:bg-primary/5 rounded-xl transition-all" 
                          asChild
                        >
                          <Link href={`/patients/${patient.id}`}>Fișă</Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground rounded-xl">
                              <MoreHorizontal className="h-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl p-2 w-48">
                            <DropdownMenuLabel className="text-xs uppercase font-bold text-muted-foreground px-2 pb-2">Acțiuni Pacient</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                              <Link href={`/patients/${patient.id}`} className="flex items-center">
                                <FileText className="mr-2 h-4 w-4" /> Vezi Fișa Medicală
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="rounded-lg cursor-pointer"
                              onClick={() => router.push(`/appointments?patientId=${patient.id}`)}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Programare Nouă
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive font-semibold rounded-lg cursor-pointer"
                              onClick={() => handleDeletePatient(patient.id)}
                            >
                              <UserX className="mr-2 h-4 w-4" /> Șterge Pacient
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
          <DialogHeader className="pb-4 border-b">

            <DialogTitle className="text-2xl font-bold tracking-tight">Adaugă Pacient Nou</DialogTitle>
            <DialogDescription className="text-muted-foreground">Înregistrează un nou pacient în baza de date a clinicii.</DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleAddPatient(); }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nume Complet *</Label>
                <Input
                  id="name"
                  required
                  placeholder="ex: Andrei Popescu"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                />
              </div>
            
             <div className="space-y-2">
              <Label htmlFor="cnp">CNP <span className="text-muted-foreground font-normal text-xs">(opțional, se completează la prezentare)</span></Label>
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
                <Label htmlFor="gender">Gen</Label>
                <select
                  id="gender"
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm outline-none focus-visible:ring-[3px] focus-visible:border-primary focus-visible:ring-primary/20 transition-all hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
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
                required
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

          <DialogFooter className="pt-6 border-t mt-6">
            <Button type="button" variant="ghost" onClick={() => setShowAddPatient(false)} disabled={saving} className="rounded-xl h-11 px-6 font-semibold text-muted-foreground hover:bg-accent">
              Anulează
            </Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl h-11 px-8 font-bold text-white">
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
        </form>
        </DialogContent>
      </Dialog>

      {/* Merge Conflict Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={(open) => {
        if (!open) setShowMergeDialog(false);
      }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader className="pb-4 border-b">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
               <Activity className="w-6 h-6 text-amber-500" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-amber-600">Pacient Existent (Conflict CNP)</DialogTitle>
            <DialogDescription className="text-foreground font-medium mt-2">
              Am detectat un alt cont cu același CNP în baza de date. 
              Aceasta indică, de obicei, că pacientul a mai fost aici, dar și-a schimbat numărul de telefon.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Doriți să contopiți datele în noul profil? Toate programările și istoricul medical vor fi transferate, iar vechiul profil va fi șters.
            </p>
          </div>

          <DialogFooter className="pt-6 border-t mt-6">
            <Button variant="ghost" onClick={() => setShowMergeDialog(false)} disabled={mergingPatient} className="rounded-xl h-11 px-6 font-semibold text-muted-foreground hover:bg-accent">
              Anulează Salvarea
            </Button>
            <Button onClick={handleMerge} disabled={mergingPatient} className="bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20 rounded-xl h-11 px-8 font-bold text-white transition-all">
               {mergingPatient ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se Contopește...
                </>
              ) : (
                "Contopește Profilurile"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
