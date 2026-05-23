"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  HeartPulse, 
  Ear, 
  Eye, 
  Stethoscope, 
  Baby, 
  Plus, 
  Users, 
  Clock, 
  Activity, 
  Loader2, 
  Building2, 
  ArrowRight,
  Sparkles,
  Smile,
  Flower2,
  ChevronRight,
  TrendingUp,
  LayoutGrid
} from "lucide-react"
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
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

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

// Premium Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart: HeartPulse,
  Ear: Ear,
  Eye: Eye,
  Stethoscope: Stethoscope,
  Baby: Baby,
  Building2: Building2,
  Sparkles: Sparkles,
  Smile: Smile,
  Flower2: Flower2,
}

const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
  rose: { bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-100 dark:bg-rose-500/20" },
  blue: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-500/20" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-500/20" },
  purple: { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-100 dark:bg-purple-500/20" },
  pink: { bg: "bg-pink-50 dark:bg-pink-500/10", text: "text-pink-600 dark:text-pink-400", iconBg: "bg-pink-100 dark:bg-pink-500/20" },
  amber: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-500/20" },
  cyan: { bg: "bg-cyan-50 dark:bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", iconBg: "bg-cyan-100 dark:bg-cyan-500/20" },
}

export default function DepartmentsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false)
  const [isEditDepartmentOpen, setIsEditDepartmentOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])

  const [departmentFormData, setDepartmentFormData] = useState({
    name: "",
    icon: "Stethoscope",
    color: "blue",
    description: "",
  })
  const [departmentErrors, setDepartmentErrors] = useState<Record<string, boolean>>({})

  const [editFormData, setEditFormData] = useState({
    name: "",
    icon: "",
    color: "",
    description: "",
    status: "ACTIV",
  })
  const [editErrors, setEditErrors] = useState<Record<string, boolean>>({})

  // Fetch departments 
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

  const handleAddDepartment = async () => {
    const errors: Record<string, boolean> = {}
    if (!departmentFormData.name) errors.name = true
    
    if (Object.keys(errors).length > 0) {
      setDepartmentErrors(errors)
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(departmentFormData),
      })
      if (!response.ok) throw new Error("Failed to add")
      
      toast({ title: "Succes", description: "Departamentul a fost creat." })
      setIsAddDepartmentOpen(false)
      setDepartmentFormData({ name: "", icon: "Stethoscope", color: "blue", description: "" })
      fetchDepartments()
    } catch (e) {
      toast({ title: "Eroare", description: "Nu s-a putut crea departamentul.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleEditDepartment = async () => {
    if (!editingDepartment) return
    const errors: Record<string, boolean> = {}
    if (!editFormData.name) errors.name = true
    
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/departments/${editingDepartment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      })
      if (!response.ok) throw new Error("Failed to update")
      
      toast({ title: "Succes", description: "Departamentul a fost actualizat." })
      setIsEditDepartmentOpen(false)
      fetchDepartments()
    } catch (e) {
      toast({ title: "Eroare", description: "Nu s-a putut actualiza departamentul.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (dept: Department) => {
    setEditingDepartment(dept)
    setEditFormData({
      name: dept.name,
      icon: dept.icon || "Stethoscope",
      color: dept.color || "blue",
      description: dept.description || "",
      status: dept.status,
    })
    setIsEditDepartmentOpen(true)
  }

  const getIcon = (iconName: string | null) => iconMap[iconName || "Stethoscope"] || Stethoscope
  const getColor = (colorName: string | null) => colorMap[colorName || "blue"] || colorMap.blue

  const stats = useMemo(() => {
    return {
      total: departments.length,
      active: departments.filter(d => d.status === "ACTIV").length,
      capacity: departments.reduce((acc, d) => acc + (d._count?.doctors || 0), 0)
    }
  }, [departments])

  return (
    <>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-xs font-semibold mb-4 border border-primary/10 uppercase tracking-wider">
                Management Portal
              </div>
              <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">Departamente</h1>
              <p className="text-muted-foreground text-lg italic">Organizarea structurii clinicii și a specialităților medicale.</p>
            </div>
            <Button 
              className="gap-2 h-11 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all rounded-xl font-bold text-white" 
              onClick={() => setIsAddDepartmentOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Departament Nou
            </Button>
          </div>

          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Total Unități", val: stats.total, icon: LayoutGrid, color: "text-primary", bg: "bg-primary/5", shadow: "shadow-primary/10" },
              { label: "Unități Active", val: stats.active, icon: Activity, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15", shadow: "shadow-emerald-200 dark:shadow-none" },
              { label: "Medici Alocați", val: stats.capacity, icon: Users, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/15", shadow: "shadow-indigo-200 dark:shadow-none" },
            ].map((stat, i) => (
              <Card key={i} className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm rounded-2xl">
                <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity", stat.bg)} />
                <div className="flex items-center gap-4 relative z-10">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", stat.bg, stat.shadow)}>
                    <stat.icon className={cn("w-7 h-7", stat.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <p className={cn("text-3xl font-bold tracking-tight", stat.color)}>{loading ? "..." : stat.val}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Departments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-white dark:bg-card/50 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-700/30 shadow-sm" />
              ))
            ) : departments.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-card/50 rounded-2xl border border-border/50">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-800/30 flex items-center justify-center mb-6">
                  <Building2 className="w-10 h-10 text-slate-200 dark:text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Niciun departament găsit</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8">Nu am găsit niciun departament configurat în acest moment.</p>
                <Button 
                  onClick={() => setIsAddDepartmentOpen(true)}
                  className="h-11 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/10 rounded-xl font-bold text-white transition-all"
                >
                  Configurează primul departament
                </Button>
              </div>
            ) : (
              departments.map((dept) => {
                const Icon = getIcon(dept.icon)
                const theme = getColor(dept.color)
                return (
                  <Card 
                    key={dept.id} 
                    className="group relative bg-white dark:bg-card/50 rounded-2xl border border-border/50 p-6 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 flex flex-col"
                  >
                    <div className="flex-1 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-sm", theme.bg)}>
                          <Icon className={cn("w-7 h-7", theme.text)} />
                        </div>
                        <Badge className={cn(
                          "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border shadow-sm transition-all",
                          dept.status === "ACTIV"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20"
                            : "bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-500/15 dark:text-slate-500 dark:border-slate-500/20"
                        )}>
                          {dept.status === "ACTIV" ? "Activ" : "Inactiv"}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{dept.name}</h3>
                        <p className="text-muted-foreground text-sm font-medium line-clamp-2 leading-relaxed">
                          {dept.description || "Îngrijire medicală de specialitate cu standarde europene."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-100/60 dark:border-slate-700/30">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Medici</span>
                          <div className="flex items-center gap-1.5">
                             <Users className="w-4 h-4 text-primary" />
                             <p className="text-lg font-bold text-foreground">{dept._count?.doctors || 0}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Programări</span>
                          <div className="flex items-center gap-1.5">
                             <Clock className="w-4 h-4 text-indigo-400" />
                             <p className="text-lg font-bold text-foreground">{dept._count?.appointments || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3 pt-6 border-t border-slate-100/60">
                      <Button 
                        variant="outline" 
                        className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-widest text-primary border-primary/10 hover:bg-slate-50"
                        onClick={() => router.push(`/doctors?departmentId=${dept.id}`)}
                      >
                        Medici
                      </Button>
                      <Button
                        className="flex-1 h-10 bg-white text-slate-900 border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                        onClick={() => openEditModal(dept)}
                      >
                        GESTIONEAZĂ
                      </Button>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDepartmentOpen} onOpenChange={setIsEditDepartmentOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-8 space-y-8">
            <DialogHeader>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-indigo-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">Editare Departament</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                Modifică identitatea vizuală și setările operaționale ale departamentului.
              </DialogDescription>
            </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleEditDepartment(); }} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Nume Departament</Label>
                <Input
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className={cn("h-12 rounded-xl bg-muted/50 border-none px-4 font-bold text-lg", editErrors.name && "ring-2 ring-rose-500")}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Iconiță</Label>
                  <Select required value={editFormData.icon} onValueChange={(v) => setEditFormData({ ...editFormData, icon: v })}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-none px-4 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {Object.keys(iconMap).map(k => (
                        <SelectItem key={k} value={k} className="rounded-lg my-1 mx-1">{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Culoare Temă</Label>
                  <Select required value={editFormData.color} onValueChange={(v) => setEditFormData({ ...editFormData, color: v })}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-none px-4 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {Object.keys(colorMap).map(k => (
                        <SelectItem key={k} value={k} className="rounded-lg my-1 mx-1 uppercase text-[10px] font-black">{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Status</Label>
                <Select required value={editFormData.status} onValueChange={(v) => setEditFormData({ ...editFormData, status: v })}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-none px-4 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="ACTIV" className="rounded-lg my-1 mx-1 font-bold text-emerald-600">Activ</SelectItem>
                    <SelectItem value="INACTIV" className="rounded-lg my-1 mx-1 font-bold text-slate-400">Inactiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Descriere</Label>
                <Textarea 
                   value={editFormData.description} 
                   onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                   className="resize-none rounded-xl bg-muted/50 border-none p-4 font-medium"
                   rows={3}
                />
              </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsEditDepartmentOpen(false)} className="h-11 rounded-xl font-semibold text-muted-foreground hover:bg-accent px-6">Anulează</Button>
              <Button type="submit" disabled={saving} className="h-11 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl font-bold uppercase tracking-widest text-white transition-all active:scale-95">
                {saving ? "Salvare..." : "Actualizează"}
              </Button>
            </DialogFooter>
          </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={isAddDepartmentOpen} onOpenChange={setIsAddDepartmentOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-8 space-y-8">
            <DialogHeader>

              <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">Adaugă Departament</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                Definește o nouă arie medicală și customizează-i prezența vizuală.
              </DialogDescription>
            </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleAddDepartment(); }} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Nume Departament</Label>
                <Input
                  required
                  value={departmentFormData.name}
                  onChange={(e) => setDepartmentFormData({ ...departmentFormData, name: e.target.value })}
                  className={cn("h-12 rounded-xl bg-muted/50 border-none px-4 font-bold text-lg", departmentErrors.name && "ring-2 ring-rose-500")}
                  placeholder="ex: Gastroenterologie"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Iconiță</Label>
                  <Select required value={departmentFormData.icon || ""} onValueChange={(v) => setDepartmentFormData({ ...departmentFormData, icon: v })}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-none px-4 font-medium">
                      <SelectValue placeholder="Alege icon" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {Object.keys(iconMap).map(k => (
                        <SelectItem key={k} value={k} className="rounded-lg my-1 mx-1">{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Culoare Temă</Label>
                  <Select required value={departmentFormData.color || ""} onValueChange={(v) => setDepartmentFormData({ ...departmentFormData, color: v })}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-none px-4 font-medium">
                      <SelectValue placeholder="Alege culoare" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {Object.keys(colorMap).map(k => (
                        <SelectItem key={k} value={k} className="rounded-lg my-1 mx-1 uppercase text-[10px] font-black">{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Descriere</Label>
                <Textarea 
                   value={departmentFormData.description} 
                   onChange={(e) => setDepartmentFormData({ ...departmentFormData, description: e.target.value })}
                   className="resize-none rounded-xl bg-muted/50 border-none p-4 font-medium"
                   placeholder="Descriere scurtă..."
                   rows={3}
                />
              </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsAddDepartmentOpen(false)} className="h-11 rounded-xl font-semibold text-muted-foreground hover:bg-accent px-6">Anulează</Button>
              <Button type="submit" disabled={saving} className="h-11 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl font-bold uppercase tracking-widest text-white transition-all active:scale-95 group">
                {saving ? "Creare..." : (
                   <>
                     CREEAZĂ DEPARTAMENT
                   </>
                )}
              </Button>
            </DialogFooter>
          </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
