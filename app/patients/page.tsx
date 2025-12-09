"use client"

import { useState } from "react"
import { Search, Plus, Filter, MoreVertical, Eye, Edit, Trash2, Phone, Mail, MapPin, X, Calendar, User, Clock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminLayout } from "@/components/admin-layout"

const patients = [
  {
    id: "PAT-001",
    name: "Ion Popescu",
    age: 45,
    gender: "Masculin",
    phone: "+40 723 456 789",
    email: "ion.popescu@email.com",
    address: "Str. Florilor 12, București",
    bloodType: "A+",
    lastVisit: "2024-01-15",
    status: "active",
    doctor: "Dr. Maria Ionescu",
    appointments: [
      { id: 1, date: "2024-01-15", time: "10:00", doctor: "Dr. Maria Ionescu", department: "Cardiologie", status: "completed", reason: "Control periodic" },
      { id: 2, date: "2024-01-25", time: "14:30", doctor: "Dr. Maria Ionescu", department: "Cardiologie", status: "scheduled", reason: "Consultație follow-up" },
      { id: 3, date: "2023-12-10", time: "09:00", doctor: "Dr. Andrei Popa", department: "Medicină Generală", status: "completed", reason: "Consultație generală" },
    ],
    medicalHistory: "Hipertensiune arterială, diabet tip 2 controlat",
    allergies: "Penicilină",
    insurance: "Regina Maria"
  },
  {
    id: "PAT-002",
    name: "Elena Dragomir",
    age: 32,
    gender: "Feminin",
    phone: "+40 734 567 890",
    email: "elena.d@email.com",
    address: "Bd. Unirii 45, București",
    bloodType: "B+",
    lastVisit: "2024-01-18",
    status: "active",
    doctor: "Dr. Andrei Popa",
    appointments: [
      { id: 4, date: "2024-01-18", time: "11:30", doctor: "Dr. Andrei Popa", department: "Dermatologie", status: "completed", reason: "Consultație dermatologică" },
      { id: 5, date: "2024-02-05", time: "15:00", doctor: "Dr. Andrei Popa", department: "Dermatologie", status: "scheduled", reason: "Control tratament" },
    ],
    medicalHistory: "Fără antecedente semnificative",
    allergies: "Niciuna",
    insurance: "Medicover"
  },
  {
    id: "PAT-003",
    name: "Mihai Constantin",
    age: 58,
    gender: "Masculin",
    phone: "+40 745 678 901",
    email: "mihai.c@email.com",
    address: "Str. Libertatii 89, Cluj-Napoca",
    bloodType: "O+",
    lastVisit: "2024-01-10",
    status: "inactive",
    doctor: "Dr. Maria Ionescu",
    appointments: [
      { id: 6, date: "2024-01-10", time: "08:30", doctor: "Dr. Maria Ionescu", department: "Cardiologie", status: "completed", reason: "EKG și ecografie cardiacă" },
      { id: 7, date: "2023-11-20", time: "10:00", doctor: "Dr. Maria Ionescu", department: "Cardiologie", status: "completed", reason: "Control cardiac" },
    ],
    medicalHistory: "Boală coronariană, infarct miocardic 2022",
    allergies: "Aspirină",
    insurance: "Regina Maria"
  },
  {
    id: "PAT-004",
    name: "Ana Marin",
    age: 27,
    gender: "Feminin",
    phone: "+40 756 789 012",
    email: "ana.marin@email.com",
    address: "Str. Pacii 23, Timișoara",
    bloodType: "AB+",
    lastVisit: "2024-01-20",
    status: "active",
    doctor: "Dr. Cristina Avram",
    appointments: [
      { id: 8, date: "2024-01-20", time: "16:00", doctor: "Dr. Cristina Avram", department: "Ginecologie", status: "completed", reason: "Control prenatal" },
      { id: 9, date: "2024-02-10", time: "09:30", doctor: "Dr. Cristina Avram", department: "Ginecologie", status: "scheduled", reason: "Ecografie" },
      { id: 10, date: "2024-03-10", time: "09:30", doctor: "Dr. Cristina Avram", department: "Ginecologie", status: "scheduled", reason: "Control prenatal" },
    ],
    medicalHistory: "Sarcină 20 săptămâni, evoluție normală",
    allergies: "Niciuna",
    insurance: "Sanitas"
  },
  {
    id: "PAT-005",
    name: "George Stanciu",
    age: 63,
    gender: "Masculin",
    phone: "+40 767 890 123",
    email: "g.stanciu@email.com",
    address: "Calea Victoriei 156, București",
    bloodType: "A-",
    lastVisit: "2024-01-12",
    status: "active",
    doctor: "Dr. Andrei Popa",
    appointments: [
      { id: 11, date: "2024-01-12", time: "13:00", doctor: "Dr. Andrei Popa", department: "Ortopdie", status: "completed", reason: "Dureri articulare" },
      { id: 12, date: "2024-02-15", time: "10:00", doctor: "Dr. Andrei Popa", department: "Ortopdie", status: "scheduled", reason: "Control tratament" },
    ],
    medicalHistory: "Artrită reumatoidă, osteoporoză",
    allergies: "Sulfonamide",
    insurance: "Regina Maria"
  },
  {
    id: "PAT-006",
    name: "Diana Florescu",
    age: 41,
    gender: "Feminin",
    phone: "+40 778 901 234",
    email: "diana.f@email.com",
    address: "Str. Mihai Eminescu 34, Iași",
    bloodType: "B-",
    lastVisit: "2024-01-08",
    status: "active",
    doctor: "Dr. Maria Ionescu",
    appointments: [
      { id: 13, date: "2024-01-08", time: "11:00", doctor: "Dr. Maria Ionescu", department: "Endocrinologie", status: "completed", reason: "Control tiroidă" },
      { id: 14, date: "2024-04-08", time: "11:00", doctor: "Dr. Maria Ionescu", department: "Endocrinologie", status: "scheduled", reason: "Control periodic" },
    ],
    medicalHistory: "Hipotiroidism",
    allergies: "Niciuna",
    insurance: "Medicover"
  }
]

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handlePatientClick = (patient: typeof patients[0]) => {
    setSelectedPatient(patient)
    setIsDrawerOpen(true)
  }

  const closeDrawer = () => {
    setIsDrawerOpen(false)
    setTimeout(() => setSelectedPatient(null), 300)
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">Pacienți</h1>
            <p className="text-muted-foreground">Gestionează pacienții și informațiile medicale</p>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută după nume, ID sau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-11">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toți pacienții</SelectItem>
                <SelectItem value="active">Activi</SelectItem>
                <SelectItem value="inactive">Inactivi</SelectItem>
              </SelectContent>
            </Select>

            <Button className="h-11 gap-2">
              <Plus className="h-4 w-4" />
              Adaugă pacient
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-5 border-border">
              <div className="text-sm font-medium text-muted-foreground mb-1">Total pacienți</div>
              <div className="text-2xl font-semibold text-foreground">{patients.length}</div>
            </Card>
            <Card className="p-5 border-border">
              <div className="text-sm font-medium text-muted-foreground mb-1">Pacienți activi</div>
              <div className="text-2xl font-semibold text-foreground">
                {patients.filter(p => p.status === "active").length}
              </div>
            </Card>
            <Card className="p-5 border-border">
              <div className="text-sm font-medium text-muted-foreground mb-1">Noi luna aceasta</div>
              <div className="text-2xl font-semibold text-foreground">8</div>
            </Card>
            <Card className="p-5 border-border">
              <div className="text-sm font-medium text-muted-foreground mb-1">Vârstă medie</div>
              <div className="text-2xl font-semibold text-foreground">
                {Math.round(patients.reduce((acc, p) => acc + p.age, 0) / patients.length)}
              </div>
            </Card>
          </div>

          {/* Patients Table */}
          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">ID</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Pacient</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Vârstă</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Contact</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Grupa sanguină</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Ultima vizită</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Medic</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient, index) => (
                    <tr 
                      key={patient.id}
                      onClick={() => handlePatientClick(patient)}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        <span className="text-sm font-medium text-foreground">{patient.id}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="text-sm font-medium text-foreground">{patient.name}</div>
                          <div className="text-xs text-muted-foreground">{patient.gender}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-foreground">{patient.age} ani</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {patient.phone}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {patient.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-mono">
                          {patient.bloodType}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-foreground">{patient.lastVisit}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-foreground">{patient.doctor}</span>
                      </td>
                      <td className="py-4 px-6">
                        <Badge 
                          variant={patient.status === "active" ? "default" : "secondary"}
                          className={patient.status === "active" 
                            ? "bg-success/10 text-success-foreground border-success/20" 
                            : ""}
                        >
                          {patient.status === "active" ? "Activ" : "Inactiv"}
                        </Badge>
                      </td>
                      <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handlePatientClick(patient)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editează
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Phone className="h-4 w-4 mr-2" />
                                Apelează
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Șterge
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Results count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Afișează {filteredPatients.length} din {patients.length} pacienți
          </div>
        </div>
      </div>

      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={closeDrawer}
          />
          
          {/* Drawer */}
          <div className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-card border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">{selectedPatient?.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selectedPatient?.id}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={closeDrawer}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Patient Info Card */}
                <Card className="p-5 border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Informații pacient</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Vârstă</p>
                      <p className="text-sm font-medium text-foreground">{selectedPatient?.age} ani</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Gen</p>
                      <p className="text-sm font-medium text-foreground">{selectedPatient?.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Grupa sanguină</p>
                      <Badge variant="outline" className="font-mono">{selectedPatient?.bloodType}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <Badge variant={selectedPatient?.status === "active" ? "default" : "secondary"}>
                        {selectedPatient?.status === "active" ? "Activ" : "Inactiv"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Telefon</p>
                        <p className="text-sm font-medium text-foreground">{selectedPatient?.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium text-foreground">{selectedPatient?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Adresă</p>
                        <p className="text-sm font-medium text-foreground">{selectedPatient?.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Medic de familie</p>
                        <p className="text-sm font-medium text-foreground">{selectedPatient?.doctor}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Medical Info Card */}
                <Card className="p-5 border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Informații medicale</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Istoric medical</p>
                      <p className="text-sm text-foreground">{selectedPatient?.medicalHistory}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Alergii</p>
                      <p className="text-sm text-foreground">{selectedPatient?.allergies}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Asigurare</p>
                      <p className="text-sm text-foreground">{selectedPatient?.insurance}</p>
                    </div>
                  </div>
                </Card>

                {/* Appointments Card */}
                <Card className="p-5 border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Programări</h3>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adaugă
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedPatient?.appointments.map((appointment) => (
                      <div 
                        key={appointment.id}
                        className="p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {appointment.date}
                            </span>
                            <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                            <span className="text-sm text-foreground">{appointment.time}</span>
                          </div>
                          <Badge 
                            variant={appointment.status === "completed" ? "secondary" : "default"}
                            className={appointment.status === "scheduled" 
                              ? "bg-primary/10 text-primary border-primary/20" 
                              : ""}
                          >
                            {appointment.status === "completed" ? "Finalizată" : "Programată"}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-foreground font-medium">{appointment.reason}</p>
                          <p className="text-xs text-muted-foreground">{appointment.doctor} • {appointment.department}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-border flex gap-3">
                <Button className="flex-1" size="lg">
                  <Edit className="h-4 w-4 mr-2" />
                  Editează pacient
                </Button>
                <Button variant="outline" size="lg" className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Programează
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
