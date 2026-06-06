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
import { UserPlus, Search, Shield, User, Trash2, Edit, Mail, Phone, Loader2, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"
import { Pagination } from "@/components/ui/pagination"

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
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
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

  const fetchUsers = async (currentPage = 1, search = "") => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(pageSize) })
      if (search) params.set("search", search)
      const response = await fetch(`/api/users?${params}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setUsers(data.users)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({ title: "Eroare", description: "Nu s-au putut încărca utilizatorii.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session) return
    if (role !== "SUPER_ADMIN") {
      toast({ title: "Acces interzis", description: "Această pagină este dedicată doar administratorilor.", variant: "destructive" })
      router.push("/admin")
      return
    }
    fetchUsers(1, debouncedSearch)
    setPage(1)
  }, [session, role, debouncedSearch])

  useEffect(() => {
    if (!session || role !== "SUPER_ADMIN") return
    fetchUsers(page, debouncedSearch)
  }, [page, pageSize])

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

      await fetchUsers(page, debouncedSearch)
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

      await fetchUsers(page, debouncedSearch)
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
      await fetchUsers(page, debouncedSearch)
      toast({ title: "Utilizator șters", description: "Utilizatorul a fost șters cu succes." })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({ title: "Eroare", description: "Nu s-a putut șterge utilizatorul.", variant: "destructive" })
    }
  }

  const getRoleBadge = (userRole: string) => {
    if (userRole === "SUPER_ADMIN") {
      return (
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-500/15 dark:text-purple-400 dark:hover:bg-purple-500/15">
          <Shield className="w-3 h-3 mr-1" />
          Super Admin
        </Badge>
      )
    }
    if (userRole === "MARKETING") {
      return (
        <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100 dark:bg-pink-500/15 dark:text-pink-400 dark:hover:bg-pink-500/15">
          <Info className="w-3 h-3 mr-1" />
          Marketing
        </Badge>
      )
    }
    if (userRole === "DOCTOR") {
      return (
        <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-500/15 dark:text-teal-400 dark:hover:bg-teal-500/15">
          <User className="w-3 h-3 mr-1" />
          Medic
        </Badge>
      )
    }
    if (userRole === "PATIENT") {
      return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-500/15 dark:text-gray-400 dark:hover:bg-gray-500/15">
          <User className="w-3 h-3 mr-1" />
          Pacient
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
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-500/15 dark:text-green-400 dark:hover:bg-green-500/15">Activ</Badge>
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
              <div className="text-3xl font-bold tracking-tight text-primary">{total}</div>
            </Card>
            <Card className="p-5 border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-white dark:bg-card/50">
              <div className="text-sm font-semibold text-muted-foreground mb-2">Pe această pagină</div>
              <div className="text-3xl font-bold tracking-tight text-slate-600">{users.length}</div>
            </Card>
            <Card className="p-5 border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-white dark:bg-card/50">
              <div className="text-sm font-semibold text-muted-foreground mb-2">Pagina curentă</div>
              <div className="text-3xl font-bold tracking-tight text-blue-600">{page} / {totalPages}</div>
            </Card>
            <Card className="p-5 border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-white dark:bg-card/50">
              <div className="text-sm font-semibold text-muted-foreground mb-2">Activi pe pagină</div>
              <div className="text-3xl font-bold tracking-tight text-emerald-600">{users.filter((u) => u.status === "ACTIVE").length}</div>
            </Card>
          </div>

          {/* Role Permissions Legend */}
          <Card className="p-5 border-none shadow-sm rounded-2xl bg-white dark:bg-card/50">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Roluri & Permisiuni</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10">
                <Shield className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-purple-700 dark:text-purple-400">Super Admin</span>
                  <p className="text-muted-foreground text-xs mt-0.5">Acces complet, gestionare utilizatori</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                <User className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-blue-700 dark:text-blue-400">Recepție</span>
                  <p className="text-muted-foreground text-xs mt-0.5">Pacienți, programări, medici, rapoarte</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-pink-50 dark:bg-pink-500/10">
                <Info className="w-4 h-4 text-pink-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-pink-700 dark:text-pink-400">Marketing</span>
                  <p className="text-muted-foreground text-xs mt-0.5">Rapoarte, plăți, activitate (citire)</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-teal-50 dark:bg-teal-500/10">
                <User className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-teal-700 dark:text-teal-400">Medic</span>
                  <p className="text-muted-foreground text-xs mt-0.5">Portal medic — programări proprii</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-500/10">
                <User className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-400">Pacient</span>
                  <p className="text-muted-foreground text-xs mt-0.5">Portal pacient — date proprii</p>
                </div>
              </div>
            </div>
          </Card>

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

          {/* Users Table */}
          <Card className="rounded-2xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-700/40">
                    <th className="text-left py-4 px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Utilizator</th>
                    <th className="text-left py-4 px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hidden md:table-cell">Email</th>
                    <th className="text-left py-4 px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hidden lg:table-cell">Telefon</th>
                    <th className="text-left py-4 px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Rol</th>
                    <th className="text-left py-4 px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Status</th>
                    <th className="text-left py-4 px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hidden xl:table-cell">Înregistrat</th>
                    <th className="py-4 px-6" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/30">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Se încarcă utilizatorii...</p>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground text-sm">
                        {searchQuery ? "Nu s-au găsit utilizatori." : "Nu există utilizatori."}
                      </td>
                    </tr>
                  ) : users.map((user) => (
                    <tr key={user.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary">
                              {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 hidden md:table-cell">
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{user.email}</p>
                      </td>
                      <td className="py-4 px-6 hidden lg:table-cell">
                        <p className="text-sm text-slate-600 dark:text-slate-400">{user.phone ?? "—"}</p>
                      </td>
                      <td className="py-4 px-6">{getRoleBadge(user.role)}</td>
                      <td className="py-4 px-6">{getStatusBadge(user.status)}</td>
                      <td className="py-4 px-6 hidden xl:table-cell">
                        <p className="text-sm text-slate-500">{new Date(user.createdAt).toLocaleDateString("ro-RO")}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg" onClick={() => handleOpenEdit(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {user.role !== "SUPER_ADMIN" && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUser(user)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageCount={totalPages} total={total} pageSize={pageSize} loading={loading} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </Card>
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
                  <SelectItem value="MARKETING">Marketing</SelectItem>
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
                    <SelectItem value="MARKETING">Marketing</SelectItem>
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
