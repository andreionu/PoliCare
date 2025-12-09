"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, TrendingUp, TrendingDown, Download, Calendar, Users, DollarSign, Activity } from 'lucide-react'

export default function ReportsPage() {
  const reports = [
    {
      id: 1,
      title: "Raport Financiar - Ianuarie 2024",
      type: "Financiar",
      date: "18 Ian 2024",
      status: "Generat",
      size: "2.4 MB",
      description: "Venituri, cheltuieli și profit lunar"
    },
    {
      id: 2,
      title: "Raport Pacienți - Q4 2023",
      type: "Pacienți",
      date: "15 Ian 2024",
      status: "Generat",
      size: "1.8 MB",
      description: "Statistici și demografie pacienți"
    },
    {
      id: 3,
      title: "Raport Performanță Medici",
      type: "Performanță",
      date: "12 Ian 2024",
      status: "Generat",
      size: "3.1 MB",
      description: "Evaluare activitate și rating medici"
    },
    {
      id: 4,
      title: "Raport Departamente - Decembrie",
      type: "Departamente",
      date: "10 Ian 2024",
      status: "În procesare",
      size: "-",
      description: "Analiză ocupare și eficiență"
    }
  ]

  const monthlyStats = [
    { month: "Ian", patients: 1245, revenue: 145000, appointments: 1580 },
    { month: "Feb", patients: 1180, revenue: 138000, appointments: 1520 },
    { month: "Mar", patients: 1320, revenue: 155000, appointments: 1680 },
    { month: "Apr", patients: 1290, revenue: 151000, appointments: 1640 },
    { month: "Mai", patients: 1410, revenue: 168000, appointments: 1750 },
    { month: "Iun", patients: 1380, revenue: 162000, appointments: 1720 }
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
            <Button className="gap-2">
              <FileText className="w-4 h-4" />
              Generează Raport
            </Button>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Venituri Luna Aceasta</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-semibold">168K</p>
                    <div className="flex items-center text-green-600 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>8%</span>
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
                  <p className="text-sm text-muted-foreground">Rata Ocupare</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-semibold">82%</p>
                    <div className="flex items-center text-red-600 text-sm">
                      <TrendingDown className="w-4 h-4" />
                      <span>3%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Monthly Trends */}
          <Card className="mb-8 p-6">
            <h2 className="text-xl font-semibold mb-6">Tendințe Lunare</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Luna</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Pacienți</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Venituri (RON)</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Programări</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Venit/Pacient</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.map((stat, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-4 px-4 font-medium">{stat.month}</td>
                      <td className="py-4 px-4 text-right">{stat.patients.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right">{stat.revenue.toLocaleString()} RON</td>
                      <td className="py-4 px-4 text-right">{stat.appointments.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right">{Math.round(stat.revenue / stat.patients)} RON</td>
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
                          <Badge variant={report.status === "Generat" ? "default" : "secondary"}>
                            {report.status}
                          </Badge>
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
    </AdminLayout>
  )
}
