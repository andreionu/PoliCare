"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  X,
  Calendar,
  User,
  Clock,
  Activity,
  FileText,
  Download,
  Stethoscope,
  AlertCircle,
  Shield,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminLayout } from "@/components/admin-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

const patients = [
  {
    id: "P-2024-001",
    name: "Ana Popescu",
    age: 34,
    gender: "F",
    bloodType: "A+",
    phone: "+40 712 345 678",
    email: "ana.popescu@email.com",
    address: "Str. Mihai Eminescu, Nr. 24, București",
    lastVisit: "15 Ian 2024",
    doctor: "Dr. Maria Ionescu",
    status: "active",
    medicalHistory: "Diabet tip 2 diagnosticat în 2019, controlat cu medicație",
    allergies: "Penicilină, Polen",
    insurance: "Regina Maria - Plan Premium",
    photo: "/professional-woman-portrait.png",
    medicalTimeline: [
      {
        id: 1,
        date: "15 Ian 2024",
        diagnosis: "Control diabet - Glicemie normală",
        doctor: "Dr. Maria Ionescu",
        department: "Endocrinologie",
        notes: "Pacient prezintă rezultate bune, glicemie 105 mg/dl. Continuă tratamentul actual.",
        prescription: "Metformin 500mg - 2x/zi",
      },
      {
        id: 2,
        date: "10 Dec 2023",
        diagnosis: "Consultație cardiologie - EKG normal",
        doctor: "Dr. Andrei Radu",
        department: "Cardiologie",
        notes: "EKG în limite normale. Tensiune 125/80. Recomandat control anual.",
        prescription: "Nu necesită medicație cardiacă",
      },
      {
        id: 3,
        date: "22 Nov 2023",
        diagnosis: "Analize de rutină - Hemoleucogramă completă",
        doctor: "Dr. Maria Ionescu",
        department: "Laborator",
        notes: "Toate valorile în parametri normali. Colesterol HDL ușor crescut.",
        prescription: "Dietă săracă în grăsimi saturate",
      },
    ],
    upcomingAppointments: [
      {
        id: 1,
        date: "28 Ian 2024",
        time: "10:00",
        reason: "Control trimestrial diabet",
        doctor: "Dr. Maria Ionescu",
        department: "Endocrinologie",
        status: "confirmed",
      },
      {
        id: 2,
        date: "15 Feb 2024",
        time: "14:30",
        reason: "Analize sânge - HbA1c",
        doctor: "Laborator",
        department: "Analize medicale",
        status: "pending",
      },
    ],
    documents: [
      {
        id: 1,
        name: "Analize_sange_15_Ian_2024.pdf",
        type: "Lab Results",
        date: "15 Ian 2024",
        size: "245 KB",
      },
      {
        id: 2,
        name: "EKG_10_Dec_2023.pdf",
        type: "Cardiology",
        date: "10 Dec 2023",
        size: "1.2 MB",
      },
      {
        id: 3,
        name: "Radiografie_toracica_05_Nov_2023.jpg",
        type: "X-Ray",
        date: "05 Nov 2023",
        size: "3.8 MB",
      },
      {
        id: 4,
        name: "Prescriptie_medicala_curent.pdf",
        type: "Prescription",
        date: "15 Ian 2024",
        size: "128 KB",
      },
    ],
    appointments: [
      {
        id: 1,
        date: "15 Ian 2024",
        time: "10:00",
        reason: "Control diabet",
        doctor: "Dr. Maria Ionescu",
        department: "Endocrinologie",
        status: "completed",
      },
      {
        id: 2,
        date: "28 Ian 2024",
        time: "10:00",
        reason: "Control trimestrial",
        doctor: "Dr. Maria Ionescu",
        department: "Endocrinologie",
        status: "scheduled",
      },
    ],
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
      {
        id: 4,
        date: "2024-01-18",
        time: "11:30",
        doctor: "Dr. Andrei Popa",
        department: "Dermatologie",
        status: "completed",
        reason: "Consultație dermatologică",
      },
      {
        id: 5,
        date: "2024-02-05",
        time: "15:00",
        doctor: "Dr. Andrei Popa",
        department: "Dermatologie",
        status: "scheduled",
        reason: "Control tratament",
      },
    ],
    medicalHistory: "Fără antecedente semnificative",
    allergies: "Niciuna",
    insurance: "Medicover",
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
      {
        id: 6,
        date: "2024-01-10",
        time: "08:30",
        doctor: "Dr. Maria Ionescu",
        department: "Cardiologie",
        status: "completed",
        reason: "EKG și ecografie cardiacă",
      },
      {
        id: 7,
        date: "2023-11-20",
        time: "10:00",
        doctor: "Dr. Maria Ionescu",
        department: "Cardiologie",
        status: "completed",
        reason: "Control cardiac",
      },
    ],
    medicalHistory: "Boală coronariană, infarct miocardic 2022",
    allergies: "Aspirină",
    insurance: "Regina Maria",
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
      {
        id: 8,
        date: "2024-01-20",
        time: "16:00",
        doctor: "Dr. Cristina Avram",
        department: "Ginecologie",
        status: "completed",
        reason: "Control prenatal",
      },
      {
        id: 9,
        date: "2024-02-10",
        time: "09:30",
        doctor: "Dr. Cristina Avram",
        department: "Ginecologie",
        status: "scheduled",
        reason: "Ecografie",
      },
      {
        id: 10,
        date: "2024-03-10",
        time: "09:30",
        doctor: "Dr. Cristina Avram",
        department: "Ginecologie",
        status: "scheduled",
        reason: "Control prenatal",
      },
    ],
    medicalHistory: "Sarcină 20 săptămâni, evoluție normală",
    allergies: "Niciuna",
    insurance: "Sanitas",
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
      {
        id: 11,
        date: "2024-01-12",
        time: "13:00",
        doctor: "Dr. Andrei Popa",
        department: "Ortopdie",
        status: "completed",
        reason: "Dureri articulare",
      },
      {
        id: 12,
        date: "2024-02-15",
        time: "10:00",
        doctor: "Dr. Andrei Popa",
        department: "Ortopdie",
        status: "scheduled",
        reason: "Control tratament",
      },
    ],
    medicalHistory: "Artrită reumatoidă, osteoporoză",
    allergies: "Sulfonamide",
    insurance: "Regina Maria",
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
      {
        id: 13,
        date: "2024-01-08",
        time: "11:00",
        doctor: "Dr. Maria Ionescu",
        department: "Endocrinologie",
        status: "completed",
        reason: "Control tiroidă",
      },
      {
        id: 14,
        date: "2024-04-08",
        time: "11:00",
        doctor: "Dr. Maria Ionescu",
        department: "Endocrinologie",
        status: "scheduled",
        reason: "Control periodic",
      },
    ],
    medicalHistory: "Hipotiroidism",
    allergies: "Niciuna",
    insurance: "Medicover",
  },
]

