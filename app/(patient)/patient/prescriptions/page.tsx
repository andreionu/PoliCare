"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Loader2, Printer, Pill } from "lucide-react"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { PrescriptionPrint } from "@/components/prescription-print"
import { useToast } from "@/hooks/use-toast"
import { formatDoctorName } from "@/lib/utils"

const statusBadge: Record<string, { label: string; className: string }> = {
  ACTIVA:    { label: "Activă",    className: "bg-emerald-100 text-emerald-700" },
  EXPIRATA:  { label: "Expirată",  className: "bg-amber-100 text-amber-700" },
  ANULATA:   { label: "Anulată",   className: "bg-red-100 text-red-700" },
}

export default function PatientPrescriptionsPage() {
  const { toast } = useToast()
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [printTarget, setPrintTarget] = useState<any | null>(null)

  useEffect(() => {
    fetch("/api/patient/prescriptions")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPrescriptions(data)
        else toast({ title: "Eroare", description: data.error || "Eroare la încărcare", variant: "destructive" })
      })
      .catch(() => toast({ title: "Eroare", description: "Eroare de rețea", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Rețetele Mele</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {loading ? "Se încarcă..." : `${prescriptions.length} rețet${prescriptions.length === 1 ? "ă" : "e"}`}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : prescriptions.length === 0 ? (
        <Card className="p-10 text-center rounded-2xl border-dashed">
          <Pill className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-semibold text-muted-foreground">Nicio rețetă înregistrată</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Rețetele eliberate de medic vor apărea aici.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => {
            const badge = statusBadge[rx.status] ?? { label: rx.status, className: "bg-gray-100 text-gray-700" }
            return (
              <Card key={rx.id} className="p-4 rounded-2xl hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-teal-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm">{rx.number}</p>
                        <Badge className={`text-[10px] font-semibold px-2 py-0.5 ${badge.className}`}>
                          {badge.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{rx.diagnosis}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDoctorName(rx.doctor.name)} · {rx.doctor.specialty} ·{" "}
                        {format(new Date(rx.createdAt), "dd MMM yyyy", { locale: ro })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPrintTarget(rx)}
                    className="rounded-xl shrink-0 gap-1.5 text-teal-700 border-teal-200 hover:bg-teal-50"
                  >
                    <Printer className="h-4 w-4" />
                    <span className="hidden sm:inline">Print</span>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Print dialog */}
      <Dialog open={!!printTarget} onOpenChange={(v) => { if (!v) setPrintTarget(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Rețetă {printTarget?.number}
            </DialogTitle>
          </DialogHeader>
          {printTarget && <PrescriptionPrint prescription={printTarget} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
