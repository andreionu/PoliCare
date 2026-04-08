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
            <Button 
              className="gap-2 h-11 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all rounded-xl font-bold text-white" 
              onClick={() => setIsGenerateReportOpen(true)}
            >
              <FileText className="w-4 h-4" />
              Generează Raport
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <Card className="relative overflow-hidden group border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm p-6">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity bg-gradient-to-br from-primary to-primary/80" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <Users className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">Pacienți Luna Aceasta</p>
                  <div className="flex items-baseline gap-2">
                    {loadingStats ? (
                      <div className="h-8 w-20 bg-muted animate-pulse rounded-lg" />
                    ) : (
                      <>
                        <span className="text-3xl font-extrabold tracking-tight text-foreground">{statsData?.patientsThisMonth.toLocaleString() ?? "—"}</span>
                        <div className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          <span>+12%</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm p-6">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity bg-gradient-to-br from-purple-500 to-fuchsia-600" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Calendar className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">Programări Luna Aceasta</p>
                  <div className="flex items-baseline gap-2">
                    {loadingStats ? (
                      <div className="h-8 w-20 bg-muted animate-pulse rounded-lg" />
                    ) : (
                      <span className="text-3xl font-extrabold tracking-tight text-foreground">{statsData?.appointmentsThisMonth.toLocaleString() ?? "—"}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm p-6">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity bg-gradient-to-br from-amber-500 to-orange-600" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Activity className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">Rata Finalizare</p>
                  <div className="flex items-baseline gap-2">
                    {loadingStats ? (
                      <div className="h-8 w-20 bg-muted animate-pulse rounded-lg" />
                    ) : (
                      <span className="text-3xl font-extrabold tracking-tight text-foreground">{statsData ? `${statsData.completionRate}%` : "—"}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="mb-8 border-none shadow-sm overflow-hidden bg-white dark:bg-card/50 backdrop-blur-sm">
            <div className="p-6 border-b border-muted/30">
              <h2 className="text-xl font-bold tracking-tight text-foreground/90">Tendințe Lunare</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Luna</th>
                    <th className="text-right py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Pacienți</th>
                    <th className="text-right py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Programări</th>
                    <th className="text-right py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Rata Finalizare</th>
                    <th className="text-right py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Prog./Pacient</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/30">
                  {loadingStats ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                          <span className="font-bold text-xs uppercase tracking-widest">Se încarcă datele...</span>
                        </div>
                      </td>
                    </tr>
                  ) : statsData?.monthlyTrend.length ? (
                    statsData.monthlyTrend.map((stat, index) => (
                      <tr key={index} className="group hover:bg-primary/5 transition-colors">
                        <td className="py-4 px-6 text-sm font-bold text-foreground/90">{stat.month}</td>
                        <td className="py-4 px-6 text-right text-sm font-medium tabular-nums text-foreground/80">{stat.patients.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right text-sm font-medium tabular-nums text-foreground/80">{stat.appointments.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right">
                          <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 text-primary font-bold tabular-nums">
                            {stat.completionRate}%
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right text-sm font-bold tabular-nums text-primary">{stat.appointmentsPerPatient}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground font-medium">Nu există date disponibile</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-card/50 backdrop-blur-sm">
            <div className="p-6 border-b border-muted/30">
              <h2 className="text-xl font-bold tracking-tight text-foreground/90">Rapoarte Generate</h2>
            </div>
            {generatedReports.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4 text-muted-foreground/30">
                  <FileText className="w-8 h-8" />
                </div>
                <p className="font-bold text-foreground/70">Niciun raport generat în această sesiune.</p>
                <p className="text-sm font-medium mt-1">Apasă „Generează Raport" pentru a exporta date în format CSV.</p>
              </div>
            ) : (
              <div className="divide-y divide-muted/30">
                {generatedReports.map((report) => (
                  <div key={report.id} className="group p-6 hover:bg-primary/5 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-5 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-foreground/90 group-hover:text-primary transition-colors">{report.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-bold uppercase tracking-widest">
                            <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 text-primary">
                              {report.type}
                            </Badge>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{report.date}</span>
                            </div>
                            <Badge variant="secondary" className="rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-none">
                              {report.format}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                        <Download className="w-5 h-5" />
                      </Button>
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
          <DialogHeader className="pb-4 border-b border-border/50">
            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center mb-4">
               <FileText className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">Generează Raport Nou</DialogTitle>
            <DialogDescription className="text-muted-foreground">Selectează tipul și perioada pentru raportul dorit</DialogDescription>
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

          <DialogFooter className="pt-6 border-t mt-6">
            <Button variant="ghost" onClick={() => setIsGenerateReportOpen(false)} disabled={generatingReport} className="h-11 rounded-xl px-6 font-semibold hover:bg-slate-50 transition-colors">
              Anulează
            </Button>
            <Button onClick={handleGenerateReport} disabled={generatingReport} className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl h-11 px-8 font-bold text-white transition-all">
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
