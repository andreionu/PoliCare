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
import { FileText, TrendingUp, Download, Calendar, Users, Activity, Loader2, Coins } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts"

interface MonthStat {
  month: string
  patients: number
  appointments: number
  completionRate: number
  appointmentsPerPatient: string
}

interface DoctorPerf {
  name: string
  total: number
  completed: number
  cancelled: number
  revenue: number
  completionRate: number
}

interface StatsData {
  patientsThisMonth: number
  appointmentsThisMonth: number
  completionRate: number
  monthlyTrend: MonthStat[]
  servicePopularity: Array<{ name: string; value: number }>
  peakHours: Array<{ hour: string; count: number }>
  demographics: Array<{ name: string; value: number }>
  doctorPerformance: DoctorPerf[]
  totalRevenue: number
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
          const XLSX = await import("xlsx")
          const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Raport")
          XLSX.writeFile(wb, `raport-${reportFormData.type}-${dateStr}.xlsx`)
        } else if (reportFormData.format === "pdf") {
          const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
            import("jspdf"),
            import("jspdf-autotable"),
          ])
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
          <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground mb-1">Rapoarte & Analize</h1>
              <p className="text-sm font-medium text-muted-foreground">O privire detaliată asupra performanței clinicii tale.</p>
            </div>
            <Button 
              className="gap-2 h-12 px-6 bg-gradient-to-r from-primary to-[#40A0D0] hover:from-[#1a4d5a] hover:to-[#206070] shadow-[0_8px_20px_rgb(32,96,112,0.25)] transition-all rounded-2xl font-bold text-white hover:-translate-y-1" 
              onClick={() => setIsGenerateReportOpen(true)}
            >
              <FileText className="w-5 h-5" />
              Generează Raport
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <Card className="relative overflow-hidden group border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-500 bg-white dark:bg-card/80 backdrop-blur-xl p-6 rounded-[24px]">
              <div className="absolute top-0 right-0 w-48 h-48 -mr-12 -mt-12 opacity-[0.03] group-hover:opacity-10 rounded-full blur-3xl transition-opacity bg-gradient-to-br from-primary to-primary/80" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500">
                  <Users className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Pacienți Luna Aceasta</p>
                  <div className="flex items-baseline gap-3">
                    {loadingStats ? (
                      <div className="h-10 w-24 bg-muted animate-pulse rounded-xl" />
                    ) : (
                      <>
                        <span className="text-4xl font-black tracking-tight text-slate-800">{statsData?.patientsThisMonth.toLocaleString() ?? "—"}</span>
                        <div className="flex items-center text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-lg text-xs font-bold border border-emerald-500/20">
                          <TrendingUp className="w-3.5 h-3.5 mr-1" />
                          <span>+12%</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-500 bg-white dark:bg-card/80 backdrop-blur-xl p-6 rounded-[24px]">
              <div className="absolute top-0 right-0 w-48 h-48 -mr-12 -mt-12 opacity-[0.03] group-hover:opacity-10 rounded-full blur-3xl transition-opacity bg-gradient-to-br from-purple-500 to-fuchsia-600" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-purple-500/10 to-fuchsia-600/5 border border-purple-500/10 text-purple-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500">
                  <Calendar className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Programări Luna Aceasta</p>
                  <div className="flex items-baseline gap-3">
                    {loadingStats ? (
                      <div className="h-10 w-24 bg-muted animate-pulse rounded-xl" />
                    ) : (
                      <span className="text-4xl font-black tracking-tight text-slate-800">{statsData?.appointmentsThisMonth.toLocaleString() ?? "—"}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-500 bg-white dark:bg-card/80 backdrop-blur-xl p-6 rounded-[24px]">
              <div className="absolute top-0 right-0 w-48 h-48 -mr-12 -mt-12 opacity-[0.03] group-hover:opacity-10 rounded-full blur-3xl transition-opacity bg-gradient-to-br from-amber-500 to-orange-600" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-amber-500/10 to-orange-600/5 border border-amber-500/10 text-amber-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500">
                  <Activity className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Rata Finalizare</p>
                  <div className="flex items-baseline gap-3">
                    {loadingStats ? (
                      <div className="h-10 w-24 bg-muted animate-pulse rounded-xl" />
                    ) : (
                      <span className="text-4xl font-black tracking-tight text-slate-800">{statsData ? `${statsData.completionRate}%` : "—"}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-500 bg-white dark:bg-card/80 backdrop-blur-xl p-6 rounded-[24px]">
              <div className="absolute top-0 right-0 w-48 h-48 -mr-12 -mt-12 opacity-[0.03] group-hover:opacity-10 rounded-full blur-3xl transition-opacity bg-gradient-to-br from-emerald-500 to-teal-600" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-emerald-500/10 to-teal-600/5 border border-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500">
                  <Coins className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Venituri Luna Aceasta</p>
                  <div className="flex items-baseline gap-3">
                    {loadingStats ? (
                      <div className="h-10 w-24 bg-muted animate-pulse rounded-xl" />
                    ) : (
                      <span className="text-4xl font-black tracking-tight text-slate-800">
                        {statsData ? `${statsData.totalRevenue.toLocaleString("ro-RO")} lei` : "—"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 bg-white dark:bg-card/80 backdrop-blur-xl p-6 overflow-hidden rounded-[24px]">
              <div className="mb-8 flex items-center justify-between">
                 <div>
                    <h3 className="font-bold tracking-tight text-slate-800 text-lg">Top Servicii & Consultații</h3>
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Ultimele 3 luni</p>
                 </div>
                 <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/10 flex items-center justify-center shadow-inner">
                    <Activity className="w-6 h-6 text-blue-600" />
                 </div>
              </div>
              <div className="h-[260px] w-full">
                {loadingStats ? (
                  <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                ) : statsData?.servicePopularity?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.servicePopularity} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBlue" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} width={90} />
                      <Tooltip 
                        cursor={{fill: 'rgba(59, 130, 246, 0.04)'}} 
                        contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px' }} 
                        itemStyle={{ color: '#0f172a', fontWeight: 800 }} 
                        formatter={(value: number) => [value, "Consultații / Servicii"]}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24} fill="url(#colorBlue)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">Nu există date suficiente.</div>
                )}
              </div>
            </Card>

            <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 bg-white dark:bg-card/80 backdrop-blur-xl p-6 overflow-hidden rounded-[24px]">
               <div className="mb-8 flex items-center justify-between">
                 <div>
                    <h3 className="font-bold tracking-tight text-slate-800 text-lg">Ore de Vârf</h3>
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Distribuția programărilor</p>
                 </div>
                 <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/10 flex items-center justify-center shadow-inner">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                 </div>
              </div>
              <div className="h-[260px] w-full">
                {loadingStats ? (
                  <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
                ) : statsData?.peakHours?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.peakHours} margin={{ top: 20, right: 10, left: -20, bottom: 10 }}>
                      <defs>
                        <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                      <Tooltip 
                        cursor={{fill: 'rgba(16, 185, 129, 0.04)'}} 
                        contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} 
                        itemStyle={{ color: '#064e3b', fontWeight: 800 }} 
                        formatter={(value: number) => [value, "Programări"]}
                      />
                      <Bar dataKey="count" fill="url(#colorGreen)" radius={[8, 8, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">Nu există date suficiente.</div>
                )}
              </div>
            </Card>

            <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 bg-white dark:bg-card/80 backdrop-blur-xl p-6 overflow-hidden rounded-[24px]">
               <div className="mb-8 flex items-center justify-between">
                 <div>
                    <h3 className="font-bold tracking-tight text-slate-800 text-lg">Demografice</h3>
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Distribuția pe Vârstă</p>
                 </div>
                 <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/10 flex items-center justify-center shadow-inner">
                    <Users className="w-6 h-6 text-purple-600" />
                 </div>
              </div>
              <div className="h-[260px] w-full">
                {loadingStats ? (
                  <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
                ) : statsData?.demographics?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                      <defs>
                        <linearGradient id="pie0" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#d946ef" stopOpacity={1}/>
                        </linearGradient>
                        <linearGradient id="pie1" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={1}/>
                        </linearGradient>
                        <linearGradient id="pie2" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#ec4899" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                      <Pie
                        data={statsData.demographics}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={8}
                        cornerRadius={10}
                        dataKey="value"
                        stroke="none"
                      >
                        {statsData.demographics.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={`url(#pie${index % 3})`} style={{ filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.1))' }} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} 
                        itemStyle={{ fontWeight: 800, color: '#0f172a' }} 
                        formatter={(value: number) => [value, "Pacienți"]}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '15px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">Nu există date suficiente.</div>
                )}
              </div>
            </Card>
          </div>

          <Card className="mb-8 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden bg-white dark:bg-card/80 backdrop-blur-xl rounded-[24px]">
            <div className="p-8 border-b border-slate-100/80 bg-slate-50/50">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">Tendințe Lunare</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100/80">
                    <th className="text-left py-5 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Luna</th>
                    <th className="text-right py-5 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Pacienți</th>
                    <th className="text-right py-5 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Programări</th>
                    <th className="text-right py-5 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Rata Finalizare</th>
                    <th className="text-right py-5 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Prog./Pacient</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {loadingStats ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-3">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <span className="font-bold text-xs uppercase tracking-widest text-primary">Se încarcă datele...</span>
                        </div>
                      </td>
                    </tr>
                  ) : statsData?.monthlyTrend.length ? (
                    statsData.monthlyTrend.map((stat, index) => (
                      <tr key={index} className="group hover:bg-slate-50/80 transition-colors">
                        <td className="py-5 px-8 text-sm font-extrabold text-slate-800">{stat.month}</td>
                        <td className="py-5 px-8 text-right text-sm font-bold tabular-nums text-slate-600">{stat.patients.toLocaleString()}</td>
                        <td className="py-5 px-8 text-right text-sm font-bold tabular-nums text-slate-600">{stat.appointments.toLocaleString()}</td>
                        <td className="py-5 px-8 text-right">
                          <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 text-primary font-black tabular-nums">
                            {stat.completionRate}%
                          </Badge>
                        </td>
                        <td className="py-5 px-8 text-right text-sm font-black tabular-nums text-primary">{stat.appointmentsPerPatient}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-500 font-medium">Nu există date disponibile</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Doctor Performance Table */}
          <Card className="mb-8 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden bg-white dark:bg-card/80 backdrop-blur-xl rounded-[24px]">
            <div className="p-8 border-b border-slate-100/80 bg-slate-50/50">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">Performanță Medici — Luna Curentă</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100/80">
                    <th className="text-left py-5 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Medic</th>
                    <th className="text-right py-5 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Total Prog.</th>
                    <th className="text-right py-5 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Finalizate</th>
                    <th className="text-right py-5 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Anulate</th>
                    <th className="text-right py-5 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Rata Finalizare</th>
                    <th className="text-right py-5 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Venituri</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {loadingStats ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <span className="font-bold text-xs uppercase tracking-widest text-primary">Se încarcă...</span>
                        </div>
                      </td>
                    </tr>
                  ) : statsData?.doctorPerformance?.length ? (
                    statsData.doctorPerformance.map((doc, i) => (
                      <tr key={i} className="group hover:bg-slate-50/80 transition-colors">
                        <td className="py-5 px-8 text-sm font-extrabold text-slate-800">{doc.name}</td>
                        <td className="py-5 px-8 text-right text-sm font-bold tabular-nums text-slate-600">{doc.total}</td>
                        <td className="py-5 px-8 text-right text-sm font-bold tabular-nums text-emerald-600">{doc.completed}</td>
                        <td className="py-5 px-8 text-right text-sm font-bold tabular-nums text-rose-500">{doc.cancelled}</td>
                        <td className="py-5 px-8 text-right">
                          <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 text-primary font-black tabular-nums">
                            {doc.completionRate}%
                          </Badge>
                        </td>
                        <td className="py-5 px-8 text-right text-sm font-black tabular-nums text-primary">{doc.revenue.toLocaleString("ro-RO")} lei</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-500 font-medium">Nu există programări înregistrate luna aceasta.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden bg-white dark:bg-card/80 backdrop-blur-xl rounded-[24px]">
            <div className="p-8 border-b border-slate-100/80 bg-slate-50/50">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">Rapoarte Generate</h2>
            </div>
            {generatedReports.length === 0 ? (
              <div className="p-20 text-center text-muted-foreground">
                <div className="w-20 h-20 rounded-[24px] bg-slate-100/80 flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <FileText className="w-10 h-10" />
                </div>
                <p className="font-extrabold text-slate-600 text-lg">Niciun raport generat în această sesiune.</p>
                <p className="text-sm font-medium mt-2 text-slate-500">Apasă pe <span className="font-bold text-primary">Generează Raport</span> pentru a exporta date.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100/80">
                {generatedReports.map((report) => (
                  <div key={report.id} className="group p-8 hover:bg-slate-50/80 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-6 flex-1">
                        <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-extrabold text-xl text-slate-800 group-hover:text-primary transition-colors">{report.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] font-bold uppercase tracking-widest">
                            <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 text-primary">
                              {report.type}
                            </Badge>
                            <div className="flex items-center gap-1.5 text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-lg">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{report.date}</span>
                            </div>
                            <Badge variant="secondary" className="rounded-lg bg-slate-800 text-white font-black border-none px-3">
                              {report.format}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" aria-label="Descarcă" className="rounded-[16px] w-12 h-12 hover:bg-primary/10 hover:text-primary transition-all bg-slate-50">
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
            <Button variant="ghost" onClick={() => setIsGenerateReportOpen(false)} disabled={generatingReport} className="h-12 rounded-2xl px-6 font-bold text-muted-foreground hover:bg-slate-100 hover:text-slate-900 transition-colors">
              Anulează
            </Button>
            <Button onClick={handleGenerateReport} disabled={generatingReport} className="gap-2 bg-gradient-to-r from-primary to-[#40A0D0] hover:from-[#1a4d5a] hover:to-[#206070] shadow-[0_8px_20px_rgb(32,96,112,0.25)] rounded-2xl h-12 px-8 font-bold text-white transition-all hover:-translate-y-1">
              {generatingReport ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Se generează...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
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
