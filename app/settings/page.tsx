"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Building2, Bell, Shield, Clock, Mail, Phone, MapPin } from "lucide-react"

export default function SettingsPage() {
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
                    <Input id="clinic-name" defaultValue="MediCare București" className="mt-1.5" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefon</Label>
                      <Input id="phone" defaultValue="+40 21 123 4567" className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue="contact@medicare.ro" className="mt-1.5" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Adresă</Label>
                    <Input id="address" defaultValue="Str. Aviatorilor nr. 23, București" className="mt-1.5" />
                  </div>
                  <Button>Salvează Modificările</Button>
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
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notificări</Label>
                      <p className="text-sm text-muted-foreground">Primește notificări prin SMS</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificări Programări Noi</Label>
                      <p className="text-sm text-muted-foreground">Alert la programări noi</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reminder Programări</Label>
                      <p className="text-sm text-muted-foreground">Trimite reminder-uri pacienților</p>
                    </div>
                    <Switch defaultChecked />
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
                      <Input id="opening" type="time" defaultValue="08:00" className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="closing">Ora Închidere</Label>
                      <Input id="closing" type="time" defaultValue="20:00" className="mt-1.5" />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Zile Lucru</Label>
                    <div className="flex gap-2">
                      {["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"].map((day, index) => (
                        <Badge key={day} variant={index < 5 ? "default" : "outline"} className="cursor-pointer">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button>Salvează Program</Button>
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
                    <span>+40 21 123 4567</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>contact@medicare.ro</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>Str. Aviatorilor nr. 23</span>
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
