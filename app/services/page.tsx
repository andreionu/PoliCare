"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
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
import { Plus, Search, MoreHorizontal, Loader2, Wrench, Clock, Building2, ToggleLeft } from "lucide-react"
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [role, setRole] = useState<string | null>(null)
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
    const storedRole = localStorage.getItem("userRole") as string | null
    setRole(storedRole)
    fetchServices()
    fetchDepartments()
  }, [])

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.name.toLowerCase().includes(searchQuery.toLowerCase())
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
    <AdminLayout userRole={role as "super-admin" | "front-desk" | null}>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Servicii</h1>
              <p className="text-muted-foreground mt-1">Gestionează serviciile medicale oferite</p>
            </div>
            <Button size="lg" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Serviciu Nou
            </Button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Servicii</p>
                  <p className="text-2xl font-bold">{services.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <ToggleLeft className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{activeServices.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Durată medie</p>
                  <p className="text-2xl font-bold">{avgDuration} min</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departamente</p>
                  <p className="text-2xl font-bold">{deptsCovered}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search */}
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută după nume sau departament..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {/* Services list */}
          <div className="grid gap-4">
            {loading ? (
              <Card className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Se încarcă serviciile...</p>
              </Card>
            ) : filteredServices.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? "Nu s-au găsit servicii." : "Nu există servicii. Adaugă primul serviciu!"}
                </p>
              </Card>
            ) : (
              filteredServices.map((service) => (
                <Card key={service.id} className="p-4 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{service.name}</h3>
                          <Badge variant="outline" className="text-xs">{service.department.name}</Badge>
                          {service.isActive ? (
                            <Badge className="bg-green-100 text-green-700 border-none text-xs">Activ</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-xs">Inactiv</Badge>
                          )}
                        </div>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">{service.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{service.duration} min</span>
                        </div>
                        <div className="font-medium text-foreground">
                          {service.price !== null ? `${service.price.toFixed(2)} RON` : "Gratuit"}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenEdit(service)}>Editează</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(service)}
                          >
                            Șterge
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          <DialogHeader>
            <DialogTitle>Serviciu Nou</DialogTitle>
            <DialogDescription>Adaugă un serviciu medical nou</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nume *</Label>
              <Input
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} disabled={saving}>Anulează</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Se salvează...</> : "Adaugă Serviciu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editează Serviciu</DialogTitle>
            <DialogDescription>Actualizează datele serviciului</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nume</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Departament</Label>
              <Select value={editForm.departmentId} onValueChange={(v) => setEditForm({ ...editForm, departmentId: v })}>
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)} disabled={saving}>Anulează</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Se salvează...</> : "Salvează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
