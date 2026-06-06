"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useRealtimeEvent } from "@/hooks/use-realtime"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreditCard, TrendingUp, Clock, Loader2, MoreHorizontal, CheckCircle2, RotateCcw, Ban, ExternalLink, Mail } from "lucide-react"
import { Pagination } from "@/components/ui/pagination"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

interface PaymentAppointment {
  id: string
  date: string
  startTime: string
  paymentStatus: "UNPAID" | "PENDING" | "PAID" | "REFUNDED"
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
  status: string
  patient: { id: string; name: string; email: string | null }
  doctor: { name: string }
  service: { name: string; price: number } | null
}

interface Stats {
  totalRevenue: number
  paidCount: number
  pendingCount: number
  unpaidCount: number
  refundedCount: number
}

const paymentColors: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20",
  PENDING: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20",
  UNPAID: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/20",
  REFUNDED: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/20",
}

const paymentLabels: Record<string, string> = {
  PAID: "Plătit",
  PENDING: "În procesare",
  UNPAID: "Neachitat",
  REFUNDED: "Rambursat",
}

export default function BillingPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [pageSize, setPageSize] = useState(10)

  const [appointments, setAppointments] = useState<PaymentAppointment[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [total, setTotal] = useState(0)
  const [pageCount, setPageCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("current-month")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<string | null>(null)
  const [sendLinkLoadingId, setSendLinkLoadingId] = useState<string | null>(null)
  const [refundConfirm, setRefundConfirm] = useState<PaymentAppointment | null>(null)
  const redirectHandled = useRef(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      params.set("period", periodFilter)
      params.set("page", String(page))
      params.set("pageSize", String(pageSize))
      const res = await fetch(`/api/payments?${params}`)
      const data = await res.json()
      setAppointments(data.appointments ?? [])
      setTotal(data.total ?? 0)
      setPageCount(data.pageCount ?? 0)
      setStats(data.stats ?? null)
    } catch {
      toast({ title: "Eroare", description: "Nu s-au putut încărca datele de plată.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, periodFilter, page, pageSize])

  useEffect(() => { fetchData() }, [fetchData])
  useRealtimeEvent("payment_updated", fetchData)

  // Handle Stripe redirect params (show once per navigation)
  useEffect(() => {
    if (redirectHandled.current) return
    const payment = searchParams.get("payment")
    if (payment === "success") {
      redirectHandled.current = true
      toast({ title: "Plată reușită!", description: "Programarea a fost marcată ca plătită." })
    } else if (payment === "cancelled") {
      redirectHandled.current = true
      toast({ title: "Plată anulată", description: "Sesiunea de plată a fost închisă.", variant: "destructive" })
    }
  }, [searchParams, toast])

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1) }, [statusFilter, periodFilter])

  const sendPaymentLink = async (appointmentId: string) => {
    setSendLinkLoadingId(appointmentId)
    try {
      const res = await fetch("/api/checkout/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Eroare la trimiterea link-ului")
      toast({ title: "Link trimis", description: "Email-ul cu link de plată a fost trimis pacientului." })
      fetchData()
    } catch (err) {
      toast({ title: "Eroare", description: err instanceof Error ? err.message : "Nu s-a putut trimite email-ul.", variant: "destructive" })
    } finally {
      setSendLinkLoadingId(null)
    }
  }

  const confirmRefund = async (appt: PaymentAppointment) => {
    setRefundConfirm(null)
    await updatePaymentStatus(appt.id, "REFUNDED")
  }

  const initiateCheckout = async (appointmentId: string) => {
    setCheckoutLoadingId(appointmentId)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Eroare la crearea sesiunii de plată")
      window.location.href = data.url
    } catch (err) {
      toast({ title: "Eroare", description: err instanceof Error ? err.message : "Nu s-a putut iniția plata.", variant: "destructive" })
      setCheckoutLoadingId(null)
    }
  }

  const updatePaymentStatus = async (appointmentId: string, paymentStatus: string) => {
    setUpdatingId(appointmentId)
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, paymentStatus }),
      })
      if (!res.ok) throw new Error()
      setAppointments((prev) =>
        prev.map((a) => a.id === appointmentId ? { ...a, paymentStatus: paymentStatus as any } : a)
      )
      fetchData()
      toast({ title: "Status actualizat", description: `Plata a fost marcată ca ${paymentLabels[paymentStatus]}.` })
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut actualiza statusul.", variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  const statCards = [
    {
      label: "Venituri Încasate",
      value: stats ? `${stats.totalRevenue.toLocaleString("ro-RO")} lei` : "—",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "from-emerald-500/10 to-teal-500/5",
      border: "border-emerald-500/10",
    },
    {
      label: "Plăți Confirmate",
      value: stats?.paidCount ?? "—",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "from-emerald-500/10 to-teal-500/5",
      border: "border-emerald-500/10",
    },
    {
      label: "În Procesare",
      value: stats?.pendingCount ?? "—",
      icon: Clock,
      color: "text-amber-600",
      bg: "from-amber-500/10 to-orange-500/5",
      border: "border-amber-500/10",
    },
    {
      label: "Neachitate",
      value: stats?.unpaidCount ?? "—",
      icon: CreditCard,
      color: "text-slate-500",
      bg: "from-slate-500/10 to-slate-400/5",
      border: "border-slate-500/10",
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-1">Plăți & Facturare</h1>
          <p className="text-sm font-medium text-muted-foreground">Gestionează încasările și statusul plăților.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((card) => (
            <Card key={card.label} className="relative overflow-hidden group border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-card/80 p-6 rounded-[24px]">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-[18px] bg-gradient-to-br ${card.bg} border ${card.border} flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">{card.label}</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-muted animate-pulse rounded-xl" />
                  ) : (
                    <span className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">{card.value}</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 h-10 rounded-xl border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="Status plată" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate statusurile</SelectItem>
              <SelectItem value="UNPAID">Neachitat</SelectItem>
              <SelectItem value="PENDING">În procesare</SelectItem>
              <SelectItem value="PAID">Plătit</SelectItem>
              <SelectItem value="REFUNDED">Rambursat</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-48 h-10 rounded-xl border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="Perioadă" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Luna curentă</SelectItem>
              <SelectItem value="last-month">Luna trecută</SelectItem>
              <SelectItem value="last-3-months">Ultimele 3 luni</SelectItem>
              <SelectItem value="this-year">Anul curent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden bg-white dark:bg-card/80 rounded-[24px]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-700/40">
                  <th className="text-left py-4 px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Pacient</th>
                  <th className="text-left py-4 px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Serviciu</th>
                  <th className="text-left py-4 px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Medic</th>
                  <th className="text-left py-4 px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Dată</th>
                  <th className="text-right py-4 px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Sumă</th>
                  <th className="text-center py-4 px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Status Plată</th>
                  <th className="py-4 px-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/30">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm font-bold text-primary uppercase tracking-widest">Se încarcă...</span>
                      </div>
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <CreditCard className="w-10 h-10 opacity-20" />
                        <span className="font-semibold text-sm">Nicio plată găsită pentru filtrele selectate.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{appt.patient.name}</p>
                        {appt.patient.email && (
                          <p className="text-xs text-muted-foreground">{appt.patient.email}</p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{appt.service?.name ?? "—"}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-600 dark:text-slate-400">{appt.doctor.name}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {format(new Date(appt.date), "d MMM yyyy", { locale: ro })}
                        </p>
                        <p className="text-xs text-muted-foreground">{appt.startTime}</p>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                          {appt.service?.price != null ? `${appt.service.price.toLocaleString("ro-RO")} lei` : "—"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge className={`text-xs font-bold border ${paymentColors[appt.paymentStatus]}`}>
                          {paymentLabels[appt.paymentStatus]}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        {updatingId === appt.id || checkoutLoadingId === appt.id || sendLinkLoadingId === appt.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              {appt.paymentStatus === "UNPAID" && appt.service?.price != null && (
                                <DropdownMenuItem
                                  className="gap-2 text-primary focus:text-primary"
                                  onClick={() => initiateCheckout(appt.id)}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Plătește Online
                                </DropdownMenuItem>
                              )}
                              {appt.paymentStatus === "UNPAID" && appt.service?.price != null && appt.patient.email && (
                                <DropdownMenuItem
                                  className="gap-2 text-blue-600 focus:text-blue-600"
                                  onClick={() => sendPaymentLink(appt.id)}
                                >
                                  <Mail className="h-4 w-4" />
                                  Trimite link plată
                                </DropdownMenuItem>
                              )}
                              {appt.paymentStatus !== "PAID" && (
                                <DropdownMenuItem
                                  className="gap-2 text-emerald-600 focus:text-emerald-600"
                                  onClick={() => updatePaymentStatus(appt.id, "PAID")}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Marchează ca Plătit
                                </DropdownMenuItem>
                              )}
                              {appt.paymentStatus === "PAID" && (
                                <DropdownMenuItem
                                  className="gap-2 text-purple-600 focus:text-purple-600"
                                  onClick={() => setRefundConfirm(appt)}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Rambursează
                                </DropdownMenuItem>
                              )}
                              {appt.paymentStatus !== "UNPAID" && (
                                <DropdownMenuItem
                                  className="gap-2 text-slate-600 focus:text-slate-600"
                                  onClick={() => updatePaymentStatus(appt.id, "UNPAID")}
                                >
                                  <Ban className="h-4 w-4" />
                                  Resetează la Neachitat
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} loading={loading} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </Card>
      </div>

      {/* Refund confirmation dialog */}
      <Dialog open={!!refundConfirm} onOpenChange={(o) => { if (!o) setRefundConfirm(null) }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmare rambursare</DialogTitle>
            <DialogDescription>
              {refundConfirm?.stripePaymentIntentId
                ? `Această acțiune va rambursa ${refundConfirm.service?.price?.toLocaleString("ro-RO")} lei pe cardul pacientului ${refundConfirm.patient.name}. Operațiunea nu poate fi anulată.`
                : `Marchezi plata de la ${refundConfirm?.patient.name} ca rambursată? (plată în numerar — rambursarea fizică trebuie efectuată separat)`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setRefundConfirm(null)}>
              Anulare
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={() => refundConfirm && confirmRefund(refundConfirm)}
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              {refundConfirm?.stripePaymentIntentId ? "Rambursează prin Stripe" : "Marchează Rambursat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
