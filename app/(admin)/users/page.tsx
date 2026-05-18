"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Search, Shield, User, Trash2, Edit, Mail, Phone, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface AppUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  status: string
  createdAt: string
}

export default function UsersPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddUser, setShowAddUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const { data: session } = useSession()
  const role = session?.user?.role ?? null
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<AppUser[]>([])

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "FRONT_DESK",
    password: "",
  })
  const [editUser, setEditUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "FRONT_DESK",
    status: "ACTIVE",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca utilizatorii.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session) return
    if (role !== "SUPER_ADMIN") {
      toast({
        title: "Acces interzis",
        description: "Această pagină este dedicată doar administratorilor.",
        variant: "destructive",
      })
      router.push("/admin")
      return
    }
    fetchUsers()
  }, [session, role, router, toast])

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery)),
  )

  const handleAddUser = async () => {
    const newErrors: Record<string, boolean> = {}
    if (!newUser.name.trim()) newErrors.name = true
    if (!newUser.email.trim()) newErrors.email = true
    if (!newUser.phone.trim()) newErrors.phone = true
    if (!newUser.password.trim() || newUser.password.length < 6) newErrors.password = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast({
        title: "Eroare validare",
        description: "Te rugăm să completezi toate câmpurile obligatorii corect.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          password: newUser.password,
          status: "ACTIVE",
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to create user")
      }

      await fetchUsers()
      setShowAddUser(false)
      setNewUser({ name: "", email: "", phone: "", role: "FRONT_DESK", password: "" })
      setErrors({})
      toast({ title: "Utilizator adăugat", description: "Contul a fost creat cu succes." })
    } catch (error) {
      console.error("Error creating user:", error)
      toast({ title: "Eroare", description: "Nu s-a putut crea utilizatorul.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user)
    setEditUser({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      status: user.status,
      password: "",
    })
    setErrors({})
    setShowEditUser(true)
  }

  const handleEditUser = async () => {
    if (!editingUser) return
    const newErrors: Record<string, boolean> = {}
    if (!editUser.name.trim()) newErrors.name = true
    if (!editUser.email.trim()) newErrors.email = true
    if (editUser.password && editUser.password.length < 6) newErrors.password = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast({ title: "Eroare validare", description: "Completează câmpurile obligatorii.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const body: Record<string, string> = {
        name: editUser.name,
        email: editUser.email,
        phone: editUser.phone,
        role: editUser.role,
        status: editUser.status,
      }
      if (editUser.password) body.password = editUser.password

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error("Failed to update user")

      await fetchUsers()
      setShowEditUser(false)
      setEditingUser(null)
      toast({ title: "Utilizator actualizat", description: "Datele au fost salvate cu succes." })
    } catch (error) {
      console.error("Error updating user:", error)
      toast({ title: "Eroare", description: "Nu s-a putut actualiza utilizatorul.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (user: AppUser) => {
    if (user.role === "SUPER_ADMIN") {
      toast({
        title: "Acțiune nepermisă",
        description: "Nu poți șterge contul de super-admin.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete user")
      await fetchUsers()
      toast({ title: "Utilizator șters", description: "Utilizatorul a fost șters cu succes." })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({ title: "Eroare", description: "Nu s-a putut șterge utilizatorul.", variant: "destructive" })
    }
  }

  const getRoleBadge = (userRole: string) => {
    if (userRole === "SUPER_ADMIN") {
      return (
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
          <Shield className="w-3 h-3 mr-1" />
          Super Admin
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <User className="w-3 h-3 mr-1" />
        Recepție
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    return status === "ACTIVE" ? (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Activ</Badge>
    ) : (
      <Badge variant="outline" className="text-muted-foreground">Inactiv</Badge>
    )
  }

  if (role !== "SUPER_ADMIN") return null

  return (
    <>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gestionare Utilizatori</h1>
              <p className="text-muted-foreground mt-1">Administrează accesul utilizatorilor la sistem</p>
            </div>
            <Button 
              className="gap-2 h-11 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all rounded-xl font-bold text-white" 
              onClick={() => setShowAddUser(true)}
            >
              <UserPlus className="w-4 h-4" />
              Utilizator Nou
            </Button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-5 border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-white dark:bg-card/50">
              <div className="text-sm font-semibold text-muted-foreground mb-2">Total Utilizatori</div>
              <div className="text-3xl font-bold tracking-tight text-primary">{users.length}</div>
            </Card>
            <Card className="p-5 border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-white dark:bg-card/50">
              <div className="text-sm font-semibold text-muted-foreground mb-2">Super Admini</div>
              <div className="text-3xl font-bold tracking-tight text-purple-600">{users.filter((u) => u.role === "SUPER_ADMIN").length}</div>
            </Card>
            <Card className="p-5 border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-white dark:bg-card/50">
              <div className="text-sm font-semibold text-muted-foreground mb-2">Personal Recepție</div>
              <div className="text-3xl font-bold tracking-tight text-blue-600">{users.filter((u) => u.role === "FRONT_DESK").length}</div>
            </Card>
            <Card className="p-5 border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-white dark:bg-card/50">
              <div className="text-sm font-semibold text-muted-foreground mb-2">Activi</div>
              <div className="text-3xl font-bold tracking-tight text-emerald-600">{users.filter((u) => u.status === "ACTIVE").length}</div>
            </Card>
          </div>

          {/* Search */}
          <Card className="p-4 border-none shadow-sm rounded-2xl bg-white dark:bg-card/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută după nume, email sau telefon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {/* Users List */}
          <div className="grid gap-4">
            {loading ? (
              <Card className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Se încarcă utilizatorii...</p>
              </Card>
            ) : filteredUsers.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? "Nu s-au găsit utilizatori." : "Nu există utilizatori."}
                </p>
              </Card>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{user.name}</h3>
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </div>
                          )}
                          <div>Înregistrat: {new Date(user.createdAt).toLocaleDateString("ro-RO")}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {user.role !== "SUPER_ADMIN" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => handleDeleteUser(user)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Add User Modal */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader className="pb-4 border-b">

            <DialogTitle className="text-2xl font-bold tracking-tight">Adaugă Utilizator Nou</DialogTitle>
            <DialogDescription className="text-muted-foreground">Creează un cont nou pentru personalul clinicii</DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleAddUser(); }} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Nume complet *</Label>
              <Input
                required
                id="add-name"
                placeholder="ex: Maria Ionescu"
                value={newUser.name}
                onChange={(e) => { setNewUser({ ...newUser, name: e.target.value }); setErrors({ ...errors, name: false }) }}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">Numele este obligatoriu</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-email">Email *</Label>
              <Input
                required
                id="add-email"
                type="email"
                placeholder="maria.ionescu@clinica.ro"
                value={newUser.email}
                onChange={(e) => { setNewUser({ ...newUser, email: e.target.value }); setErrors({ ...errors, email: false }) }}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-xs text-destructive">Email-ul este obligatoriu</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-phone">Telefon *</Label>
              <Input
                required
                id="add-phone"
                placeholder="+40 722 345 678"
                value={newUser.phone}
                onChange={(e) => { setNewUser({ ...newUser, phone: e.target.value }); setErrors({ ...errors, phone: false }) }}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && <p className="text-xs text-destructive">Telefonul este obligatoriu</p>}
            </div>

            <div className="space-y-2">
              <Label>Rol *</Label>
              <Select required value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRONT_DESK">Recepție</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-password">Parolă *</Label>
              <Input
                required
                id="add-password"
                type="password"
                placeholder="Minim 6 caractere"
                value={newUser.password}
                onChange={(e) => { setNewUser({ ...newUser, password: e.target.value }); setErrors({ ...errors, password: false }) }}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && <p className="text-xs text-destructive">Parola trebuie să aibă minim 6 caractere</p>}
            </div>

          <DialogFooter className="pt-6 border-t mt-6">
            <Button type="button" variant="ghost" onClick={() => setShowAddUser(false)} disabled={saving} className="h-11 rounded-xl px-6 font-semibold text-muted-foreground hover:bg-accent">Anulează</Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 h-11 px-8 rounded-xl font-bold text-white shadow-lg shadow-primary/20 transition-all">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvare...</> : "Adaugă Utilizator"}
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader className="pb-4 border-b">

            <DialogTitle className="text-2xl font-bold tracking-tight">Editează Utilizator</DialogTitle>
            <DialogDescription className="text-muted-foreground">Actualizează datele contului</DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleEditUser(); }} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nume complet *</Label>
              <Input
                required
                id="edit-name"
                value={editUser.name}
                onChange={(e) => { setEditUser({ ...editUser, name: e.target.value }); setErrors({ ...errors, name: false }) }}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">Numele este obligatoriu</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                required
                id="edit-email"
                type="email"
                value={editUser.email}
                onChange={(e) => { setEditUser({ ...editUser, email: e.target.value }); setErrors({ ...errors, email: false }) }}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-xs text-destructive">Email-ul este obligatoriu</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefon</Label>
              <Input
                required
                id="edit-phone"
                value={editUser.phone}
                onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select required value={editUser.role} onValueChange={(value) => setEditUser({ ...editUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FRONT_DESK">Recepție</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select required value={editUser.status} onValueChange={(value) => setEditUser({ ...editUser, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activ</SelectItem>
                    <SelectItem value="INACTIVE">Inactiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">Parolă nouă (opțional)</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Lasă gol pentru a păstra parola actuală"
                value={editUser.password}
                onChange={(e) => { setEditUser({ ...editUser, password: e.target.value }); setErrors({ ...errors, password: false }) }}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && <p className="text-xs text-destructive">Parola trebuie să aibă minim 6 caractere</p>}
            </div>

          <DialogFooter className="pt-6 border-t mt-6">
            <Button type="button" variant="ghost" onClick={() => setShowEditUser(false)} disabled={saving} className="h-11 rounded-xl px-6 font-semibold text-muted-foreground hover:bg-accent">Anulează</Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 h-11 px-8 rounded-xl font-bold text-white shadow-lg shadow-primary/20 transition-all">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvare...</> : "Salvează Modificările"}
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
