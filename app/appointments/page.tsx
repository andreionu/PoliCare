"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, Search, Plus, Filter, Clock, User, Stethoscope } from 'lucide-react'
import { useState } from "react"

export default function AppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("Toate")

  const appointments = [
    {
      id: 1,
      patientName: "Maria Popescu",
      doctorName: "Dr. Ana Popescu",
      department: "Cardiologie",
      date: "2024-01-18",
      time: "09:00",
      duration: "30 min",
      status: "Confirmat",
      type: "Consultație"
    },
    {
      id: 2,
      patientName: "Ion Georgescu",
      doctorName: "Dr. Ion Marinescu",
      department: "ORL",
      date: "2024-01-18",
      time: "10:00",
      duration: "45 min",
      status: "În așteptare",
      type: "Control"
    },
    {
      id: 3,
      patientName: "Elena Ionescu",
      doctorName: "Dr. Maria Ionescu",
      department: "Oftalmologie",
      date: "2024-01-18",
      time: "11:30",
      duration: "30 min",
      status: "Confirmat",
      type: "Consultație"
    },
    {
      id: 4,
      patientName: "Andrei Dumitrescu",
      doctorName: "Dr. Andrei Popa",
      department: "Dermatologie",
      date: "2024-01-18",
      time: "14:00",
      duration: "30 min",
      status: "Confirmat",
      type: "Tratament"
    },
    {
      id: 5,
      patientName: "Ana Radu",
      doctorName: "Dr. Elena Dumitrescu",
      department: "Pediatrie",
      date: "2024-01-18",
      time: "15:00",
      duration: "20 min",
      status: "Anulat",
      type: "Consultație"
    },
    {
      id: 6,
      patientName: "Mihai Constantinescu",
      doctorName: "Dr. Ana Popescu",
      department: "Cardiologie",
      date: "2024-01-18",
      time: "16:00",
      duration: "45 min",
      status: "În așteptare",
      type: "Investigație"
    }
  ]

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Confirmat": return "default"
      case "În așteptare": return "secondary"
      case "Anulat": return "destructive"
      default: return "secondary"
    }
  }

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === "Toate" || apt.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1600px] mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-2">Programări</h1>
              <p className="text-muted-foreground">Gestionează programările și calendar</p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Programare Nouă
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Azi</p>
                  <p className="text-2xl font-semibold">{appointments.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confirmate</p>
                  <p className="text-2xl font-semibold">{appointments.filter(a => a.status === "Confirmat").length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">În Așteptare</p>
                  <p className="text-2xl font-semibold">{appointments.filter(a => a.status === "În așteptare").length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Anulate</p>
                  <p className="text-2xl font-semibold">{appointments.filter(a => a.status === "Anulat").length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-6 flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Caută pacient sau medic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {["Toate", "Confirmat", "În așteptare", "Anulat"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          {/* Appointments List */}
          <Card>
            <div className="divide-y">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{appointment.patientName}</span>
                        </div>
                        <Badge variant={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        <Badge variant="outline">{appointment.type}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4" />
                          <span>{appointment.doctorName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{appointment.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{appointment.time} ({appointment.duration})</span>
                        </div>
                        <div>
                          <span className="font-medium">{appointment.department}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        Vezi Detalii
                      </Button>
                      <Button variant="outline" size="sm">
                        Reprogramează
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
