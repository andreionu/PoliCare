"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Heart, Ear, Eye, Stethoscope, Baby, Plus, Users, Clock, Activity } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function DepartmentsPage() {
  const { toast } = useToast()
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false)
  const [departmentFormData, setDepartmentFormData] = useState({
    name: "",
    icon: "",
    description: "",
  })
  const [departmentErrors, setDepartmentErrors] = useState<Record<string, boolean>>({})

  const departments = [
    {
      id: 1,
      name: "Cardiologie",
      icon: Heart,
      color: "bg-red-100 text-red-600",
      doctors: 3,
      patients: 245,
      occupancy: 85,
      avgWaitTime: "15 min",
      status: "Activ",
      description: "Diagnostic și tratament boli cardiovasculare",
    },
    {
      id: 2,
      name: "ORL",
      icon: Ear,
      color: "bg-blue-100 text-blue-600",
      doctors: 2,
      patients: 187,
      occupancy: 68,
      avgWaitTime: "10 min",
      status: "Activ",
      description: "Otorinolaringologie - diagnostic și tratament",
    },
    {
      id: 3,
      name: "Oftalmologie",
      icon: Eye,
      color: "bg-green-100 text-green-600",
      doctors: 2,
      patients: 298,
      occupancy: 92,
      avgWaitTime: "20 min",
      status: "Activ",
      description: "Îngrijire completă pentru sănătatea ochilor",
    },
    {
      id: 4,
      name: "Dermatologie",
      icon: Stethoscope,
      color: "bg-purple-100 text-purple-600",
      doctors: 2,
      patients: 176,
      occupancy: 72,
      avgWaitTime: "12 min",
      status: "Activ",
      description: "Tratamente pentru afecțiuni dermatologice",
    },
    {
      id: 5,
      name: "Pediatrie",
      icon: Baby,
      color: "bg-pink-100 text-pink-600",
      doctors: 3,
      patients: 310,
      occupancy: 78,
      avgWaitTime: "18 min",
      status: "Activ",
      description: "Îngrijire medicală specializată pentru copii",
    },
  ]

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy >= 90) return "text-red-600"
    if (occupancy >= 70) return "text-yellow-600"
    return "text-green-600"
  }

  const handleAddDepartment = () => {
    const newErrors: Record<string, boolean> = {}
    if (!departmentFormData.name) newErrors.name = true
    if (!departmentFormData.icon) newErrors.icon = true
    if (!departmentFormData.description) newErrors.description = true

    if (Object.keys(newErrors).length > 0) {
      setDepartmentErrors(newErrors)
      toast({
        title: "Eroare validare",
        description: "Te rugăm să completezi toate câmpurile obligatorii.",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] New department data:", departmentFormData)

    toast({
      title: "Departament adăugat",
      description: `Departamentul ${departmentFormData.name} a fost creat cu succes.`,
    })

    setIsAddDepartmentOpen(false)
    setDepartmentFormData({
      name: "",
      icon: "",
      description: "",
    })
    setDepartmentErrors({})
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1600px] mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-2">Departamente</h1>
              <p className="text-muted-foreground">Gestionează departamentele clinicii</p>
            </div>
            <Button className="gap-2" onClick={() => setIsAddDepartmentOpen(true)}>
              <Plus className="w-4 h-4" />
              Adaugă Departament
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Departamente</p>
                  <p className="text-2xl font-semibold">{departments.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Medici</p>
                  <p className="text-2xl font-semibold">{departments.reduce((sum, d) => sum + d.doctors, 0)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Pacienți</p>
                  <p className="text-2xl font-semibold">{departments.reduce((sum, d) => sum + d.patients, 0)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timp Mediu Așteptare</p>
                  <p className="text-2xl font-semibold">15 min</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Departments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {departments.map((department) => {
              const Icon = department.icon
              return (
                <Card key={department.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl ${department.color} flex items-center justify-center`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl mb-1">{department.name}</h3>
                        <p className="text-sm text-muted-foreground">{department.description}</p>
                      </div>
                    </div>
                    <Badge>{department.status}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Medici</p>
                      <p className="text-2xl font-semibold">{department.doctors}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Pacienți</p>
                      <p className="text-2xl font-semibold">{department.patients}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Timp Așteptare</p>
                      <p className="text-lg font-semibold">{department.avgWaitTime}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ocupare</span>
                      <span className={`font-semibold ${getOccupancyColor(department.occupancy)}`}>
                        {department.occupancy}%
                      </span>
                    </div>
                    <Progress value={department.occupancy} className="h-2" />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      Vezi Medici
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      Vezi Programări
                    </Button>
                    <Button size="sm">Gestionează</Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      <Dialog open={isAddDepartmentOpen} onOpenChange={setIsAddDepartmentOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adaugă Departament Nou</DialogTitle>
            <DialogDescription>Completează informațiile departamentului</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="dept-name">
                Nume departament <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dept-name"
                placeholder="ex: Neurologie"
                value={departmentFormData.name}
                onChange={(e) => {
                  setDepartmentFormData({ ...departmentFormData, name: e.target.value })
                  setDepartmentErrors({ ...departmentErrors, name: false })
                }}
                className={departmentErrors.name ? "border-destructive mt-2" : "mt-2"}
              />
              {departmentErrors.name && (
                <p className="text-sm text-destructive mt-1">Numele departamentului este obligatoriu</p>
              )}
            </div>

            {/* Icon */}
            <div>
              <Label htmlFor="icon">
                Icon <span className="text-destructive">*</span>
              </Label>
              <Select
                value={departmentFormData.icon}
                onValueChange={(value) => {
                  setDepartmentFormData({ ...departmentFormData, icon: value })
                  setDepartmentErrors({ ...departmentErrors, icon: false })
                }}
              >
                <SelectTrigger className={departmentErrors.icon ? "border-destructive mt-2" : "mt-2"}>
                  <SelectValue placeholder="Selectează iconița" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heart">❤️ Inimă</SelectItem>
                  <SelectItem value="brain">🧠 Creier</SelectItem>
                  <SelectItem value="eye">👁️ Ochi</SelectItem>
                  <SelectItem value="ear">👂 Ureche</SelectItem>
                  <SelectItem value="stethoscope">🩺 Stetoscop</SelectItem>
                  <SelectItem value="baby">👶 Bebeluș</SelectItem>
                </SelectContent>
              </Select>
              {departmentErrors.icon && <p className="text-sm text-destructive mt-1">Iconița este obligatorie</p>}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">
                Descriere <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Descriere scurtă a departamentului..."
                value={departmentFormData.description}
                onChange={(e) => {
                  setDepartmentFormData({ ...departmentFormData, description: e.target.value })
                  setDepartmentErrors({ ...departmentErrors, description: false })
                }}
                rows={3}
                className={departmentErrors.description ? "border-destructive resize-none mt-2" : "resize-none mt-2"}
              />
              {departmentErrors.description && (
                <p className="text-sm text-destructive mt-1">Descrierea este obligatorie</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDepartmentOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleAddDepartment}>Adaugă Departament</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
