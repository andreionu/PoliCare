"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, TrendingUp, Download, Calendar, Users, Activity, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface MonthStat {
  month: string
  patients: number
  appointments: number
  completionRate: number
  appointmentsPerPatient: string
}

interface StatsData {
  patientsThisMonth: number
  appointmentsThisMonth: number
  completionRate: number
  monthlyTrend: MonthStat[]
}

interface GeneratedReport {
  id: number
  title: string
  type: string
  period: string
  date: string
  format: string
}

const TYPE_LABELS: Record<string, string> = {
  patients: "Pacienți",
  appointments: "Programări",
  doctors: "Performanță Medici",
  departments: "Departamente",
}

const PERIOD_LABELS: Record<string, string> = {
  "current-month": "Luna curentă",
  "last-month": "Luna trecută",
  "last-3-months": "Ultimele 3 luni",
  "last-6-months": "Ultimele 6 luni",
  "this-year": "Anul curent",
}

export default function ReportsPage() {
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false)
  const [reportFormData, setReportFormData] = useState({
    type: "",
    period: "",
    format: "",
  })
  const [reportErrors, setReportErrors] = useState<Record<string, boolean>>({})
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetch("/api/reports/stats")
      .then((r) => r.json())
      .then((data) => setStatsData(data))
      .catch(() => {
        toast({ title: "Eroare", description: "Nu s-au putut încărca statisticile.", variant: "destructive" })
      })
      .finally(() => setLoadingStats(false))
  }, [])

  async function handleGenerateReport() {
    const newErrors: Record<string, boolean> = {}
    if (!reportFormData.type) newErrors.type = true
    if (!reportFormData.period) newErrors.period = true
    if (!reportFormData.format) newErrors.format = true

    if (Object.keys(newErrors).length > 0) {
      setReportErrors(newErrors)
      toast({ title: "Eroare validare", description: "Te rugăm să completezi toate câmpurile obligatorii.", variant: "destructive" })
      return
    }

    if (reportFormData.format !== "csv") {
      toast({ title: "Format în curând disponibil", description: "Momentan este disponibil doar formatul CSV." })
      return
    }

    setGeneratingReport(true)
    try {
      const url = `/api/reports?type=${reportFormData.type}&period=${reportFormData.period}&format=csv`
      const response = await fetch(url)

      if (!response.ok) {
        const data = await response.json()
        toast({ title: "Eroare", description: data.message || "Nu s-a putut genera raportul.", variant: "destructive" })
        return
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const dateStr = new Date().toISOString().split("T")[0]
      a.href = objectUrl
      a.download = `raport-${reportFormData.type}-${dateStr}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)

      const newReport: GeneratedReport = {
        id: Date.now(),
        title: `Raport ${TYPE_LABELS[reportFormData.type]} — ${PERIOD_LABELS[reportFormData.period]}`,
        type: TYPE_LABELS[reportFormData.type],
        period: PERIOD_LABELS[reportFormData.period],
        date: new Date().toLocaleDateString("ro-RO"),
        format: "CSV",
      }
      setGeneratedReports((prev) => [newReport, ...prev])

      toast({ title: "Raport generat", description: "Fișierul CSV a fost descărcat cu succes." })
      setIsGenerateReportOpen(false)
      setReportFormData({ type: "", period: "", format: "" })
      setReportErrors({})
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut genera raportul.", variant: "destructive" })
    } finally {
      setGeneratingReport(false)
    }
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1600px] mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-2">Rapoarte</h1>
              <p className="text-muted-foreground">Vizualizează rapoarte și statistici</p>
            </div>
            <Button className="gap-2" onClick={() => setIsGenerateReportOpen(true)}>
              <FileText className="w-4 h-4" />
              Generează Raport
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Pacienți Luna Aceasta</p>
                  <div className="flex items-center gap-2">
                    {loadingStats ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <p className="text-2xl font-semibold">{statsData?.patientsThisMonth.toLocaleString() ?? "—"}</p>
                        <div className="flex items-center text-green-600 text-sm">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Programări Luna Aceasta</p>
                  <div className="flex items-center gap-2">
                    {loadingStats ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <p className="text-2xl font-semibold">{statsData?.appointmentsThisMonth.toLocaleString() ?? "—"}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Rata Finalizare</p>
                  <div className="flex items-center gap-2">
                    {loadingStats ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <p className="text-2xl font-semibold">{statsData ? `${statsData.completionRate}%` : "—"}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="mb-8 p-6">
            <h2 className="text-xl font-semibold mb-6">Tendințe Lunare</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Luna</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Pacienți</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Programări</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Rata Finalizare</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Prog./Pacient</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStats ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                        Se încarcă...
                      </td>
                    </tr>
                  ) : statsData?.monthlyTrend.length ? (
                    statsData.monthlyTrend.map((stat, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-4 px-4 font-medium">{stat.month}</td>
                        <td className="py-4 px-4 text-right">{stat.patients.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right">{stat.appointments.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right">{stat.completionRate}%</td>
                        <td className="py-4 px-4 text-right">{stat.appointmentsPerPatient}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">Nu există date disponibile</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Rapoarte Generate</h2>
            </div>
            {generatedReports.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Niciun raport generat în această sesiune.</p>
                <p className="text-sm mt-1">Apasă „Generează Raport" pentru a exporta date.</p>
              </div>
            ) : (
              <div className="divide-y">
                {generatedReports.map((report) => (
                  <div key={report.id} className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{report.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <Badge variant="outline">{report.type}</Badge>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{report.date}</span>
                            </div>
                            <Badge variant="secondary">{report.format}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={isGenerateReportOpen} onOpenChange={setIsGenerateReportOpen}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Generează Raport Nou</DialogTitle>
            <DialogDescription>Selectează tipul și perioada pentru raportul dorit</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label>
                Tip Raport <span className="text-destructive">*</span>
              </Label>
              <Select
                value={reportFormData.type}
                onValueChange={(value) => {
                  setReportFormData({ ...reportFormData, type: value })
                  setReportErrors({ ...reportErrors, type: false })
                }}
              >
                <SelectTrigger className={`mt-2 ${reportErrors.type ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Selectează tipul raportului" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patients">Raport Pacienți</SelectItem>
                  <SelectItem value="appointments">Raport Programări</SelectItem>
                  <SelectItem value="doctors">Raport Performanță Medici</SelectItem>
                  <SelectItem value="departments">Raport Departamente</SelectItem>
                </SelectContent>
              </Select>
              {reportErrors.type && <p className="text-sm text-destructive mt-1">Tipul raportului este obligatoriu</p>}
            </div>

            <div>
              <Label>
                Perioadă <span className="text-destructive">*</span>
              </Label>
              <Select
                value={reportFormData.period}
                onValueChange={(value) => {
                  setReportFormData({ ...reportFormData, period: value })
                  setReportErrors({ ...reportErrors, period: false })
                }}
              >
                <SelectTrigger className={`mt-2 ${reportErrors.period ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Selectează perioada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Luna curentă</SelectItem>
                  <SelectItem value="last-month">Luna trecută</SelectItem>
                  <SelectItem value="last-3-months">Ultimele 3 luni</SelectItem>
                  <SelectItem value="last-6-months">Ultimele 6 luni</SelectItem>
                  <SelectItem value="this-year">Anul curent</SelectItem>
                </SelectContent>
              </Select>
              {reportErrors.period && <p className="text-sm text-destructive mt-1">Perioada este obligatorie</p>}
            </div>

            <div>
              <Label>
                Format <span className="text-destructive">*</span>
              </Label>
              <Select
                value={reportFormData.format}
                onValueChange={(value) => {
                  setReportFormData({ ...reportFormData, format: value })
                  setReportErrors({ ...reportErrors, format: false })
                }}
              >
                <SelectTrigger className={`mt-2 ${reportErrors.format ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Selectează formatul" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF (în curând)</SelectItem>
                  <SelectItem value="excel">Excel — XLSX (în curând)</SelectItem>
                </SelectContent>
              </Select>
              {reportErrors.format && <p className="text-sm text-destructive mt-1">Formatul este obligatoriu</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateReportOpen(false)} disabled={generatingReport}>
              Anulează
            </Button>
            <Button onClick={handleGenerateReport} disabled={generatingReport} className="gap-2">
              {generatingReport ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Se generează...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generează Raport
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
