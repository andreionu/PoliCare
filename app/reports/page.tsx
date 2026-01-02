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
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, TrendingUp, Download, Calendar, Users, Activity } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function ReportsPage() {
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false)
  const [reportFormData, setReportFormData] = useState({
    type: "",
    period: "",
    format: "",
    includeCharts: true,
    includeSummary: true,
  })
  const [reportErrors, setReportErrors] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const reports = [
    {
      id: 1,
      title: "Raport Pacienți - Ianuarie 2024",
      type: "Pacienți",
      date: "18 Ian 2024",
      status: "Generat",
      size: "2.4 MB",
      description: "Statistici și demografie pacienți",
    },
    {
      id: 2,
      title: "Raport Pacienți - Q4 2023",
      type: "Pacienți",
      date: "15 Ian 2024",
      status: "Generat",
      size: "1.8 MB",
      description: "Statistici și demografie pacienți trimestru 4",
    },
    {
      id: 3,
      title: "Raport Performanță Medici",
      type: "Performanță",
      date: "12 Ian 2024",
      status: "Generat",
      size: "3.1 MB",
      description: "Evaluare activitate și rating medici",
    },
    {
      id: 4,
      title: "Raport Departamente - Decembrie",
      type: "Departamente",
      date: "10 Ian 2024",
      status: "În procesare",
      size: "-",
      description: "Analiză ocupare și eficiență",
    },
  ]

  const monthlyStats = [
    { month: "Ian", patients: 1245, appointments: 1580, completionRate: 92 },
    { month: "Feb", patients: 1180, appointments: 1520, completionRate: 89 },
    { month: "Mar", patients: 1320, appointments: 1680, completionRate: 94 },
    { month: "Apr", patients: 1290, appointments: 1640, completionRate: 91 },
    { month: "Mai", patients: 1410, appointments: 1750, completionRate: 95 },
    { month: "Iun", patients: 1380, appointments: 1720, completionRate: 93 },
  ]

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
                    <p className="text-2xl font-semibold">1,410</p>
                    <div className="flex items-center text-green-600 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>12%</span>
                    </div>
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
                    <p className="text-2xl font-semibold">1,750</p>
                    <div className="flex items-center text-green-600 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>5%</span>
                    </div>
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
                    <p className="text-2xl font-semibold">93%</p>
                    <div className="flex items-center text-green-600 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>2%</span>
                    </div>
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
                  {monthlyStats.map((stat, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-4 px-4 font-medium">{stat.month}</td>
                      <td className="py-4 px-4 text-right">{stat.patients.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right">{stat.appointments.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right">{stat.completionRate}%</td>
                      <td className="py-4 px-4 text-right">{(stat.appointments / stat.patients).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Reports List */}
          <Card>
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Rapoarte Generate</h2>
            </div>
            <div className="divide-y">
              {reports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{report.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <Badge variant="outline">{report.type}</Badge>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{report.date}</span>
                          </div>
                          {report.size !== "-" && <span>{report.size}</span>}
                          <Badge variant={report.status === "Generat" ? "default" : "secondary"}>{report.status}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" disabled={report.status !== "Generat"}>
                        Vizualizează
                      </Button>
                      <Button size="sm" className="gap-2" disabled={report.status !== "Generat"}>
                        <Download className="w-4 h-4" />
                        Descarcă
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Report Generation Modal */}
      <Dialog open={isGenerateReportOpen} onOpenChange={setIsGenerateReportOpen}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Generează Raport Nou</DialogTitle>
            <DialogDescription>Selectează tipul și perioada pentru raportul dorit</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label htmlFor="reportType">
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
                  <SelectItem value="financial">Raport Activitate</SelectItem>
                </SelectContent>
              </Select>
              {reportErrors.type && <p className="text-sm text-destructive mt-1">Tipul raportului este obligatoriu</p>}
            </div>

            <div>
              <Label htmlFor="period">
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
                  <SelectItem value="current-quarter">Trimestrul curent</SelectItem>
                  <SelectItem value="last-quarter">Trimestrul trecut</SelectItem>
                  <SelectItem value="current-year">Anul curent</SelectItem>
                  <SelectItem value="last-year">Anul trecut</SelectItem>
                  <SelectItem value="custom">Perioadă personalizată</SelectItem>
                </SelectContent>
              </Select>
              {reportErrors.period && <p className="text-sm text-destructive mt-1">Perioada este obligatorie</p>}
            </div>

            <div>
              <Label htmlFor="format">
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
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel (XLSX)</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
              {reportErrors.format && <p className="text-sm text-destructive mt-1">Formatul este obligatoriu</p>}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label>Opțiuni suplimentare</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={reportFormData.includeCharts}
                  onCheckedChange={(checked) =>
                    setReportFormData({ ...reportFormData, includeCharts: checked as boolean })
                  }
                />
                <label
                  htmlFor="includeCharts"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include grafice și vizualizări
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSummary"
                  checked={reportFormData.includeSummary}
                  onCheckedChange={(checked) =>
                    setReportFormData({ ...reportFormData, includeSummary: checked as boolean })
                  }
                />
                <label
                  htmlFor="includeSummary"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include rezumat executiv
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateReportOpen(false)}>
              Anulează
            </Button>
            <Button
              onClick={() => {
                const newErrors: Record<string, boolean> = {}
                if (!reportFormData.type) newErrors.type = true
                if (!reportFormData.period) newErrors.period = true
                if (!reportFormData.format) newErrors.format = true

                if (Object.keys(newErrors).length > 0) {
                  setReportErrors(newErrors)
                  toast({
                    title: "Eroare validare",
                    description: "Te rugăm să completezi toate câmpurile obligatorii.",
                    variant: "destructive",
                  })
                  return
                }

                console.log("[v0] Generating report:", reportFormData)

                toast({
                  title: "Raport în generare",
                  description: "Raportul tău este în proces de generare. Vei primi o notificare când este gata.",
                })

                setIsGenerateReportOpen(false)
                setReportFormData({
                  type: "",
                  period: "",
                  format: "",
                  includeCharts: true,
                  includeSummary: true,
                })
                setReportErrors({})
              }}
            >
              Generează Raport
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
