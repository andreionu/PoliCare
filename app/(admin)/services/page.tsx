"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Loader2, Wrench, Clock, Building2, ToggleLeft, Coins, Activity, CheckCircle, CalendarIcon, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number | null
  isActive: boolean
  department: { id: string; name: string }
}

interface Department {
  id: string
  name: string
}

export default function ServicesPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [deptFilter, setDeptFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const emptyForm = { name: "", description: "", duration: "30", price: "", departmentId: "", isActive: true }
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState({ ...emptyForm })
  const [addErrors, setAddErrors] = useState<Record<string, boolean>>({})

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setServices(data)
    } catch (error) {
      console.error("Error fetching services:", error)
      toast({ title: "Eroare", description: "Nu s-au putut încărca serviciile.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setDepartments(data)
    } catch (error) {
      console.error("Error fetching departments:", error)
    }
  }

  useEffect(() => {
    fetchServices()
    fetchDepartments()
  }, [])

  const filteredServices = services.filter(
    (s) =>
      (deptFilter === "all" || s.department.id === deptFilter) &&
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       s.department.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAdd = async () => {
    const errors: Record<string, boolean> = {}
    if (!addForm.name.trim()) errors.name = true
    if (!addForm.departmentId) errors.departmentId = true
    if (!addForm.duration || isNaN(Number(addForm.duration))) errors.duration = true

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors)
      toast({ title: "Eroare validare", description: "Completează câmpurile obligatorii.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          description: addForm.description || null,
          duration: Number(addForm.duration),
          price: addForm.price ? Number(addForm.price) : null,
          departmentId: addForm.departmentId,
          isActive: true,
        }),
      })
      if (!response.ok) throw new Error("Failed to create service")
      await fetchServices()
      setShowAdd(false)
      setAddForm(emptyForm)
      setAddErrors({})
      toast({ title: "Succes", description: "Serviciul a fost adăugat." })
    } catch (error) {
      console.error("Error creating service:", error)
      toast({ title: "Eroare", description: "Nu s-a putut adăuga serviciul.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleOpenEdit = (service: Service) => {
    setEditingService(service)
    setEditForm({
      name: service.name,
      description: service.description || "",
      duration: String(service.duration),
      price: service.price !== null ? String(service.price) : "",
      departmentId: service.department.id,
      isActive: service.isActive,
    })
    setShowEdit(true)
  }

  const handleEdit = async () => {
    if (!editingService) return
    setSaving(true)
    try {
      const response = await fetch(`/api/services/${editingService.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description || null,
          duration: Number(editForm.duration),
          price: editForm.price ? Number(editForm.price) : null,
          departmentId: editForm.departmentId,
          isActive: editForm.isActive,
        }),
      })
      if (!response.ok) throw new Error("Failed to update service")
      await fetchServices()
      setShowEdit(false)
      setEditingService(null)
      toast({ title: "Succes", description: "Serviciul a fost actualizat." })
    } catch (error) {
      console.error("Error updating service:", error)
      toast({ title: "Eroare", description: "Nu s-a putut actualiza serviciul.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (service: Service) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete service")
      await fetchServices()
      toast({ title: "Succes", description: "Serviciul a fost șters." })
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({ title: "Eroare", description: "Nu s-a putut șterge serviciul.", variant: "destructive" })
    }
  }

  const activeServices = services.filter((s) => s.isActive)
  const avgDuration = services.length > 0
    ? Math.round(services.reduce((sum, s) => sum + s.duration, 0) / services.length)
    : 0
  const deptsCovered = new Set(services.map((s) => s.department.id)).size

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
              <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">Servicii</h1>
              <p className="text-muted-foreground text-lg italic">Configurarea portofoliului de servicii medicale și a tarifelor aferente.</p>
            </div>
            <Button className="gap-2 h-11 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all rounded-xl font-bold text-white" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" />
              Serviciu Nou
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Wrench className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Servicii</p>
                  <p className="text-3xl font-bold tracking-tight">{services.length}</p>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Active</p>
                  <p className="text-3xl font-bold tracking-tight">{activeServices.length}</p>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Durată medie</p>
                  <p className="text-3xl font-bold tracking-tight">{avgDuration} min</p>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Departamente</p>
                  <p className="text-3xl font-bold tracking-tight">{deptsCovered}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search */}
          <div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-white dark:bg-card/50 p-4 rounded-2xl shadow-sm border">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full xl:w-auto">
              <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Caută după nume sau departament..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl transition-all"
                />
              </div>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="h-12 w-full sm:w-52 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary">
                  <SelectValue placeholder="Toate departamentele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate departamentele</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto self-start xl:self-center">
              <div className="h-10 w-[1px] bg-border mx-2 hidden xl:block" />
              <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Afișare: <span className="text-foreground">{filteredServices.length} servicii</span>
              </p>
            </div>
          </div>

          {/* Services list */}
          <div className="grid gap-6">
            {loading ? (
              <div className="p-20 text-center bg-white dark:bg-card/50 rounded-2xl border border-border/50">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
                <p className="text-muted-foreground font-medium animate-pulse">Se încarcă lista serviciilor...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-card/50 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
                    <Wrench className="w-10 h-10 text-primary/50" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white dark:bg-card border-2 border-background flex items-center justify-center shadow-sm">
                    <Search className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Niciun serviciu găsit</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                  {searchQuery 
                    ? `Nu am găsit niciun serviciu care să corespundă căutării "${searchQuery}".`
                    : "Nu există servicii medicale înregistrate în sistem."}
                </p>
                <Button 
                  variant="outline" 
                  className="h-11 px-6 rounded-xl border-primary/20 text-primary hover:bg-primary/5 transition-all font-semibold"
                  onClick={() => setSearchQuery("")}
                >
                  Resetează căutarea
                </Button>
              </div>
            ) : (
              filteredServices.map((service) => (
                <Card key={service.id} className="group relative bg-white dark:bg-card/50 rounded-2xl border border-border/50 p-6 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                        <Wrench className="h-7 w-7 text-white" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors uppercase">{service.name}</h3>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {service.department.name}
                          </Badge>
                          <Badge className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            service.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20"
                              : "bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/20"
                          } border shadow-sm`}>
                            {service.isActive ? "Activ" : "Inactiv"}
                          </Badge>
                        </div>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-1 italic line-clamp-1">{service.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 lg:gap-12">
                      <div className="flex flex-col gap-1 min-w-[100px]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          Durată
                        </span>
                        <span className="text-lg font-bold text-foreground/90 tracking-tight">{service.duration} MIN</span>
                      </div>

                      <div className="flex flex-col gap-1 min-w-[120px]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                          <Coins className="w-3 h-3" />
                          Tarif
                        </span>
                        <span className="text-lg font-extrabold text-primary tracking-tight">
                          {service.price !== null ? `${service.price.toFixed(2)} RON` : "GRATUIT"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-10 px-5 border-primary/20 text-primary font-bold hover:bg-primary/5 rounded-xl transition-all" 
                          onClick={() => handleOpenEdit(service)}
                        >
                          Editează
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Mai multe opțiuni" className="h-10 w-10 text-muted-foreground rounded-xl">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl p-2 w-42">
                            <DropdownMenuLabel className="text-xs uppercase font-bold text-muted-foreground px-2 pb-2">Opțiuni</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive font-semibold rounded-lg cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(service)}
                            >
                              Șterge Serviciu
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Add Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader className="pb-4 border-b">

            <DialogTitle className="text-2xl font-bold tracking-tight">Serviciu Nou</DialogTitle>
            <DialogDescription className="text-muted-foreground">Adaugă o nouă procedură medicală în portofoliul clinicii.</DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nume *</Label>
              <Input
                required
                placeholder="ex: Consultație cardiologie"
                value={addForm.name}
                onChange={(e) => { setAddForm({ ...addForm, name: e.target.value }); setAddErrors({ ...addErrors, name: false }) }}
                className={addErrors.name ? "border-destructive" : ""}
              />
              {addErrors.name && <p className="text-xs text-destructive">Numele este obligatoriu</p>}
            </div>

            <div className="space-y-2">
              <Label>Departament *</Label>
              <Select
                required
                value={addForm.departmentId}
                onValueChange={(v) => { setAddForm({ ...addForm, departmentId: v }); setAddErrors({ ...addErrors, departmentId: false }) }}
              >
                <SelectTrigger className={addErrors.departmentId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selectează departamentul" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {addErrors.departmentId && <p className="text-xs text-destructive">Departamentul este obligatoriu</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Durată (minute) *</Label>
                <Input
                  required
                  type="number"
                  min="1"
                  placeholder="30"
                  value={addForm.duration}
                  onChange={(e) => { setAddForm({ ...addForm, duration: e.target.value }); setAddErrors({ ...addErrors, duration: false }) }}
                  className={addErrors.duration ? "border-destructive" : ""}
                />
                {addErrors.duration && <p className="text-xs text-destructive">Durata este obligatorie</p>}
              </div>
              <div className="space-y-2">
                <Label>Preț (RON)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Gratuit"
                  value={addForm.price}
                  onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descriere</Label>
              <Textarea
                placeholder="Descriere scurtă a serviciului..."
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>

          <DialogFooter className="pt-6 border-t mt-6">
            <Button type="button" variant="ghost" onClick={() => setShowAdd(false)} disabled={saving} className="rounded-xl h-11 px-6 font-semibold text-muted-foreground hover:bg-accent">
              Anulează
            </Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl h-11 px-8 font-bold text-white">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se salvează...
                </>
              ) : (
                "Adaugă Serviciu"
              )}
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader className="pb-4 border-b">

            <DialogTitle className="text-2xl font-bold tracking-tight">Editează Serviciu</DialogTitle>
            <DialogDescription className="text-muted-foreground">Actualizează tarifele sau detaliile procedurii medicale.</DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nume</Label>
              <Input
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Departament</Label>
              <Select required value={editForm.departmentId} onValueChange={(v) => setEditForm({ ...editForm, departmentId: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Durată (minute)</Label>
                <Input
                  required
                  type="number"
                  min="1"
                  value={editForm.duration}
                  onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Preț (RON)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Gratuit"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descriere</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-isActive">Serviciu activ</Label>
            </div>

          <DialogFooter className="pt-6 border-t mt-6">
            <Button type="button" variant="ghost" onClick={() => setShowEdit(false)} disabled={saving} className="rounded-xl h-11 px-6 font-semibold text-muted-foreground hover:bg-accent">
              Anulează
            </Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl h-11 px-8 font-bold text-white">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se salvează...
                </>
              ) : (
                "Salvează Modificările"
              )}
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
