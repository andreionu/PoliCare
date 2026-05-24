"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  ArrowLeft, Loader2, User, Phone, Mail, Calendar, FileText, Plus,
  Upload, Download, Trash2, File, ImageIcon,
} from "lucide-react"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

const statusColors: Record<string, string> = {
  IN_ASTEPTARE: "bg-amber-100 text-amber-700",
  CONFIRMAT: "bg-blue-100 text-blue-700",
  IN_DESFASURARE: "bg-purple-100 text-purple-700",
  FINALIZAT: "bg-green-100 text-green-700",
  ANULAT: "bg-red-100 text-red-700",
  NEPREZENTARE: "bg-gray-100 text-gray-700",
}

const statusLabels: Record<string, string> = {
  IN_ASTEPTARE: "În așteptare",
  CONFIRMAT: "Confirmat",
  IN_DESFASURARE: "În desfășurare",
  FINALIZAT: "Finalizat",
  ANULAT: "Anulat",
  NEPREZENTARE: "Neprezentare",
}

const emptyRecord = {
  symptoms: "",
  diagnosis: "",
  treatment: "",
  prescription: "",
  notes: "",
  followUpRequired: false,
  followUpDate: "",
}

export default function DoctorPatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const patientId = params.id as string

  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [recordForm, setRecordForm] = useState(emptyRecord)
  const [savingRecord, setSavingRecord] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch(`/api/patients/${patientId}`)
      .then(async (r) => {
        if (r.status === 403) throw new Error("Nu aveți acces la datele acestui pacient.")
        if (!r.ok) throw new Error("Eroare la încărcare")
        return r.json()
      })
      .then(setPatient)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [patientId])

  const handleSaveRecord = async () => {
    setSavingRecord(true)
    try {
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          symptoms: recordForm.symptoms || null,
          diagnosis: recordForm.diagnosis || null,
          treatment: recordForm.treatment || null,
          prescription: recordForm.prescription || null,
          notes: recordForm.notes || null,
          followUpRequired: recordForm.followUpRequired,
          followUpDate: recordForm.followUpDate || null,
        }),
      })
      if (!res.ok) throw new Error()
      const newRecord = await res.json()
      setPatient((prev: any) => ({
        ...prev,
        medicalRecords: [newRecord, ...(prev.medicalRecords ?? [])],
      }))
      setShowRecordModal(false)
      setRecordForm(emptyRecord)
      toast({ title: "Fișă medicală adăugată" })
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut salva fișa medicală.", variant: "destructive" })
    } finally {
      setSavingRecord(false)
    }
  }

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("patientId", patientId)
      const res = await fetch("/api/documents", { method: "POST", body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Eroare la încărcare")
      }
      const newDoc = await res.json()
      setPatient((prev: any) => ({ ...prev, documents: [newDoc, ...(prev.documents ?? [])] }))
      toast({ title: "Document încărcat cu succes" })
    } catch (err: any) {
      toast({ title: "Eroare", description: err.message, variant: "destructive" })
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" })
    if (res.ok) {
      setPatient((prev: any) => ({ ...prev, documents: prev.documents.filter((d: any) => d.id !== docId) }))
      toast({ title: "Document șters" })
    } else {
      toast({ title: "Eroare la ștergere", variant: "destructive" })
    }
  }

  const handleDownloadDocument = async (docId: string, name: string) => {
    const res = await fetch(`/api/documents/${docId}/url`)
    if (!res.ok) { toast({ title: "Eroare la descărcare", variant: "destructive" }); return }
    const { url } = await res.json()
    const a = document.createElement("a")
    a.href = url; a.target = "_blank"; a.download = name; a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <main className="flex-1 p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Înapoi
        </Button>
        <Card className="p-8 text-center rounded-2xl">
          <p className="text-destructive font-bold">{error}</p>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="rounded-xl">
        <ArrowLeft className="h-4 w-4 mr-2" /> Înapoi
      </Button>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
          <User className="h-8 w-8 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black">{patient.name}</h1>
          <p className="text-muted-foreground text-sm">{patient.status}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-4 rounded-2xl border-slate-100">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{patient.phone ?? "—"}</span>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border-slate-100">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{patient.email ?? "—"}</span>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="appointments">
        <TabsList className="rounded-xl">
          <TabsTrigger value="appointments">Programări ({patient.appointments?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="records">Fișe Medicale ({patient.medicalRecords?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="documents">Documente ({patient.documents?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="mt-4">
          <Card className="rounded-2xl border-slate-100 overflow-hidden">
            {!patient.appointments?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                <Calendar className="h-8 w-8 opacity-30" />
                <p className="text-sm font-semibold">Nicio programare</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {patient.appointments.map((appt: any) => (
                  <div key={appt.id} className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">
                        {format(new Date(appt.date), "d MMMM yyyy", { locale: ro })} · {appt.startTime}
                      </p>
                      <p className="text-xs text-muted-foreground">{appt.department?.name}</p>
                    </div>
                    <Badge className={statusColors[appt.status] ?? "bg-gray-100 text-gray-700"}>
                      {statusLabels[appt.status] ?? appt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button
              onClick={() => setShowRecordModal(true)}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Adaugă Fișă Medicală
            </Button>
          </div>
          <Card className="rounded-2xl border-slate-100 overflow-hidden">
            {!patient.medicalRecords?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                <FileText className="h-8 w-8 opacity-30" />
                <p className="text-sm font-semibold">Nicio fișă medicală</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {patient.medicalRecords.map((rec: any) => (
                  <div key={rec.id} className="p-4 space-y-2">
                    <p className="text-sm font-bold">
                      {format(new Date(rec.visitDate), "d MMMM yyyy", { locale: ro })}
                    </p>
                    {rec.symptoms && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Simptome:</span> {rec.symptoms}
                      </p>
                    )}
                    {rec.diagnosis && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Diagnostic:</span> {rec.diagnosis}
                      </p>
                    )}
                    {rec.treatment && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Tratament:</span> {rec.treatment}
                      </p>
                    )}
                    {rec.prescription && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Rețetă:</span> {rec.prescription}
                      </p>
                    )}
                    {rec.notes && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Note:</span> {rec.notes}
                      </p>
                    )}
                    {rec.followUpRequired && rec.followUpDate && (
                      <p className="text-xs text-amber-600 font-semibold">
                        Control: {format(new Date(rec.followUpDate), "d MMMM yyyy", { locale: ro })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4 space-y-4">
          <Card className="p-6 border-none shadow-sm bg-white dark:bg-card/50 rounded-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg">Atașamente Medicale</h3>
                <p className="text-sm text-muted-foreground">Încărcați rezultate analize, imagistică sau alte documente (PDF, JPG, PNG, max 10MB)</p>
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleUploadDocument}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <Button disabled={uploading} className="gap-2 px-6 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Se încarcă..." : "Încarcă Document"}
                </Button>
              </div>
            </div>
          </Card>

          {!patient.documents?.length ? (
            <Card className="p-16 text-center border-dashed border-2 bg-transparent rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <File className="h-8 w-8 text-indigo-300" />
              </div>
              <h4 className="font-bold text-muted-foreground italic uppercase tracking-widest text-sm">Niciun document atașat</h4>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patient.documents.map((doc: any) => (
                <Card key={doc.id} className="p-4 border shadow-sm bg-white rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${doc.type.includes("pdf") ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}>
                    {doc.type.includes("pdf") ? <FileText className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-foreground">{doc.name}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground font-medium mt-1">
                      <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString("ro-RO")}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    aria-label="Descarcă document"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDownloadDocument(doc.id, doc.name)}
                  >
                    <Download className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    aria-label="Șterge document"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showRecordModal} onOpenChange={setShowRecordModal}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black">Fișă Medicală Nouă</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Simptome</Label>
              <Textarea placeholder="Descrieți simptomele pacientului..." className="rounded-xl resize-none" rows={2}
                value={recordForm.symptoms} onChange={(e) => setRecordForm((f) => ({ ...f, symptoms: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Diagnostic</Label>
              <Textarea placeholder="Diagnostic stabilit..." className="rounded-xl resize-none" rows={2}
                value={recordForm.diagnosis} onChange={(e) => setRecordForm((f) => ({ ...f, diagnosis: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tratament</Label>
              <Textarea placeholder="Plan de tratament..." className="rounded-xl resize-none" rows={2}
                value={recordForm.treatment} onChange={(e) => setRecordForm((f) => ({ ...f, treatment: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Rețetă / Medicație</Label>
              <Textarea placeholder="Medicamente prescrise..." className="rounded-xl resize-none" rows={2}
                value={recordForm.prescription} onChange={(e) => setRecordForm((f) => ({ ...f, prescription: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Note adiționale</Label>
              <Textarea placeholder="Alte observații..." className="rounded-xl resize-none" rows={2}
                value={recordForm.notes} onChange={(e) => setRecordForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={recordForm.followUpRequired}
                  onChange={(e) => setRecordForm((f) => ({ ...f, followUpRequired: e.target.checked }))} className="rounded" />
                <span className="text-sm font-semibold">Necesită control</span>
              </label>
              {recordForm.followUpRequired && (
                <Input type="date" className="h-9 rounded-xl flex-1"
                  value={recordForm.followUpDate}
                  onChange={(e) => setRecordForm((f) => ({ ...f, followUpDate: e.target.value }))} />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecordModal(false)} className="rounded-xl">Anulează</Button>
            <Button onClick={handleSaveRecord} disabled={savingRecord} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              {savingRecord && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
