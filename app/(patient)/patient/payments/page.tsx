"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { CreditCard, CheckCircle, Clock, Loader2, Receipt, Printer } from "lucide-react"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { formatDoctorName } from "@/lib/utils"

interface Appointment {
  id: string
  date: string
  startTime: string
  status: string
  paymentStatus: string
  stripeSessionId: string | null
  doctor: { name: string; specialty: string | null }
  department: { name: string } | null
  service: { name: string; price: number } | null
}

const paymentBadge: Record<string, { label: string; className: string }> = {
  PAID:     { label: "Plătit",       className: "bg-emerald-100 text-emerald-700" },
  PENDING:  { label: "În procesare", className: "bg-blue-100 text-blue-700" },
  UNPAID:   { label: "Neachitat",    className: "bg-amber-100 text-amber-700" },
  REFUNDED: { label: "Rambursat",    className: "bg-purple-100 text-purple-700" },
}

const statusLabels: Record<string, string> = {
  IN_ASTEPTARE: "În așteptare",
  CONFIRMAT: "Confirmat",
  IN_DESFASURARE: "În desfășurare",
  FINALIZAT: "Finalizat",
  ANULAT: "Anulat",
  NEPREZENTARE: "Neprezentare",
}

const CLINIC_NAME = "MedClinic"

