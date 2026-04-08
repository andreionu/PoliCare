"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Edit,
  Plus,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Stethoscope,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface PatientDetail {
  id: string
  name: string
  cnp: string | null
  age: number | null
  gender: string | null
  phone: string
  email: string | null
  address: string | null
  status: string
  notes: string | null
  primaryDoctor: { id: string; name: string; specialty: string } | null
  appointments: Array<{
    id: string
    date: string
    startTime: string
    status: string
    type: string | null
    doctor: { id: string; name: string }
    department: { id: string; name: string } | null
  }>
  medicalRecords: Array<{
    id: string
    visitDate: string
    symptoms: string | null
    diagnosis: string | null
    treatment: string | null
    prescription: string | null
    notes: string | null
    followUpRequired: boolean
    followUpDate: string | null
  }>
  createdAt: string
}

const statusColors: Record<string, string> = {
  NOU: "bg-blue-100 text-blue-700",
  ACTIV: "bg-green-100 text-green-700",
  PROGRAMAT: "bg-yellow-100 text-yellow-700",
  INACTIV: "bg-gray-100 text-gray-600",
}

const statusLabels: Record<string, string> = {
  NOU: "Nou",
  ACTIV: "Activ",
  PROGRAMAT: "Programat",
  INACTIV: "Inactiv",
}

const aptStatusLabels: Record<string, string> = {
  IN_ASTEPTARE: "În așteptare",
  CONFIRMAT: "Confirmat",
  IN_DESFASURARE: "În desfășurare",
  FINALIZAT: "Finalizat",
  ANULAT: "Anulat",
  NEPREZENTARE: "Neprezentare",
}

