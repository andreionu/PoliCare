"use client"

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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

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
  servicePopularity: Array<{ name: string; value: number }>
  peakHours: Array<{ hour: string; count: number }>
  demographics: Array<{ name: string; value: number }>
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

    setGeneratingReport(true)
    try {
      const typeLabel = TYPE_LABELS[reportFormData.type]
      const periodLabel = PERIOD_LABELS[reportFormData.period]
      const dateStr = new Date().toISOString().split("T")[0]
      const title = `Raport ${typeLabel} — ${periodLabel}`

      if (reportFormData.format === "csv") {
        const url = `/api/reports?type=${reportFormData.type}&period=${reportFormData.period}&format=csv`
        const response = await fetch(url)
        if (!response.ok) throw new Error("API Error")
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = objectUrl
        a.download = `raport-${reportFormData.type}-${dateStr}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(objectUrl)
      } else {
        // Excel & PDF fetch JSON first
        const url = `/api/reports?type=${reportFormData.type}&period=${reportFormData.period}&format=json`
        const response = await fetch(url)
        if (!response.ok) throw new Error("API Error")
        const data = await response.json()
        
        // Remove quotes from JSON strings that were escaped for CSV
        const cleanStr = (s: string) => s.replace(/^"|"$/g, '').replace(/""/g, '"')
        const headers = data.headers.map(cleanStr)
        const rows = data.rows.map((row: string[]) => row.map(cleanStr))

        if (reportFormData.format === "excel") {
          const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Raport")
          XLSX.writeFile(wb, `raport-${reportFormData.type}-${dateStr}.xlsx`)
        } else if (reportFormData.format === "pdf") {
          const doc = new jsPDF()
          
          // PDF Template styling
          doc.setFillColor(32, 96, 112) // #206070 Primary color
          doc.rect(0, 0, 210, 40, "F")
          
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(24)
          doc.setFont("helvetica", "bold")
          doc.text("POLICARE", 14, 22)
          
          doc.setFontSize(10)
          doc.setFont("helvetica", "normal")
          doc.text("Clinica Medicala Excellence", 14, 30)
          
          doc.setFontSize(12)
          doc.setTextColor(255, 255, 255)
          doc.text(`Data: ${new Date().toLocaleDateString("ro-RO")}`, 150, 22)

          doc.setTextColor(30, 41, 59)
          doc.setFontSize(16)
          doc.setFont("helvetica", "bold")
          doc.text(title, 14, 55)

          autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 65,
            theme: 'grid',
            headStyles: { fillColor: [32, 96, 112], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            styles: { fontSize: 9, cellPadding: 4 },
          })
          
          const pageCount = (doc as any).internal.getNumberOfPages()
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(100, 116, 139)
            doc.text(
              `Pagina ${i} din ${pageCount}  |  Generat din portalul administrativ PoliCare`,
              14,
              doc.internal.pageSize.height - 10
            )
          }

          doc.save(`raport-${reportFormData.type}-${dateStr}.pdf`)
        }
      }

      const newReport: GeneratedReport = {
        id: Date.now(),
        title,
        type: typeLabel,
        period: periodLabel,
        date: new Date().toLocaleDateString("ro-RO"),
        format: reportFormData.format.toUpperCase(),
      }
      setGeneratedReports((prev) => [newReport, ...prev])

      toast({ title: "Raport generat", description: `Fișierul ${reportFormData.format.toUpperCase()} a fost descărcat cu succes.` })
      setIsGenerateReportOpen(false)
      setReportFormData({ type: "", period: "", format: "" })
      setReportErrors({})
    } catch (e: any) {
      console.error(e)
      toast({ title: "Eroare", description: "Nu s-a putut genera raportul.", variant: "destructive" })
    } finally {
      setGeneratingReport(false)
    }
  }

  return (
    <>
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
            <Card className="relative overflow-hidden group border border-primary/5 shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm p-6 rounded-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10 rounded-full blur-3xl group-hover:opacity-30 transition-opacity bg-gradient-to-br from-primary to-primary/80" />
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

            <Card className="relative overflow-hidden group border border-purple-500/5 shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm p-6 rounded-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10 rounded-full blur-3xl group-hover:opacity-30 transition-opacity bg-gradient-to-br from-purple-500 to-fuchsia-600" />
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

            <Card className="relative overflow-hidden group border border-amber-500/5 shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm p-6 rounded-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10 rounded-full blur-3xl group-hover:opacity-30 transition-opacity bg-gradient-to-br from-amber-500 to-orange-600" />
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

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm p-6 overflow-hidden rounded-2xl">
              <div className="mb-6 flex items-center justify-between">
                 <div>
                    <h3 className="font-bold tracking-tight text-foreground/90 text-lg">Top Servicii & Consultații</h3>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Ultimele 3 luni</p>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                 </div>
              </div>
              <div className="h-[250px] w-full">
                {loadingStats ? (
                  <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : statsData?.servicePopularity?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.servicePopularity} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11, fontWeight: 500}} width={90} />
                      <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px' }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                        {statsData.servicePopularity.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'][index % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">Nu există date suficiente.</div>
                )}
              </div>
            </Card>

            <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm p-6 overflow-hidden rounded-2xl">
               <div className="mb-6 flex items-center justify-between">
                 <div>
                    <h3 className="font-bold tracking-tight text-foreground/90 text-lg">Ore de Vârf</h3>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Distribuția programărilor</p>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                 </div>
              </div>
              <div className="h-[250px] w-full">
                {loadingStats ? (
                  <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
                ) : statsData?.peakHours?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.peakHours} margin={{ top: 20, right: 10, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11, fontWeight: 500}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11}} />
                      <Tooltip cursor={{fill: 'rgba(16, 185, 129, 0.05)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#10b981', fontWeight: 600 }} />
                      <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} barSize={36}>
                        {statsData.peakHours.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={['#10b981', '#34d399', '#059669', '#047857'][index % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">Nu există date suficiente.</div>
                )}
              </div>
            </Card>

            <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm p-6 overflow-hidden rounded-2xl">
               <div className="mb-6 flex items-center justify-between">
                 <div>
                    <h3 className="font-bold tracking-tight text-foreground/90 text-lg">Demografice</h3>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Distribuția pe Vârstă</p>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-purple-500/5 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-500" />
                 </div>
              </div>
              <div className="h-[250px] w-full">
                {loadingStats ? (
                  <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
                ) : statsData?.demographics?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                      <Pie
                        data={statsData.demographics}
                        cx="50%"
                        cy="45%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {statsData.demographics.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={['#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontWeight: 600 }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 500, paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">Nu există date suficiente.</div>
                )}
              </div>
            </Card>
          </div>

          <Card className="mb-8 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden bg-white dark:bg-card/50 backdrop-blur-sm rounded-2xl">
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

          <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden bg-white dark:bg-card/50 backdrop-blur-sm rounded-2xl">
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
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel — XLSX</SelectItem>
                </SelectContent>
              </Select>
              {reportErrors.format && <p className="text-sm text-destructive mt-1">Formatul este obligatoriu</p>}
            </div>
          </div>

          <DialogFooter className="pt-6 border-t mt-6">
            <Button variant="ghost" onClick={() => setIsGenerateReportOpen(false)} disabled={generatingReport} className="h-11 rounded-xl px-6 font-semibold text-muted-foreground hover:bg-accent">
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
    </>
  )
}
