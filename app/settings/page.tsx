"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Building2, Bell, Shield, Clock, Mail, Phone, MapPin, Loader2 } from "lucide-react"
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
    reminderEnabled: true,
    reminderHoursBefore: 24,
  })

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
      await patch({ workdayStart: settings.workdayStart, workdayEnd: settings.workdayEnd })
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1600px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">Setări</h1>
            <p className="text-muted-foreground">Configurează aplicația și preferințele</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Clinic Information */}
              <Card>
                <div className="p-6 border-b flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Informații Clinică</h2>
                    <p className="text-sm text-muted-foreground">Actualizează detaliile clinicii</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="clinic-name">Nume Clinică</Label>
                    <Input
                      id="clinic-name"
                      value={settings.clinicName}
                      onChange={(e) => setSettings((s) => ({ ...s, clinicName: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        value={settings.clinicPhone}
                        onChange={(e) => setSettings((s) => ({ ...s, clinicPhone: e.target.value }))}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.clinicEmail}
                        onChange={(e) => setSettings((s) => ({ ...s, clinicEmail: e.target.value }))}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Adresă</Label>
                    <Input
                      id="address"
                      value={settings.clinicAddress}
                      onChange={(e) => setSettings((s) => ({ ...s, clinicAddress: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>
                  <Button onClick={handleSaveInfo} disabled={savingInfo}>
                    {savingInfo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Se salvează...
                      </>
                    ) : (
                      "Salvează Modificările"
                    )}
                  </Button>
                </div>
              </Card>

              {/* Notification Settings */}
              <Card>
                <div className="p-6 border-b flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-green-600" />
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
              <Card>
                <div className="p-6 border-b flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Program Lucru</h2>
                    <p className="text-sm text-muted-foreground">Setează orele de funcționare</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="opening">Ora Deschidere</Label>
                      <Input
                        id="opening"
                        type="time"
                        value={settings.workdayStart}
                        onChange={(e) => setSettings((s) => ({ ...s, workdayStart: e.target.value }))}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="closing">Ora Închidere</Label>
                      <Input
                        id="closing"
                        type="time"
                        value={settings.workdayEnd}
                        onChange={(e) => setSettings((s) => ({ ...s, workdayEnd: e.target.value }))}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Zile Lucru</Label>
                    <div className="flex gap-2">
                      {DAYS.map((day, index) => (
                        <Badge key={day} variant={index < 5 ? "default" : "outline"} className="cursor-pointer">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleSaveSchedule} disabled={savingSchedule}>
                    {savingSchedule ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Se salvează...
                      </>
                    ) : (
                      "Salvează Program"
                    )}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              <Card>
                <div className="p-6 border-b flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Securitate</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <Button variant="outline" className="w-full bg-transparent">
                    Schimbă Parola
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    Autentificare 2FA
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    Istoric Conectări
                  </Button>
                </div>
              </Card>

              <Card>
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold">Contact Rapid</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{settings.clinicPhone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{settings.clinicEmail || "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{settings.clinicAddress || "—"}</span>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h3 className="font-semibold mb-2">Versiune Aplicație</h3>
                  <Badge variant="outline">v1.2.4</Badge>
                  <p className="text-sm text-muted-foreground mt-3">Ultima actualizare: 18 Ianuarie 2024</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
