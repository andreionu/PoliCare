"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Medication {
  name: string
  concentration: string
  quantity: string
  dosage: string
  duration: string
}

const emptyMedication = (): Medication => ({
  name: "",
  concentration: "",
  quantity: "",
  dosage: "",
  duration: "",
})

interface PrescriptionFormProps {
  patientId: string
  appointmentId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function PrescriptionForm({ patientId, appointmentId, open, onOpenChange, onSaved }: PrescriptionFormProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [diagnosis, setDiagnosis] = useState("")
  const [notes, setNotes] = useState("")
  const [medications, setMedications] = useState<Medication[]>([emptyMedication()])

  const updateMed = (index: number, field: keyof Medication, value: string) => {
    setMedications((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)))
  }

  const addMed = () => setMedications((prev) => [...prev, emptyMedication()])

  const removeMed = (index: number) => {
    if (medications.length === 1) return
    setMedications((prev) => prev.filter((_, i) => i !== index))
  }

  const reset = () => {
    setDiagnosis("")
    setNotes("")
    setMedications([emptyMedication()])
  }

  const handleSave = async () => {
    if (!diagnosis.trim()) {
      toast({ title: "Eroare", description: "Diagnosticul este obligatoriu.", variant: "destructive" })
      return
    }
    const filledMeds = medications.filter((m) => m.name.trim())
    if (filledMeds.length === 0) {
      toast({ title: "Eroare", description: "Adăugați cel puțin un medicament.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          appointmentId: appointmentId || undefined,
          diagnosis: diagnosis.trim(),
          medications: filledMeds,
          notes: notes.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Eroare necunoscută")
      }
      toast({ title: "Succes", description: "Rețeta a fost creată." })
      reset()
      onOpenChange(false)
      onSaved()
    } catch (err: any) {
      toast({ title: "Eroare", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleClose = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Rețetă Medicală Nouă</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Diagnosis */}
          <div className="space-y-2">
            <Label htmlFor="diagnosis" className="font-semibold">
              Diagnostic <span className="text-destructive">*</span>
            </Label>
            <Input
              id="diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="ex: Hipertensiune arterială grad II"
              className="rounded-xl"
            />
          </div>

          {/* Medications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">
                Medicamente <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMed}
                className="rounded-xl h-8 gap-1.5 text-teal-700 border-teal-200 hover:bg-teal-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Adaugă
              </Button>
            </div>

            {medications.map((med, i) => (
              <div key={i} className="border rounded-xl p-4 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-muted-foreground">Medicament {i + 1}</p>
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMed(i)}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                      aria-label="Șterge medicament"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Denumire</Label>
                    <Input
                      value={med.name}
                      onChange={(e) => updateMed(i, "name", e.target.value)}
                      placeholder="ex: Amlodipina"
                      className="rounded-lg h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Concentrație / Formă</Label>
                    <Input
                      value={med.concentration}
                      onChange={(e) => updateMed(i, "concentration", e.target.value)}
                      placeholder="ex: 10mg tablete"
                      className="rounded-lg h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Cantitate</Label>
                    <Input
                      value={med.quantity}
                      onChange={(e) => updateMed(i, "quantity", e.target.value)}
                      placeholder="ex: 2 cutii"
                      className="rounded-lg h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Mod de administrare</Label>
                    <Input
                      value={med.dosage}
                      onChange={(e) => updateMed(i, "dosage", e.target.value)}
                      placeholder="ex: 1 cp/zi dimineața"
                      className="rounded-lg h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Durată tratament</Label>
                    <Input
                      value={med.duration}
                      onChange={(e) => updateMed(i, "duration", e.target.value)}
                      placeholder="ex: 30 zile"
                      className="rounded-lg h-9"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="font-semibold">
              Indicații generale
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Administrați medicamentele cu apă, evitați alcoolul..."
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={saving} className="rounded-xl">
            Anulează
          </Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvează Rețeta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
