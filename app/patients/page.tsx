"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
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
import { UserPlus, Search, Shield, User, Trash2, Edit, Mail, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function UsersPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddUser, setShowAddUser] = useState(false)
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Admin Principal",
      email: "admin@medicare.ro",
      phone: "+40 721 234 567",
      role: "super-admin",
      status: "active",
      createdAt: "2024-01-15",
    },
    {
      id: 2,
      name: "Maria Ionescu",
      email: "receptie@medicare.ro",
      phone: "+40 722 345 678",
      role: "front-desk",
      status: "active",
      createdAt: "2024-02-20",
    },
    {
      id: 3,
      name: "Ion Popescu",
      email: "receptie2@medicare.ro",
      phone: "+40 723 456 789",
      role: "front-desk",
      status: "active",
      createdAt: "2024-03-10",
    },
  ])

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "front-desk",
    password: "",
  })

  const [errors, setErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (showAddUser) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [showAddUser])

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery),
  )

  const handleAddUser = () => {
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

    const user = {
      id: users.length + 1,
      ...newUser,
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
    }

    setUsers([...users, user])
    setShowAddUser(false)
    setNewUser({ name: "", email: "", phone: "", role: "front-desk", password: "" })
    setErrors({})

    toast({
      title: "Utilizator adăugat",
      description: `${user.name} a fost adăugat cu succes în sistem.`,
    })
  }

  const handleDeleteUser = (userId: number) => {
    const user = users.find((u) => u.id === userId)
    if (user?.role === "super-admin") {
      toast({
        title: "Acțiune nepermisă",
        description: "Nu poți șterge contul de super-admin.",
        variant: "destructive",
      })
      return
    }

    setUsers(users.filter((u) => u.id !== userId))
    toast({
      title: "Utilizator șters",
      description: "Utilizatorul a fost șters cu succes.",
    })
  }

  const getRoleBadge = (role: string) => {
    if (role === "super-admin") {
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

  return (
    <AdminLayout>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gestionare Utilizatori</h1>
              <p className="text-muted-foreground mt-1">Administrează accesul utilizatorilor la sistem</p>
            </div>
            <Button onClick={() => setShowAddUser(true)} size="lg">
              <UserPlus className="w-4 h-4 mr-2" />
              Utilizator Nou
            </Button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Utilizatori</div>
              <div className="text-2xl font-bold">{users.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Super Admini</div>
              <div className="text-2xl font-bold">{users.filter((u) => u.role === "super-admin").length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Personal Recepție</div>
              <div className="text-2xl font-bold">{users.filter((u) => u.role === "front-desk").length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Activi</div>
              <div className="text-2xl font-bold">{users.filter((u) => u.status === "active").length}</div>
            </Card>
          </div>

          {/* Search */}
          <Card className="p-4">
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
            {filteredUsers.map((user) => (
              <Card key={user.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        {getRoleBadge(user.role)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </div>
                        <div>Înregistrat: {user.createdAt}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.role !== "super-admin" && (
                      <>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Add User Modal */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adaugă Utilizator Nou</DialogTitle>
            <DialogDescription>Creează un cont nou pentru personalul clinicii</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nume complet *</Label>
              <Input
                id="name"
                placeholder="ex: Maria Ionescu"
                value={newUser.name}
                onChange={(e) => {
                  setNewUser({ ...newUser, name: e.target.value })
                  setErrors({ ...errors, name: false })
                }}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">Numele este obligatoriu</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="maria.ionescu@medicare.ro"
                value={newUser.email}
                onChange={(e) => {
                  setNewUser({ ...newUser, email: e.target.value })
                  setErrors({ ...errors, email: false })
                }}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-xs text-destructive">Email-ul este obligatoriu</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon *</Label>
              <Input
                id="phone"
                placeholder="+40 722 345 678"
                value={newUser.phone}
                onChange={(e) => {
                  setNewUser({ ...newUser, phone: e.target.value })
                  setErrors({ ...errors, phone: false })
                }}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && <p className="text-xs text-destructive">Telefonul este obligatoriu</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="front-desk">Recepție</SelectItem>
                  <SelectItem value="super-admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Parolă *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minim 6 caractere"
                value={newUser.password}
                onChange={(e) => {
                  setNewUser({ ...newUser, password: e.target.value })
                  setErrors({ ...errors, password: false })
                }}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && <p className="text-xs text-destructive">Parola trebuie să aibă minim 6 caractere</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>
              Anulează
            </Button>
            <Button onClick={handleAddUser}>Adaugă Utilizator</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
