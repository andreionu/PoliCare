"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Loader2, Printer, Pill, Download, Stethoscope } from "lucide-react"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { PrescriptionPrint } from "@/components/prescription-print"
import { useToast } from "@/hooks/use-toast"
import { formatDoctorName } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface ClinicSettings { clinicName: string; clinicAddress?: string | null; clinicPhone?: string | null }

const statusBadge: Record<string, { label: string; className: string }> = {
  ACTIVA:   { label: "Activă",  className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  EXPIRATA: { label: "Expirată",className: "bg-amber-100  text-amber-700  border-amber-200"  },
  ANULATA:  { label: "Anulată", className: "bg-red-100    text-red-700    border-red-200"    },
}

async function downloadPrescriptionPdf(rx: any, settings: ClinicSettings) {
  const { jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const W = 210
  const margin = 18

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(15, 118, 110)   // teal-700
  doc.rect(0, 0, W, 36, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text(settings.clinicName, margin, 14)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  let headerY = 20
  if (settings.clinicAddress) { doc.text(settings.clinicAddress, margin, headerY); headerY += 4 }
  if (settings.clinicPhone)   { doc.text(settings.clinicPhone,   margin, headerY) }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("REȚETĂ MEDICALĂ", W - margin, 13, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(`Nr. ${rx.number}`, W - margin, 19, { align: "right" })
  doc.text(`Data: ${format(new Date(rx.createdAt), "dd.MM.yyyy", { locale: ro })}`, W - margin, 24, { align: "right" })

  // ── Doctor / Patient row ──────────────────────────────────────────────────
  const rowY = 42
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.text("MEDIC", margin, rowY)
  doc.text("PACIENT", W / 2 + 2, rowY)

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(`Dr. ${rx.doctor.name}`, margin, rowY + 5)
  doc.text(rx.patient.name, W / 2 + 2, rowY + 5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text(`${rx.doctor.specialty} · ${rx.doctor.department.name}`, margin, rowY + 10)
  if (rx.patient.cnp)       doc.text(`CNP: ${rx.patient.cnp}`, W / 2 + 2, rowY + 10)

  // divider
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, rowY + 15, W - margin, rowY + 15)

  // ── Diagnosis ─────────────────────────────────────────────────────────────
  const diagY = rowY + 22
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.text("DIAGNOSTIC", margin, diagY)

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text(rx.diagnosis, margin, diagY + 6)

  doc.line(margin, diagY + 11, W - margin, diagY + 11)

  // ── Medications table ─────────────────────────────────────────────────────
  const meds = (rx.medications ?? []) as any[]
  autoTable(doc, {
    startY: diagY + 16,
    head: [["#", "Medicament", "Concentrație", "Cantitate", "Doză / Durată"]],
    body: meds.map((m: any, i: number) => [
      i + 1,
      m.name,
      m.concentration || "—",
      m.quantity || "—",
      [m.dosage, m.duration].filter(Boolean).join(" · ") || "—",
    ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 253, 252] },
    columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 50 } },
    margin: { left: margin, right: margin },
  })

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (rx.notes) {
    const notesY = (doc as any).lastAutoTable.finalY + 8
    doc.setDrawColor(220, 220, 220)
    doc.line(margin, notesY - 4, W - margin, notesY - 4)
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.text("INDICAȚII", margin, notesY)
    doc.setFont("helvetica", "italic")
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    doc.text(doc.splitTextToSize(rx.notes, W - margin * 2), margin, notesY + 6)
  }

  // ── Signature ─────────────────────────────────────────────────────────────
  const sigY = 265
  if (rx.signatureData) {
    doc.addImage(rx.signatureData, "PNG", W - margin - 50, sigY - 20, 50, 18)
  }
  doc.setDrawColor(150, 150, 150)
  doc.line(W - margin - 50, sigY, W - margin, sigY)
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("Semnătura și parafa medicului", W - margin - 50, sigY + 4)

  doc.save(`Reteta-${rx.number}.pdf`)
}

export default function PatientPrescriptionsPage() {
  const { toast } = useToast()
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [settings, setSettings] = useState<ClinicSettings>({ clinicName: "PoliCare" })
  const [loading, setLoading] = useState(true)
  const [printTarget, setPrintTarget] = useState<any | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/patient/prescriptions").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([data, sett]) => {
        if (Array.isArray(data)) setPrescriptions(data)
        else toast({ title: "Eroare", description: data.error || "Eroare la încărcare", variant: "destructive" })
        if (sett && !sett.error) setSettings(sett)
      })
      .catch(() => toast({ title: "Eroare", description: "Eroare de rețea", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [])

  const handleDownload = async (rx: any) => {
    setDownloading(rx.id)
    try {
      await downloadPrescriptionPdf(rx, settings)
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut genera PDF-ul.", variant: "destructive" })
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Rețetele Mele</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {loading ? "Se încarcă..." : `${prescriptions.length} rețet${prescriptions.length === 1 ? "ă" : "e"} înregistrate`}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <Pill className="h-12 w-12 text-slate-300 mb-4" />
          <p className="font-semibold text-slate-500">Nicio rețetă înregistrată</p>
          <p className="text-sm text-slate-400 mt-1">Rețetele eliberate de medic vor apărea aici.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {prescriptions.map((rx) => {
            const badge = statusBadge[rx.status] ?? { label: rx.status, className: "bg-gray-100 text-gray-700 border-gray-200" }
            const meds = (rx.medications ?? []) as any[]
            const isDownloading = downloading === rx.id

            return (
              <div
                key={rx.id}
                className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Top accent bar */}
                <div className={cn(
                  "h-1 w-full",
                  rx.status === "ACTIVA" ? "bg-emerald-400" :
                  rx.status === "EXPIRATA" ? "bg-amber-400" : "bg-red-400"
                )} />

                <div className="p-5 flex flex-col gap-4 flex-1">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800 leading-tight">{rx.number}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {format(new Date(rx.createdAt), "dd MMM yyyy", { locale: ro })}
                        </p>
                      </div>
                    </div>
                    <Badge className={cn("text-[10px] font-semibold px-2 py-0.5 border shrink-0", badge.className)}>
                      {badge.label}
                    </Badge>
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Diagnostic</p>
                    <p className="text-sm font-semibold text-slate-800 line-clamp-2">{rx.diagnosis}</p>
                  </div>

                  {/* Metadata row */}
                  <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                      <span className="truncate">
                        {formatDoctorName(rx.doctor.name)}
                        {rx.doctor.specialty ? ` · ${rx.doctor.specialty}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                      <span>
                        {meds.length === 0
                          ? "Fără medicamente"
                          : meds.length === 1
                          ? `1 medicament: ${meds[0].name}`
                          : `${meds.length} medicamente`}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-auto pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(rx)}
                      disabled={isDownloading}
                      className="flex-1 rounded-xl gap-1.5 text-teal-700 border-teal-200 hover:bg-teal-50 hover:border-teal-300 text-xs font-semibold"
                    >
                      {isDownloading
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Download className="h-3.5 w-3.5" />}
                      Descarcă PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrintTarget(rx)}
                      className="rounded-xl gap-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-semibold px-3"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Print dialog */}
      <Dialog open={!!printTarget} onOpenChange={(v) => { if (!v) setPrintTarget(null) }}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Rețetă {printTarget?.number}</DialogTitle>
          </DialogHeader>
          {printTarget && <PrescriptionPrint prescription={printTarget} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