const genderLabels: Record<string, string> = {
  MASCULIN: "Masculin",
  FEMININ: "Feminin",
  ALTUL: "Altul",
}

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const patientId = params.id as string

  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)

  // Edit patient modal
  const [showEditPatient, setShowEditPatient] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", cnp: "", gender: "", phone: "", email: "", address: "", status: "", notes: "" })
  const [savingPatient, setSavingPatient] = useState(false)

  // Add medical record modal
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [recordForm, setRecordForm] = useState({
    visitDate: new Date().toISOString().split("T")[0],
    symptoms: "",
    diagnosis: "",
    treatment: "",
    prescription: "",
    notes: "",
    followUpRequired: false,
    followUpDate: "",
  })
  const [savingRecord, setSavingRecord] = useState(false)

  const fetchPatient = useCallback(async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}`)
      if (!response.ok) throw new Error("Failed to fetch patient")
      const data = await response.json()
      setPatient(data)
    } catch (error) {
      console.error("Error fetching patient:", error)
      toast({ title: "Eroare", description: "Nu s-au putut încărca datele pacientului.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [patientId, toast])

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") as string | null
    setRole(storedRole)
    fetchPatient()
  }, [fetchPatient])

  const handleOpenEdit = () => {
    if (!patient) return
    setEditForm({
      name: patient.name,
      cnp: patient.cnp || "",
      gender: patient.gender || "",
      phone: patient.phone,
      email: patient.email || "",
      address: patient.address || "",
      status: patient.status,
      notes: patient.notes || "",
    })
    setShowEditPatient(true)
  }

  const handleSavePatient = async () => {
    if (!patient) return
    setSavingPatient(true)
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          cnp: editForm.cnp || null,
          gender: editForm.gender || null,
          phone: editForm.phone,
          email: editForm.email || null,
          address: editForm.address || null,
          status: editForm.status,
          notes: editForm.notes || null,
        }),
      })
      if (!response.ok) throw new Error("Failed to update patient")
      await fetchPatient()
      setShowEditPatient(false)
      toast({ title: "Succes", description: "Datele pacientului au fost actualizate." })
    } catch (error) {
      console.error("Error updating patient:", error)
      toast({ title: "Eroare", description: "Nu s-au putut salva modificările.", variant: "destructive" })
    } finally {
      setSavingPatient(false)
    }
  }

  const handleAddRecord = async () => {
    setSavingRecord(true)
    try {
      const response = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          visitDate: recordForm.visitDate,
          symptoms: recordForm.symptoms || null,
          diagnosis: recordForm.diagnosis || null,
          treatment: recordForm.treatment || null,
          prescription: recordForm.prescription || null,
          notes: recordForm.notes || null,
          followUpRequired: recordForm.followUpRequired,
          followUpDate: recordForm.followUpRequired && recordForm.followUpDate ? recordForm.followUpDate : null,
        }),
      })
      if (!response.ok) throw new Error("Failed to create medical record")
      await fetchPatient()
      setShowAddRecord(false)
      setRecordForm({
        visitDate: new Date().toISOString().split("T")[0],
        symptoms: "",
        diagnosis: "",
        treatment: "",
        prescription: "",
        notes: "",
        followUpRequired: false,
        followUpDate: "",
      })
      toast({ title: "Succes", description: "Fișa medicală a fost adăugată." })
    } catch (error) {
      console.error("Error creating medical record:", error)
      toast({ title: "Eroare", description: "Nu s-a putut adăuga fișa medicală.", variant: "destructive" })
    } finally {
      setSavingRecord(false)
    }
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

  if (!patient) {
    return (
      <AdminLayout userRole={role as "super-admin" | "front-desk" | null}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Pacientul nu a fost găsit.</p>
          <Button onClick={() => router.push("/patients")}>Înapoi la Pacienți</Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout userRole={role as "super-admin" | "front-desk" | null}>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push("/patients")}
                className="h-12 w-12 rounded-2xl bg-white shadow-sm border hover:bg-white hover:scale-105 transition-all"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                  <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-3xl shadow-xl ring-2 ring-white/20">
                    {patient.name.charAt(0)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-4xl font-extrabold text-foreground tracking-tight">{patient.name}</h1>
                    <Badge className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${statusColors[patient.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                      {statusLabels[patient.status] || patient.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground font-medium flex items-center gap-2">
                    <span className="text-blue-500/70 uppercase text-[10px] font-black tracking-widest">CNP:</span> 
                    <span className="font-mono tracking-tighter">{patient.cnp ?? "necompletat"}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleOpenEdit}
                className="h-11 px-6 rounded-xl border-blue-100 text-blue-700 font-bold hover:bg-blue-50 transition-all shadow-sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editează Profil
              </Button>
              <Button 
                onClick={() => setShowAddRecord(true)}
                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-xl font-bold transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adaugă Fișă
              </Button>
            </div>
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
              <div className="absolute top-0 right-10 w-32 h-32 -mr-8 -mt-8 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <Stethoscope className="w-7 h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Medic Principal</p>
                  <p className="text-sm font-extrabold tracking-tight text-foreground truncate">
                    {patient.primaryDoctor ? patient.primaryDoctor.name : "Neasignat"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Programări</p>
                  <p className="text-3xl font-black tracking-tighter tabular-nums">{patient.appointments.length}</p>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Dosar Medical</p>
                  <p className="text-3xl font-black tracking-tighter tabular-nums">{patient.medicalRecords.length}</p>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Gen / Vârstă</p>
                  <p className="text-xl font-black tracking-tight flex items-baseline gap-1">
                    {patient.age || "—"} <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{patient.gender?.slice(0, 3) || ""}</span>
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar Information */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-8 border-none shadow-sm bg-white dark:bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-80" />
                <h3 className="text-[10px] font-black font-mono uppercase tracking-[0.3em] text-blue-500 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Date Personale
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Gen & Vârstă</p>
                      <p className="text-sm font-bold text-foreground/90">{patient.gender ? (genderLabels[patient.gender] || patient.gender) : "Gen nespecificat"}{patient.age ? `, ${patient.age} ani` : ""}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Telefon</p>
                      <p className="text-sm font-bold text-foreground/90">{patient.phone}</p>
                    </div>
                  </div>

                  {patient.email && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Email</p>
                        <p className="text-sm font-bold text-foreground/90 break-all">{patient.email}</p>
                      </div>
                    </div>
                  )}

                  {patient.address && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Adresă</p>
                        <p className="text-sm font-bold text-foreground/90">{patient.address}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-muted/50">
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>Dată înregistrare</span>
                      <span className="font-bold text-foreground">{new Date(patient.createdAt).toLocaleDateString("ro-RO")}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Patient Notes */}
              <Card className="p-8 border-none shadow-sm bg-white dark:bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-60" />
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-black font-mono uppercase tracking-[0.3em] text-amber-600 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Note Dosar
                  </h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-amber-50 text-amber-600" onClick={handleOpenEdit}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-amber-50/10 p-4 rounded-xl border border-amber-100/50 min-h-[120px]">
                  {patient.notes ? (
                    <p className="text-sm italic text-muted-foreground whitespace-pre-wrap leading-relaxed">{patient.notes}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Nu există note speciale înregistrate pentru acest pacient.</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Main Content (History) */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="appointments" className="w-full">
                <TabsList className="bg-muted/10 p-1 rounded-2xl mb-6 backdrop-blur-sm border h-auto flex flex-wrap sm:flex-nowrap">
                  <TabsTrigger 
                    value="appointments" 
                    className="flex-1 py-3 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-bold text-sm transition-all"
                  >
                    Programări ({patient.appointments.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="records" 
                    className="flex-1 py-3 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-bold text-sm transition-all"
                  >
                    Fișe Medicale ({patient.medicalRecords.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="appointments" className="mt-0 space-y-4 outline-none">
                  {patient.appointments.length === 0 ? (
                    <Card className="p-16 text-center border-dashed border-2 bg-transparent rounded-2xl">
                      <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                      <h4 className="font-bold text-muted-foreground italic uppercase tracking-widest text-sm">Nicio Programare</h4>
                    </Card>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                      {patient.appointments.map((apt) => (
                        <Card key={apt.id} className="group p-5 border-none shadow-sm bg-white dark:bg-card/50 hover:shadow-lg transition-all duration-300 rounded-2xl">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-5">
                              <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
                                <p className="text-[10px] font-black uppercase tracking-tighter opacity-70">{new Date(apt.date).toLocaleDateString("ro-RO", { month: "short" })}</p>
                                <p className="text-2xl font-black tabular-nums tracking-tighter">{new Date(apt.date).getDate()}</p>
                              </div>
                              <div>
                                <h4 className="font-black text-foreground uppercase tracking-tight">{apt.doctor.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{apt.startTime}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{apt.department?.name || "General"}</span>
                                </div>
                              </div>
                            </div>
                            <Badge className={`h-8 px-4 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                              apt.status === "CONFIRMAT" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                              apt.status === "FINALIZAT" ? "bg-blue-50 text-blue-700 border-blue-100" :
                              apt.status === "ANULAT" ? "bg-rose-50 text-rose-700 border-rose-100" :
                              "bg-amber-50 text-amber-700 border-amber-100"
                            }`}>
                              {aptStatusLabels[apt.status] || apt.status}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="records" className="mt-0 space-y-4 outline-none">
                  {patient.medicalRecords.length === 0 ? (
                    <Card className="p-16 text-center border-dashed border-2 bg-transparent rounded-2xl">
                      <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                      <h4 className="font-bold text-muted-foreground italic uppercase tracking-widest text-sm">Nicio Fișă Medicală</h4>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      {patient.medicalRecords.map((record, idx) => (
                        <div key={record.id} className="relative pl-8 pb-4">
                          <div className="absolute left-0 top-[10px] w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center shadow-sm z-10">
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <Card className="p-8 border-none shadow-sm bg-white dark:bg-card/50 rounded-3xl group">
                            <div className="flex flex-col gap-6">
                              <div className="flex justify-between items-start">
                                <h4 className="text-xl font-black text-foreground uppercase tracking-tight">Consultatie</h4>
                                <Badge variant="outline" className="font-mono text-[10px]">{new Date(record.visitDate).toLocaleDateString("ro-RO")}</Badge>
                              </div>
                              <div className="grid md:grid-cols-2 gap-8">
                                {record.symptoms && (
                                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 italic">Simptome</p>
                                    <p className="text-sm font-medium italic">{record.symptoms}</p>
                                  </div>
                                )}
                                {record.diagnosis && (
                                  <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Diagnostic</p>
                                    <p className="text-sm font-black text-indigo-950/80">{record.diagnosis}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Patient Modal */}
      <Dialog open={showEditPatient} onOpenChange={setShowEditPatient}>
        <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
          <DialogHeader className="pb-4 border-b border-muted/50">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <Edit className="w-6 h-6 text-blue-600" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Editează Profil</DialogTitle>
            <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Actualizează datele oficiale pentru {patient.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6 font-medium">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 ml-1">Nume complet</Label>
              <Input 
                value={editForm.name} 
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                className="h-12 rounded-xl bg-muted/30 border-muted/50 focus:bg-white transition-all font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 ml-1">CNP</Label>
                <Input
                  placeholder="ex: 1900101..."
                  value={editForm.cnp}
                  onChange={(e) => setEditForm({ ...editForm, cnp: e.target.value })}
                  className="h-12 rounded-xl bg-muted/30 border-muted/50 focus:bg-white transition-all font-bold font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 ml-1">Gen</Label>
                <select
                  className="flex h-12 w-full rounded-xl border border-muted/50 bg-muted/30 px-3 py-2 text-sm focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all font-bold"
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                >
                  <option value="">Nespecificat</option>
                  <option value="MASCULIN">Masculin</option>
                  <option value="FEMININ">Feminin</option>
                  <option value="ALTUL">Altul</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 ml-1">Telefon / Contact</Label>
              <Input 
                value={editForm.phone} 
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} 
                className="h-12 rounded-xl bg-muted/30 border-muted/50 focus:bg-white transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 ml-1">Email Principal</Label>
              <Input 
                type="email" 
                value={editForm.email} 
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} 
                className="h-12 rounded-xl bg-muted/30 border-muted/50 focus:bg-white transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 ml-1">Status Pacient</Label>
              <select
                className="flex h-12 w-full rounded-xl border border-muted/50 bg-muted/30 px-3 py-2 text-sm focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all font-bold"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="NOU">Nou</option>
                <option value="ACTIV">Activ</option>
                <option value="PROGRAMAT">Programat</option>
                <option value="INACTIV">Inactiv</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-muted/50 flex gap-3">
            <Button variant="ghost" onClick={() => setShowEditPatient(false)} disabled={savingPatient} className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-xs">Anulează</Button>
            <Button onClick={handleSavePatient} disabled={savingPatient} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-xl font-bold uppercase tracking-widest text-xs">
              {savingPatient ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvare...</> : "Salvează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Medical Record Modal */}
      <Dialog open={showAddRecord} onOpenChange={setShowAddRecord}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] p-8 border-none shadow-2xl">
          <DialogHeader className="pb-6 border-b border-muted/50">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
              <Plus className="w-7 h-7 text-indigo-600" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tight uppercase">Adaugă Fișă Medicală</DialogTitle>
            <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Introduceți rezultatele consultației și recomandările clinice
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Data Vizitei</Label>
                <Input
                  type="date"
                  value={recordForm.visitDate}
                  onChange={(e) => setRecordForm({ ...recordForm, visitDate: e.target.value })}
                  className="h-12 rounded-xl bg-muted/20 border-muted/50 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Diagnostic Principal</Label>
                <Input
                  placeholder="ex: Rinita Alergica"
                  value={recordForm.diagnosis}
                  onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                  className="h-12 rounded-xl bg-muted/20 border-muted/50 font-black text-indigo-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Simptome Prezentate</Label>
              <Textarea
                placeholder="Descrie istoricul simptomelor..."
                value={recordForm.symptoms}
                onChange={(e) => setRecordForm({ ...recordForm, symptoms: e.target.value })}
                rows={3}
                className="resize-none rounded-2xl bg-muted/10 border-muted/50 p-4 focus:bg-white transition-all italic"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Tratament Recomandat</Label>
                <Textarea
                  placeholder="Schema de tratament..."
                  value={recordForm.treatment}
                  onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })}
                  rows={3}
                  className="resize-none rounded-2xl bg-muted/10 border-muted/50 p-4"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Prescripție Medicamente</Label>
                <Textarea
                  placeholder="Lista de medicamente..."
                  value={recordForm.prescription}
                  onChange={(e) => setRecordForm({ ...recordForm, prescription: e.target.value })}
                  rows={3}
                  className="resize-none rounded-2xl bg-emerald-50/20 border-emerald-100 p-4 font-bold text-emerald-800"
                />
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-blue-50/30 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-blue-800">Planificare Follow-up</p>
                  <p className="text-[10px] font-bold text-blue-600 italic">Necesită monitorizare ulterioară?</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="followUpRequired"
                    checked={recordForm.followUpRequired}
                    onChange={(e) => setRecordForm({ ...recordForm, followUpRequired: e.target.checked })}
                    className="h-5 w-5 rounded-lg border-blue-200 text-blue-600 accent-blue-600"
                  />
                  <Label htmlFor="followUpRequired" className="font-bold text-sm text-blue-800">Da, este necesar</Label>
                </div>
                {recordForm.followUpRequired && (
                  <Input
                    type="date"
                    value={recordForm.followUpDate}
                    onChange={(e) => setRecordForm({ ...recordForm, followUpDate: e.target.value })}
                    className="h-10 rounded-xl bg-white border-blue-200 w-36 font-bold text-xs"
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-8 border-t border-muted/50 flex gap-4">
            <Button variant="ghost" onClick={() => setShowAddRecord(false)} disabled={savingRecord} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs">Anulează</Button>
            <Button onClick={handleAddRecord} disabled={savingRecord} className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 rounded-2xl font-black uppercase tracking-[0.2em] text-xs">
              {savingRecord ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Salvare...</> : "Finalizează Fișa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