export default function PatientsPage() {
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedPatient, setSelectedPatient] = useState<(typeof patients)[0] | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("medical-history")
  const [patientFormData, setPatientFormData] = useState({
    cnp: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    gender: "",
    bloodType: "",
  })
  const [patientErrors, setPatientErrors] = useState<Record<string, boolean>>({})

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handlePatientClick = (patient: (typeof patients)[0]) => {
    setSelectedPatient(patient)
    setIsDrawerOpen(true)
  }

  const closeDrawer = () => {
    setIsDrawerOpen(false)
    setTimeout(() => setSelectedPatient(null), 300)
  }

  const handleAddPatient = () => {
    const newErrors: Record<string, boolean> = {}
    if (!patientFormData.cnp) newErrors.cnp = true
    if (!patientFormData.name) newErrors.name = true
    if (!patientFormData.email) newErrors.email = true
    if (!patientFormData.phone) newErrors.phone = true
    if (!patientFormData.address) newErrors.address = true

    if (Object.keys(newErrors).length > 0) {
      setPatientErrors(newErrors)
      toast({
        title: "Eroare validare",
        description: "Te rugăm să completezi toate câmpurile obligatorii.",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] New patient data:", patientFormData)

    toast({
      title: "Pacient adăugat",
      description: `${patientFormData.name} a fost adăugat cu succes în sistem.`,
    })

    setIsAddPatientOpen(false)
    setPatientFormData({ cnp: "", name: "", email: "", phone: "", address: "", gender: "", bloodType: "" })
    setPatientErrors({})
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

            <Button className="h-11 gap-2" onClick={() => setIsAddPatientOpen(true)}>
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
                {patients.filter((p) => p.status === "active").length}
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
                          className={
                            patient.status === "active" ? "bg-success/10 text-success-foreground border-success/20" : ""
                          }
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

      {/* Updated modal to use Dialog component with rounded corners */}
      <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Înregistrare Pacient Nou</DialogTitle>
            <DialogDescription>Completează datele pacientului</DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {/* CNP */}
            <div>
              <Label htmlFor="cnp">
                CNP (Cod Numeric Personal) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cnp"
                placeholder="1234567890123"
                maxLength={13}
                value={patientFormData.cnp}
                onChange={(e) => {
                  setPatientFormData({ ...patientFormData, cnp: e.target.value })
                  setPatientErrors({ ...patientErrors, cnp: false })
                }}
                className={`mt-2 ${patientErrors.cnp ? "border-destructive" : ""}`}
              />
              {patientErrors.cnp && <p className="text-sm text-destructive mt-1">CNP-ul este obligatoriu</p>}
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="patient-name">
                Nume complet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="patient-name"
                placeholder="Ion Popescu"
                value={patientFormData.name}
                onChange={(e) => {
                  setPatientFormData({ ...patientFormData, name: e.target.value })
                  setPatientErrors({ ...patientErrors, name: false })
                }}
                className={`mt-2 ${patientErrors.name ? "border-destructive" : ""}`}
              />
              {patientErrors.name && <p className="text-sm text-destructive mt-1">Numele este obligatoriu</p>}
            </div>

            {/* Gender and Blood Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Gen</Label>
                <Select
                  value={patientFormData.gender}
                  onValueChange={(value) => setPatientFormData({ ...patientFormData, gender: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selectează" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculin">Masculin</SelectItem>
                    <SelectItem value="Feminin">Feminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bloodType">Grupă sanguină</Label>
                <Select
                  value={patientFormData.bloodType}
                  onValueChange={(value) => setPatientFormData({ ...patientFormData, bloodType: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selectează" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="patient-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="patient-email"
                type="email"
                placeholder="pacient@email.com"
                value={patientFormData.email}
                onChange={(e) => {
                  setPatientFormData({ ...patientFormData, email: e.target.value })
                  setPatientErrors({ ...patientErrors, email: false })
                }}
                className={`mt-2 ${patientErrors.email ? "border-destructive" : ""}`}
              />
              {patientErrors.email && <p className="text-sm text-destructive mt-1">Email-ul este obligatoriu</p>}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="patient-phone">
                Telefon <span className="text-destructive">*</span>
              </Label>
              <Input
                id="patient-phone"
                type="tel"
                placeholder="+40 723 456 789"
                value={patientFormData.phone}
                onChange={(e) => {
                  setPatientFormData({ ...patientFormData, phone: e.target.value })
                  setPatientErrors({ ...patientErrors, phone: false })
                }}
                className={`mt-2 ${patientErrors.phone ? "border-destructive" : ""}`}
              />
              {patientErrors.phone && <p className="text-sm text-destructive mt-1">Telefonul este obligatoriu</p>}
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address">
                Adresă <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="address"
                placeholder="Strada, număr, oraș, județ"
                value={patientFormData.address}
                onChange={(e) => {
                  setPatientFormData({ ...patientFormData, address: e.target.value })
                  setPatientErrors({ ...patientErrors, address: false })
                }}
                className={`mt-2 ${patientErrors.address ? "border-destructive resize-none" : "resize-none"}`}
                rows={2}
              />
              {patientErrors.address && <p className="text-sm text-destructive mt-1">Adresa este obligatorie</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPatientOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleAddPatient}>Înregistrează Pacient</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={closeDrawer} />

          {/* Drawer */}
          <div
            className={`fixed right-0 top-0 h-full w-full max-w-5xl bg-card border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedPatient?.photo || "/placeholder.svg"}
                    alt={selectedPatient?.name}
                    className="h-16 w-16 rounded-full object-cover border-2 border-primary"
                  />
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{selectedPatient?.name}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{selectedPatient?.id}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={closeDrawer}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Drawer Content - Two Column Layout */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-3 gap-6 p-6 h-full">
                  {/* Left Column - Patient Info */}
                  <div className="col-span-1 space-y-4">
                    <Card className="p-5 border-border">
                      <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Informații pacient
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Vârstă</p>
                            <p className="text-lg font-semibold text-foreground">{selectedPatient?.age}</p>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Gen</p>
                            <p className="text-lg font-semibold text-foreground">{selectedPatient?.gender}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Grupa sanguină</p>
                          <Badge variant="outline" className="font-mono text-base px-3 py-1">
                            {selectedPatient?.bloodType}
                          </Badge>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Status</p>
                          <Badge variant={selectedPatient?.status === "active" ? "default" : "secondary"}>
                            {selectedPatient?.status === "active" ? "Activ" : "Inactiv"}
                          </Badge>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-5 border-border">
                      <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        Contact
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                          <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Telefon</p>
                            <p className="text-sm font-medium text-foreground">{selectedPatient?.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                          <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm font-medium text-foreground break-all">{selectedPatient?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Adresă</p>
                            <p className="text-sm font-medium text-foreground">{selectedPatient?.address}</p>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-5 border-border">
                      <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        Informații medicale
                      </h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Heart className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Istoric medical</p>
                          </div>
                          <p className="text-sm text-foreground">{selectedPatient?.medicalHistory}</p>
                        </div>
                        <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="h-3 w-3 text-destructive" />
                            <p className="text-xs text-destructive font-medium">Alergii</p>
                          </div>
                          <p className="text-sm text-foreground">{selectedPatient?.allergies}</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Asigurare</p>
                          </div>
                          <p className="text-sm text-foreground">{selectedPatient?.insurance}</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Right Column - Tabbed Content */}
                  <div className="col-span-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                      <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="medical-history" className="gap-2">
                          <Activity className="h-4 w-4" />
                          Istoric medical
                        </TabsTrigger>
                        <TabsTrigger value="upcoming" className="gap-2">
                          <Calendar className="h-4 w-4" />
                          Programări viitoare
                        </TabsTrigger>
                        <TabsTrigger value="documents" className="gap-2">
                          <FileText className="h-4 w-4" />
                          Documente
                        </TabsTrigger>
                      </TabsList>

                      {/* Medical History Timeline */}
                      <TabsContent value="medical-history" className="flex-1 overflow-y-auto">
                        <Card className="p-6 border-border h-full">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-foreground">Istoric consultații</h3>
                            <Badge variant="outline" className="gap-1">
                              <Activity className="h-3 w-3" />
                              {selectedPatient?.medicalTimeline.length} consultații
                            </Badge>
                          </div>

                          {/* Timeline */}
                          <div className="relative space-y-6">
                            {/* Timeline Line */}
                            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

                            {selectedPatient?.medicalTimeline.map((visit, index) => (
                              <div key={visit.id} className="relative pl-12">
                                {/* Timeline Dot */}
                                <div className="absolute left-0 top-1 h-8 w-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                                  <Stethoscope className="h-4 w-4 text-primary" />
                                </div>

                                {/* Visit Card */}
                                <Card className="p-4 border-border hover:shadow-md transition-shadow bg-card">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">{visit.date}</p>
                                      <h4 className="text-base font-semibold text-foreground">{visit.diagnosis}</h4>
                                    </div>
                                    <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                                      <FileText className="h-3 w-3" />
                                      Raport
                                    </Button>
                                  </div>

                                  <div className="space-y-2 mb-3">
                                    <div className="flex items-center gap-2 text-sm">
                                      <User className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-foreground font-medium">{visit.doctor}</span>
                                      <span className="text-muted-foreground">•</span>
                                      <span className="text-muted-foreground">{visit.department}</span>
                                    </div>
                                  </div>

                                  <div className="p-3 bg-muted/20 rounded-lg mb-2">
                                    <p className="text-sm text-foreground">{visit.notes}</p>
                                  </div>

                                  {visit.prescription && (
                                    <div className="flex items-start gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                                      <FileText className="h-4 w-4 text-primary mt-0.5" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Prescripție</p>
                                        <p className="text-sm text-foreground font-medium">{visit.prescription}</p>
                                      </div>
                                    </div>
                                  )}
                                </Card>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </TabsContent>

                      {/* Upcoming Appointments */}
                      <TabsContent value="upcoming" className="flex-1 overflow-y-auto">
                        <Card className="p-6 border-border h-full">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-foreground">Programări viitoare</h3>
                            <Button size="sm" className="gap-2">
                              <Plus className="h-4 w-4" />
                              Programare nouă
                            </Button>
                          </div>

                          <div className="space-y-4">
                            {selectedPatient?.upcomingAppointments.map((appointment) => (
                              <Card
                                key={appointment.id}
                                className="p-5 border-border hover:shadow-md transition-shadow bg-card"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                      <Calendar className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-base font-semibold text-foreground">
                                          {appointment.date}
                                        </span>
                                        <Badge
                                          variant={appointment.status === "confirmed" ? "default" : "secondary"}
                                          className={
                                            appointment.status === "confirmed"
                                              ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                              : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                                          }
                                        >
                                          {appointment.status === "confirmed" ? "Confirmată" : "În așteptare"}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>{appointment.time}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="pl-15">
                                  <p className="text-base font-medium text-foreground mb-2">{appointment.reason}</p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span className="font-medium text-foreground">{appointment.doctor}</span>
                                    <span>•</span>
                                    <span>{appointment.department}</span>
                                  </div>

                                  <div className="flex gap-2 mt-4">
                                    <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                                      <Edit className="h-3 w-3" />
                                      Modifică
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-2 text-destructive hover:text-destructive bg-transparent"
                                    >
                                      <X className="h-3 w-3" />
                                      Anulează
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}

                            {selectedPatient?.upcomingAppointments.length === 0 && (
                              <div className="text-center py-12">
                                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <p className="text-muted-foreground">Nu există programări viitoare</p>
                                <Button size="sm" className="mt-4 gap-2">
                                  <Plus className="h-4 w-4" />
                                  Adaugă programare
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      </TabsContent>

                      {/* Documents */}
                      <TabsContent value="documents" className="flex-1 overflow-y-auto">
                        <Card className="p-6 border-border h-full">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-foreground">Documente medicale</h3>
                            <Button size="sm" className="gap-2">
                              <Plus className="h-4 w-4" />
                              Încarcă document
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {selectedPatient?.documents.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors group"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                      {doc.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                      <Badge variant="outline" className="text-xs">
                                        {doc.type}
                                      </Badge>
                                      <span>•</span>
                                      <span>{doc.date}</span>
                                      <span>•</span>
                                      <span>{doc.size}</span>
                                    </div>
                                  </div>
                                </div>

                                <Button size="sm" variant="ghost" className="gap-2">
                                  <Download className="h-4 w-4" />
                                  Descarcă
                                </Button>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-border flex gap-3 bg-muted/20">
                <Button className="flex-1" size="lg">
                  <Edit className="h-4 w-4 mr-2" />
                  Editează pacient
                </Button>
                <Button variant="outline" size="lg" className="flex-1 bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Programare nouă
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
