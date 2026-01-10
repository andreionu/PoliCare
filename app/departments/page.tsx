"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Ear, Eye, Stethoscope, Baby, Plus, Users, Clock, Activity, Loader2, Building2 } from "lucide-react"
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
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

// Types
interface Department {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  status: string
  _count: {
    doctors: number
    appointments: number
  }
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart: Heart,
  Ear: Ear,
  Eye: Eye,
  Stethoscope: Stethoscope,
  Baby: Baby,
  Building2: Building2,
}

const colorMap: Record<string, string> = {
  red: "bg-red-100 text-red-600",
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  pink: "bg-pink-100 text-pink-600",
  yellow: "bg-yellow-100 text-yellow-600",
  orange: "bg-orange-100 text-orange-600",
}

export default function DepartmentsPage() {
  const { toast } = useToast()
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])

  const [departmentFormData, setDepartmentFormData] = useState({
    name: "",
    icon: "",
    color: "",
    description: "",
  })
  const [departmentErrors, setDepartmentErrors] = useState<Record<string, boolean>>({})

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setDepartments(data)
    } catch (error) {
      console.error("Error fetching departments:", error)
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca departamentele.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  // Stats
  const totalDepartments = departments.length
  const totalDoctors = departments.reduce((sum, d) => sum + (d._count?.doctors || 0), 0)
  const totalAppointments = departments.reduce((sum, d) => sum + (d._count?.appointments || 0), 0)

  const handleAddDepartment = async () => {
    const newErrors: Record<string, boolean> = {}
    if (!departmentFormData.name) newErrors.name = true

    if (Object.keys(newErrors).length > 0) {
      setDepartmentErrors(newErrors)
      toast({
        title: "Eroare validare",
        description: "Te rugăm să completezi toate câmpurile obligatorii.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: departmentFormData.name,
          description: departmentFormData.description || null,
          icon: departmentFormData.icon || null,
          color: departmentFormData.color || null,
          status: "ACTIV",
        }),
      })

      if (!response.ok) throw new Error("Failed to create department")

      await fetchDepartments()

      toast({
        title: "Departament adăugat",
        description: `Departamentul ${departmentFormData.name} a fost creat cu succes.`,
      })

      setIsAddDepartmentOpen(false)
      setDepartmentFormData({
        name: "",
        icon: "",
        color: "",
        description: "",
      })
      setDepartmentErrors({})
    } catch (error) {
      console.error("Error creating department:", error)
      toast({
        title: "Eroare",
        description: "Nu s-a putut crea departamentul.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Get icon component
  const getIcon = (iconName: string | null) => {
    if (!iconName || !iconMap[iconName]) return Building2
    return iconMap[iconName]
  }

  // Get color class
  const getColorClass = (color: string | null) => {
    if (!color || !colorMap[color]) return "bg-gray-100 text-gray-600"
    return colorMap[color]
  }

  // Get status display
  const getStatusDisplay = (status: string) => {
    return status === "ACTIV" ? "Activ" : "Inactiv"
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
                  <p className="text-2xl font-semibold">{totalDepartments}</p>
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
                  <p className="text-2xl font-semibold">{totalDoctors}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Programări</p>
                  <p className="text-2xl font-semibold">{totalAppointments}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departamente Active</p>
                  <p className="text-2xl font-semibold">
                    {departments.filter(d => d.status === "ACTIV").length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Departments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <Card className="p-8 text-center col-span-full">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Se încarcă departamentele...</p>
              </Card>
            ) : departments.length === 0 ? (
              <Card className="p-8 text-center col-span-full">
                <p className="text-muted-foreground">
                  Nu există departamente. Adaugă primul departament!
                </p>
              </Card>
            ) : (
              departments.map((department) => {
                const Icon = getIcon(department.icon)
                return (
                  <Card key={department.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl ${getColorClass(department.color)} flex items-center justify-center`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-xl mb-1">{department.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {department.description || "Fără descriere"}
                          </p>
                        </div>
                      </div>
                      <Badge variant={department.status === "ACTIV" ? "default" : "secondary"}>
                        {getStatusDisplay(department.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Medici</p>
                        <p className="text-2xl font-semibold">{department._count?.doctors || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Programări</p>
                        <p className="text-2xl font-semibold">{department._count?.appointments || 0}</p>
                      </div>
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
              })
            )}
          </div>
        </div>
      </div>

      <Dialog open={isAddDepartmentOpen} onOpenChange={setIsAddDepartmentOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adaugă Departament Nou</DialogTitle>
            <DialogDescription>Completează informațiile departamentului</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
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
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={departmentFormData.icon}
                onValueChange={(value) => {
                  setDepartmentFormData({ ...departmentFormData, icon: value })
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selectează iconița" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Heart">❤️ Inimă (Cardiologie)</SelectItem>
                  <SelectItem value="Eye">👁️ Ochi (Oftalmologie)</SelectItem>
                  <SelectItem value="Ear">👂 Ureche (ORL)</SelectItem>
                  <SelectItem value="Stethoscope">🩺 Stetoscop (General)</SelectItem>
                  <SelectItem value="Baby">👶 Bebeluș (Pediatrie)</SelectItem>
                  <SelectItem value="Building2">🏥 Clădire (Altele)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Color */}
            <div>
              <Label htmlFor="color">Culoare</Label>
              <Select
                value={departmentFormData.color}
                onValueChange={(value) => {
                  setDepartmentFormData({ ...departmentFormData, color: value })
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selectează culoarea" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">🔴 Roșu</SelectItem>
                  <SelectItem value="blue">🔵 Albastru</SelectItem>
                  <SelectItem value="green">🟢 Verde</SelectItem>
                  <SelectItem value="purple">🟣 Mov</SelectItem>
                  <SelectItem value="pink">💗 Roz</SelectItem>
                  <SelectItem value="yellow">🟡 Galben</SelectItem>
                  <SelectItem value="orange">🟠 Portocaliu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                placeholder="Descriere scurtă a departamentului..."
                value={departmentFormData.description}
                onChange={(e) => {
                  setDepartmentFormData({ ...departmentFormData, description: e.target.value })
                }}
                rows={3}
                className="resize-none mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDepartmentOpen(false)} disabled={saving}>
              Anulează
            </Button>
            <Button onClick={handleAddDepartment} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se salvează...
                </>
              ) : (
                "Adaugă Departament"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
