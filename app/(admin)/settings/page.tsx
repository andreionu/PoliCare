"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Building2, Bell, Shield, Clock, Mail, Phone, MapPin, Loader2, Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface Settings {
  clinicName: string
  clinicPhone: string
  clinicEmail: string
  clinicAddress: string
  emailNotifications: boolean
  smsNotifications: boolean
  workdayStart: string
  workdayEnd: string
  workingDays: string
  reminderEnabled: boolean
  reminderHoursBefore: number
}

const DAYS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"]

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [savingInfo, setSavingInfo] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    clinicName: "",
    clinicPhone: "",
    clinicEmail: "",
    clinicAddress: "",
    emailNotifications: true,
    smsNotifications: false,
    workdayStart: "08:00",
    workdayEnd: "18:00",
    workingDays: "0,1,2,3,4",
    reminderEnabled: true,
    reminderHoursBefore: 24,
  })

  // Password change dialog state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ email: "", currentPassword: "", newPassword: "", confirmPassword: "" })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          clinicName: data.clinicName ?? "",
          clinicPhone: data.clinicPhone ?? "",
          clinicEmail: data.clinicEmail ?? "",
          clinicAddress: data.clinicAddress ?? "",
          emailNotifications: data.emailNotifications ?? true,
          smsNotifications: data.smsNotifications ?? false,
          workdayStart: data.workdayStart ?? "08:00",
          workdayEnd: data.workdayEnd ?? "18:00",
          workingDays: data.workingDays ?? "0,1,2,3,4",
          reminderEnabled: data.reminderEnabled ?? true,
          reminderHoursBefore: data.reminderHoursBefore ?? 24,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const patch = async (fields: Partial<Settings>) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    })
    if (!res.ok) throw new Error("Failed to save")
    return res.json()
  }

  const handleSaveInfo = async () => {
    setSavingInfo(true)
    try {
      await patch({
        clinicName: settings.clinicName,
        clinicPhone: settings.clinicPhone,
        clinicEmail: settings.clinicEmail,
        clinicAddress: settings.clinicAddress,
      })
      toast({ title: "Salvat", description: "Informațiile clinicii au fost actualizate." })
    } catch {
      toast({ title: "Eroare", description: "Nu s-au putut salva modificările.", variant: "destructive" })
    } finally {
      setSavingInfo(false)
    }
  }

  const handleSaveSchedule = async () => {
    setSavingSchedule(true)
    try {
      await patch({ workdayStart: settings.workdayStart, workdayEnd: settings.workdayEnd, workingDays: settings.workingDays })
      toast({ title: "Salvat", description: "Programul de lucru a fost actualizat." })
    } catch {
      toast({ title: "Eroare", description: "Nu s-au putut salva modificările.", variant: "destructive" })
    } finally {
      setSavingSchedule(false)
    }
  }

  const handleToggleNotification = async (field: "emailNotifications" | "smsNotifications", value: boolean) => {
    const prev = settings[field]
    setSettings((s) => ({ ...s, [field]: value }))
    try {
      await patch({ [field]: value })
    } catch {
      setSettings((s) => ({ ...s, [field]: prev }))
      toast({ title: "Eroare", description: "Nu s-a putut salva setarea.", variant: "destructive" })
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.email || !passwordForm.currentPassword || !passwordForm.newPassword) {
      toast({ title: "Eroare", description: "Toate câmpurile sunt obligatorii.", variant: "destructive" })
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Eroare", description: "Parolele noi nu coincid.", variant: "destructive" })
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Eroare", description: "Parola nouă trebuie să aibă cel puțin 6 caractere.", variant: "destructive" })
      return
    }
    setChangingPassword(true)
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: passwordForm.email,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: "Eroare", description: data.error || "Nu s-a putut schimba parola.", variant: "destructive" })
        return
      }
      toast({ title: "Succes", description: "Parola a fost schimbată cu succes." })
      setShowPasswordDialog(false)
      setPasswordForm({ email: "", currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut schimba parola.", variant: "destructive" })
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1600px] mx-auto">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="rounded-full px-3 py-1 border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 font-bold text-[10px] tracking-widest uppercase">
                  System Configuration
                </Badge>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Setări Generală</h1>
              <p className="text-muted-foreground font-medium">Configurează parametrii clinicii și preferințele de administrare.</p>
            </div>
            <div className="hidden lg:block text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ultima actualizare</p>
              <p className="text-sm font-bold text-foreground">18 Ianuarie 2024</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-8">
              {/* Clinic Information */}
              <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-card/50 backdrop-blur-sm group/card">
                <div className="p-6 border-b border-muted/30 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary dark:bg-primary/10 dark:text-primary flex items-center justify-center group-hover/card:scale-110 transition-transform duration-300 shadow-sm border border-primary/20 dark:border-primary/10">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">Informații Clinică</h2>
                    <p className="text-xs font-medium text-muted-foreground">Datele oficiale de identificare ale unității medicale</p>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="clinic-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Nume Clinică</Label>
                    <Input
                      id="clinic-name"
                      value={settings.clinicName}
                      onChange={(e) => setSettings((s) => ({ ...s, clinicName: e.target.value }))}
                      className="h-11 bg-muted/30 border-muted/50 focus:bg-white dark:focus:bg-card transition-all"
                      placeholder="Ex: PoliCare Medical Center"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Telefon Contact</Label>
                      <Input
                        id="phone"
                        value={settings.clinicPhone}
                        onChange={(e) => setSettings((s) => ({ ...s, clinicPhone: e.target.value }))}
                        className="h-11 bg-muted/30 border-muted/50 focus:bg-white dark:focus:bg-card transition-all"
                        placeholder="+40 7xx xxx xxx"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Email Administrativ</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.clinicEmail}
                        onChange={(e) => setSettings((s) => ({ ...s, clinicEmail: e.target.value }))}
                        className="h-11 bg-muted/30 border-muted/50 focus:bg-white dark:focus:bg-card transition-all"
                        placeholder="office@clinica.ro"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Adresă Sediu</Label>
                    <Input
                      id="address"
                      value={settings.clinicAddress}
                      onChange={(e) => setSettings((s) => ({ ...s, clinicAddress: e.target.value }))}
                      className="h-11 bg-muted/30 border-muted/50 focus:bg-white dark:focus:bg-card transition-all"
                      placeholder="Str. Exemplu, Nr. 12, Oraș"
                    />
                  </div>
                  <div className="pt-2">
                    <Button onClick={handleSaveInfo} disabled={savingInfo} className="px-6 h-11 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white font-bold transition-all active:scale-95">
                      {savingInfo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Se salvează...
                        </>
                      ) : (
                        "Actualizează Profilul Clinicii"
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Notification Settings */}
              <Card>
                <div className="p-6 border-b flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/15 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Notificări</h2>
                    <p className="text-sm text-muted-foreground">Configurează preferințele de notificare</p>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notificări</Label>
                      <p className="text-sm text-muted-foreground">Primește notificări prin email</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(v) => handleToggleNotification("emailNotifications", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notificări</Label>
                      <p className="text-sm text-muted-foreground">Primește notificări prin SMS</p>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(v) => handleToggleNotification("smsNotifications", v)}
                    />
                  </div>

                  <div className="border-t pt-5 space-y-4">
                    <p className="text-sm font-medium">Remindere Automate</p>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Reminder Activat</Label>
                        <p className="text-sm text-muted-foreground">Trimite reminder automat înainte de programare</p>
                      </div>
                      <Switch
                        checked={settings.reminderEnabled}
                        onCheckedChange={async (v) => {
                          setSettings((s) => ({ ...s, reminderEnabled: v }))
                          try {
                            await patch({ reminderEnabled: v })
                          } catch {
                            setSettings((s) => ({ ...s, reminderEnabled: !v }))
                            toast({ title: "Eroare", description: "Nu s-a putut salva setarea.", variant: "destructive" })
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-end gap-4">
                      <div>
                        <Label htmlFor="reminderHours">Ore înainte de programare</Label>
                        <Input
                          id="reminderHours"
                          type="number"
                          min={1}
                          max={168}
                          value={settings.reminderHoursBefore}
                          onChange={(e) => setSettings((s) => ({ ...s, reminderHoursBefore: Number(e.target.value) }))}
                          className="mt-1.5 w-28"
                          disabled={!settings.reminderEnabled}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!settings.reminderEnabled}
                        onClick={async () => {
                          try {
                            await patch({ reminderHoursBefore: settings.reminderHoursBefore })
                            toast({ title: "Salvat", description: "Setarea reminderului a fost actualizată." })
                          } catch {
                            toast({ title: "Eroare", description: "Nu s-a putut salva setarea.", variant: "destructive" })
                          }
                        }}
                      >
                        Salvează
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Working Hours */}
              <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-card/50 backdrop-blur-sm group/card">
                <div className="p-6 border-b border-muted/30 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 flex items-center justify-center group-hover/card:scale-110 transition-transform duration-300 shadow-sm border border-purple-100/50 dark:border-purple-800/30">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">Program & Disponibilitate</h2>
                    <p className="text-xs font-medium text-muted-foreground">Standardele orelor de funcționare ale sediului</p>
                  </div>
                </div>
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="opening" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Ora Deschidere</Label>
                      <Input
                        id="opening"
                        type="time"
                        value={settings.workdayStart}
                        onChange={(e) => setSettings((s) => ({ ...s, workdayStart: e.target.value }))}
                        className="h-11 bg-muted/30 border-muted/50 font-bold tabular-nums transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="closing" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Ora Închidere</Label>
                      <Input
                        id="closing"
                        type="time"
                        value={settings.workdayEnd}
                        onChange={(e) => setSettings((s) => ({ ...s, workdayEnd: e.target.value }))}
                        className="h-11 bg-muted/30 border-muted/50 font-bold tabular-nums transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-3 block">Zile Lucrătoare</Label>
                    <div className="flex flex-wrap gap-3">
                      {DAYS.map((day, index) => {
                        const active = settings.workingDays.split(",").includes(String(index))
                        return (
                          <div
                            key={day}
                            onClick={() => {
                              const current = settings.workingDays.split(",").filter(Boolean)
                              const idx = String(index)
                              const next = active ? current.filter((d) => d !== idx) : [...current, idx].sort()
                              setSettings((s) => ({ ...s, workingDays: next.join(",") }))
                            }}
                            className={cn(
                              "cursor-pointer select-none px-5 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95",
                              active 
                                ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20" 
                                : "bg-muted/30 text-muted-foreground border-muted/50 hover:bg-muted/50"
                            )}
                          >
                            {day}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button onClick={handleSaveSchedule} disabled={savingSchedule} className="px-6 h-11 rounded-xl bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all active:scale-95">
                      {savingSchedule ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Se salvează...
                        </>
                      ) : (
                        "Salvează Parametrii"
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-8">
              <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-card/50 backdrop-blur-sm group/card">
                <div className="p-6 border-b border-muted/30 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 flex items-center justify-center group-hover/card:scale-110 transition-transform duration-300 shadow-sm border border-orange-100/50 dark:border-orange-800/30">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">Securitate</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl bg-transparent border-muted/50 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all font-bold text-xs uppercase tracking-widest"
                    onClick={() => setShowPasswordDialog(true)}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Schimbă Parola
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl bg-transparent border-muted/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-xs uppercase tracking-widest text-muted-foreground/60"
                    disabled
                  >
                    Autentificare 2FA
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl bg-transparent border-muted/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-xs uppercase tracking-widest text-muted-foreground/60"
                    disabled
                  >
                    Istoric Conectări
                  </Button>
                </div>
              </Card>

              <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-card/50 backdrop-blur-sm">
                <div className="p-6 border-b border-muted/30">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Contact Rapid</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/10">
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-card flex items-center justify-center shadow-sm text-primary">
                        <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-foreground/80 tabular-nums">{settings.clinicPhone || "fără număr setat"}</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/10">
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-card flex items-center justify-center shadow-sm text-emerald-500">
                        <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-foreground/80 truncate">{settings.clinicEmail || "fără email setat"}</span>
                  </div>
                </div>
              </Card>

              <Card className="border-none shadow-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 relative">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Versiune</h3>
                    <Badge className="bg-primary hover:bg-primary/90 text-white border-none rounded-lg font-bold">
                        v1.2.4
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-black italic tracking-tighter">PoliCare</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Medical Management Platform</p>
                  </div>
                  <p className="text-xs font-medium text-slate-400 pt-2 border-t border-slate-700/50">
                    Ultima actualizare majoră:<br/>
                    <span className="text-slate-200">18 Ianuarie 2024</span>
                  </p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader className="pb-4 border-b border-border/50">

            <DialogTitle className="text-2xl font-bold tracking-tight">Schimbă Parola</DialogTitle>
            <DialogDescription className="text-muted-foreground">Introdu email-ul contului și parolele pentru a schimba parola</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pwd-email">Email cont</Label>
              <Input
                id="pwd-email"
                type="email"
                placeholder="email@exemplu.com"
                value={passwordForm.email}
                onChange={(e) => setPasswordForm({ ...passwordForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd-current">Parola curentă</Label>
              <Input
                id="pwd-current"
                type="password"
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd-new">Parola nouă</Label>
              <Input
                id="pwd-new"
                type="password"
                placeholder="Minim 6 caractere"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd-confirm">Confirmă parola nouă</Label>
              <Input
                id="pwd-confirm"
                type="password"
                placeholder="••••••••"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="pt-6 border-t mt-6">
            <Button
              variant="ghost"
              className="h-11 rounded-xl px-6 font-semibold text-muted-foreground hover:bg-accent"
              onClick={() => {
                setShowPasswordDialog(false)
                setPasswordForm({ email: "", currentPassword: "", newPassword: "", confirmPassword: "" })
              }}
              disabled={changingPassword}
            >
              Anulează
            </Button>
            <Button onClick={handleChangePassword} disabled={changingPassword} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl h-11 px-8 font-bold text-white transition-all">
              {changingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se schimbă...
                </>
              ) : (
                "Schimbă Parola"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
