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

interface PatientDetail {
  id: string
  name: string
  cnp: string
  age: number | null
  gender: string
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
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", address: "", status: "", notes: "" })
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
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/patients")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                  {patient.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{patient.name}</h1>
                  <p className="text-muted-foreground text-sm">CNP: {patient.cnp}</p>
                </div>
                <Badge className={`ml-2 ${statusColors[patient.status] || ""} border-none`}>
                  {statusLabels[patient.status] || patient.status}
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
              <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Date personale</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{genderLabels[patient.gender] || patient.gender}{patient.age ? `, ${patient.age} ani` : ""}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{patient.phone}</span>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{patient.email}</span>
                  </div>
                )}
                {patient.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{patient.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>Înregistrat: {new Date(patient.createdAt).toLocaleDateString("ro-RO")}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Medic & statistici</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Stethoscope className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>
                    {patient.primaryDoctor
                      ? `${patient.primaryDoctor.name} — ${patient.primaryDoctor.specialty}`
                      : "Fără medic asignat"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{patient.appointments.length} programări totale</span>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{patient.medicalRecords.length} fișe medicale</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="appointments">
            <TabsList>
              <TabsTrigger value="appointments">Programări ({patient.appointments.length})</TabsTrigger>
              <TabsTrigger value="records">Fișe Medicale ({patient.medicalRecords.length})</TabsTrigger>
              <TabsTrigger value="notes">Note</TabsTrigger>
            </TabsList>

            {/* Appointments tab */}
            <TabsContent value="appointments" className="mt-4">
              {patient.appointments.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Nu există programări pentru acest pacient.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {patient.appointments.map((apt) => (
                    <Card key={apt.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <p className="text-lg font-bold">{new Date(apt.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}</p>
                            <p className="text-xs text-muted-foreground">{apt.startTime}</p>
                          </div>
                          <div>
                            <p className="font-medium">{apt.doctor.name}</p>
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

            {/* Medical Records tab */}
            <TabsContent value="records" className="mt-4">
              <div className="flex justify-end mb-3">
                <Button onClick={() => setShowAddRecord(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă Fișă
                </Button>
              </div>
              {patient.medicalRecords.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Nu există fișe medicale. Adaugă prima fișă!</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {patient.medicalRecords.map((record) => (
                    <Card key={record.id} className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{new Date(record.visitDate).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}</p>
                        </div>
                        {record.followUpRequired && (
                          <Badge className="bg-orange-100 text-orange-700 border-none">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Follow-up{record.followUpDate ? `: ${new Date(record.followUpDate).toLocaleDateString("ro-RO")}` : ""}
                          </Badge>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        {record.symptoms && (
                          <div>
                            <p className="text-muted-foreground font-medium mb-1">Simptome</p>
                            <p>{record.symptoms}</p>
                          </div>
                        )}
                        {record.diagnosis && (
                          <div>
                            <p className="text-muted-foreground font-medium mb-1">Diagnostic</p>
                            <p className="font-medium">{record.diagnosis}</p>
                          </div>
                        )}
                        {record.treatment && (
                          <div>
                            <p className="text-muted-foreground font-medium mb-1">Tratament</p>
                            <p>{record.treatment}</p>
                          </div>
                        )}
                        {record.prescription && (
                          <div>
                            <p className="text-muted-foreground font-medium mb-1">Prescripție</p>
                            <p>{record.prescription}</p>
                          </div>
                        )}
                        {record.notes && (
                          <div className="md:col-span-2">
                            <p className="text-muted-foreground font-medium mb-1">Note</p>
                            <p className="text-muted-foreground">{record.notes}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Notes tab */}
            <TabsContent value="notes" className="mt-4">
              <Card className="p-5">
                {patient.notes ? (
                  <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
                ) : (
                  <p className="text-muted-foreground text-sm">Nu există note pentru acest pacient.</p>
                )}
                <Button variant="outline" size="sm" className="mt-4" onClick={handleOpenEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editează notele
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Edit Patient Modal */}
      <Dialog open={showEditPatient} onOpenChange={setShowEditPatient}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editează Pacient</DialogTitle>
            <DialogDescription>Actualizează datele pacientului {patient.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nume complet</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
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
              <Label>Adresă</Label>
              <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="NOU">Nou</option>
                <option value="ACTIV">Activ</option>
                <option value="PROGRAMAT">Programat</option>
                <option value="INACTIV">Inactiv</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPatient(false)} disabled={savingPatient}>Anulează</Button>
            <Button onClick={handleSavePatient} disabled={savingPatient}>
              {savingPatient ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Se salvează...</> : "Salvează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Medical Record Modal */}
      <Dialog open={showAddRecord} onOpenChange={setShowAddRecord}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adaugă Fișă Medicală</DialogTitle>
            <DialogDescription>Completează datele consultației pentru {patient.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Data vizitei</Label>
              <Input
                type="date"
                value={recordForm.visitDate}
                onChange={(e) => setRecordForm({ ...recordForm, visitDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Simptome</Label>
              <Textarea
                placeholder="Descrie simptomele prezentate..."
                value={recordForm.symptoms}
                onChange={(e) => setRecordForm({ ...recordForm, symptoms: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Diagnostic</Label>
              <Textarea
                placeholder="Diagnosticul stabilit..."
                value={recordForm.diagnosis}
                onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Tratament</Label>
              <Textarea
                placeholder="Tratamentul recomandat..."
                value={recordForm.treatment}
                onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Prescripție</Label>
              <Textarea
                placeholder="Medicamente prescrise..."
                value={recordForm.prescription}
                onChange={(e) => setRecordForm({ ...recordForm, prescription: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Note suplimentare</Label>
              <Textarea
                placeholder="Orice alte informații relevante..."
                value={recordForm.notes}
                onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="followUpRequired"
                checked={recordForm.followUpRequired}
                onChange={(e) => setRecordForm({ ...recordForm, followUpRequired: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="followUpRequired">Necesită follow-up</Label>
            </div>
            {recordForm.followUpRequired && (
              <div className="space-y-2">
                <Label>Data follow-up</Label>
                <Input
                  type="date"
                  value={recordForm.followUpDate}
                  onChange={(e) => setRecordForm({ ...recordForm, followUpDate: e.target.value })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRecord(false)} disabled={savingRecord}>Anulează</Button>
            <Button onClick={handleAddRecord} disabled={savingRecord}>
              {savingRecord ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Se salvează...</> : "Salvează Fișa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