export default function PatientPaymentsPage() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null)
  const [receiptAppt, setReceiptAppt] = useState<Appointment | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch("/api/patient/appointments")
      if (!res.ok) throw new Error()
      const data: Appointment[] = await res.json()
      setAppointments(data.filter(a => (a.service?.price ?? 0) > 0))
    } catch {
      toast({ title: "Eroare", description: "Nu s-au putut încărca plățile.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const stats = useMemo(() => {
    let paid = 0, outstanding = 0
    appointments.forEach(a => {
      const price = a.service?.price ?? 0
      if (a.paymentStatus === "PAID") paid += price
      else if (a.paymentStatus === "UNPAID" && !["ANULAT","NEPREZENTARE"].includes(a.status)) outstanding += price
    })
    return { paid, outstanding }
  }, [appointments])

  const handlePay = async (apptId: string) => {
    setPaying(apptId)
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: apptId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Eroare")
      window.location.href = data.url
    } catch (e: any) {
      toast({ title: "Eroare", description: e.message, variant: "destructive" })
      setPaying(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Istoricul Plăților</h1>
        <p className="text-muted-foreground">Servicii cu tarif din programările dvs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-emerald-100 bg-emerald-50 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Total plătit</p>
            <p className="text-2xl font-black text-emerald-900">{stats.paid.toLocaleString("ro-RO")} lei</p>
          </div>
        </Card>
        <Card className="rounded-2xl border-amber-100 bg-amber-50 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Rest de plată</p>
            <p className="text-2xl font-black text-amber-900">{stats.outstanding.toLocaleString("ro-RO")} lei</p>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <CreditCard className="h-10 w-10 opacity-30" />
            <p className="font-semibold text-sm">Nicio programare cu tarif</p>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-border/50">
              {appointments.map(appt => {
                const pb = paymentBadge[appt.paymentStatus] ?? paymentBadge.UNPAID
                const canPay = appt.paymentStatus === "UNPAID" && !["ANULAT","NEPREZENTARE"].includes(appt.status)
                const isPaid = appt.paymentStatus === "PAID"
                return (
                  <div key={appt.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{formatDoctorName(appt.doctor.name)}</p>
                        {appt.service && <p className="text-xs text-muted-foreground truncate">{appt.service.name}</p>}
                      </div>
                      <Badge className={`${pb.className} border-none shrink-0`}>{pb.label}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(appt.date), "d MMM yyyy", { locale: ro })} · {appt.startTime}
                      </p>
                      <p className="font-black text-sm text-foreground">
                        {(appt.service?.price ?? 0).toLocaleString("ro-RO")} lei
                      </p>
                    </div>
                    {(canPay || isPaid) && (
                      <div className="pt-1">
                        {canPay && (
                          <Button
                            size="sm"
                            className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-9 text-xs font-bold"
                            onClick={() => handlePay(appt.id)}
                            disabled={paying === appt.id}
                          >
                            {paying === appt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                            Plătește
                          </Button>
                        )}
                        {isPaid && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full rounded-xl gap-1.5 h-9 text-xs font-bold text-teal-600 hover:bg-teal-50"
                            onClick={() => setReceiptAppt(appt)}
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            Vizualizează chitanța
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Dată</th>
                    <th className="text-left px-4 py-3">Medic</th>
                    <th className="text-left px-4 py-3">Serviciu</th>
                    <th className="text-right px-4 py-3">Sumă</th>
                    <th className="text-center px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {appointments.map(appt => {
                    const pb = paymentBadge[appt.paymentStatus] ?? paymentBadge.UNPAID
                    const canPay = appt.paymentStatus === "UNPAID" && !["ANULAT","NEPREZENTARE"].includes(appt.status)
                    const isPaid = appt.paymentStatus === "PAID"
                    return (
                      <tr key={appt.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-semibold">{format(new Date(appt.date), "d MMM yyyy", { locale: ro })}</p>
                          <p className="text-xs text-muted-foreground">{appt.startTime}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{formatDoctorName(appt.doctor.name)}</p>
                          {appt.doctor.specialty && <p className="text-xs text-muted-foreground">{appt.doctor.specialty}</p>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{appt.service?.name}</td>
                        <td className="px-4 py-3 text-right font-bold">
                          {(appt.service?.price ?? 0).toLocaleString("ro-RO")} lei
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`${pb.className} border-none`}>{pb.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {canPay && (
                            <Button
                              size="sm"
                              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-8 text-xs font-bold"
                              onClick={() => handlePay(appt.id)}
                              disabled={paying === appt.id}
                            >
                              {paying === appt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                              Plătește
                            </Button>
                          )}
                          {isPaid && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-xl gap-1.5 h-8 text-xs font-bold text-teal-600 hover:bg-teal-50"
                              onClick={() => setReceiptAppt(appt)}
                            >
                              <Receipt className="h-3.5 w-3.5" />
                              Chitanță
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Receipt dialog */}
      <Dialog open={!!receiptAppt} onOpenChange={(open) => { if (!open) setReceiptAppt(null) }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">Chitanță</DialogTitle>
          </DialogHeader>

          {receiptAppt && (
            <div className="space-y-4 py-2 print:p-6" id="receipt-content">
              <div className="text-center border-b pb-4">
                <p className="text-xl font-black text-teal-600">{CLINIC_NAME}</p>
                <p className="text-xs text-muted-foreground mt-1">Confirmare plată serviciu medical</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data consultației</span>
                  <span className="font-semibold">{format(new Date(receiptAppt.date), "d MMMM yyyy", { locale: ro })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ora</span>
                  <span className="font-semibold">{receiptAppt.startTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Medic</span>
                  <span className="font-semibold">{formatDoctorName(receiptAppt.doctor.name)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serviciu</span>
                  <span className="font-semibold">{receiptAppt.service?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status consultație</span>
                  <span className="font-semibold">{statusLabels[receiptAppt.status] ?? receiptAppt.status}</span>
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-bold text-sm">Total achitat</span>
                <span className="text-xl font-black text-emerald-600">
                  {(receiptAppt.service?.price ?? 0).toLocaleString("ro-RO")} lei
                </span>
              </div>

              <div className="text-center text-xs text-muted-foreground bg-muted/30 rounded-xl p-3">
                {receiptAppt.stripeSessionId
                  ? "Achitat online via Stripe"
                  : "Achitat la recepție"}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setReceiptAppt(null)}>
              Închide
            </Button>
            <Button
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              Printează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
