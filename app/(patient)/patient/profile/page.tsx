"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Loader2, Pencil, X, Save, Lock, User, Phone, Mail, MapPin,
  ChevronRight, ShieldCheck, Eye, EyeOff,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function PatientProfilePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({ name: "", phone: "", email: "", address: "" })
  const [draft, setDraft] = useState({ name: "", phone: "", email: "", address: "" })

  const [showPw, setShowPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })

  useEffect(() => {
    fetch("/api/patient/profile")
      .then((r) => r.json())
      .then((data) => {
        const p = { name: data.name ?? "", phone: data.phone ?? "", email: data.email ?? "", address: data.address ?? "" }
        setProfile(p)
        setDraft(p)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?"

  const startEdit = () => { setDraft({ ...profile }); setEditing(true) }
  const cancelEdit = () => { setDraft({ ...profile }); setEditing(false) }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/patient/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      })
      if (!res.ok) throw new Error()
      setProfile({ ...draft })
      setEditing(false)
      toast({ title: "Profil actualizat cu succes" })
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut salva profilul.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast({ title: "Eroare", description: "Parolele nu coincid.", variant: "destructive" })
      return
    }
    if (pwForm.newPassword.length < 8) {
      toast({ title: "Eroare", description: "Parola trebuie să aibă cel puțin 8 caractere.", variant: "destructive" })
      return
    }
    setSavingPw(true)
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Eroare")
      toast({ title: "Parolă schimbată cu succes" })
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setPwOpen(false)
    } catch (e: any) {
      toast({ title: "Eroare", description: e.message, variant: "destructive" })
    } finally {
      setSavingPw(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <main className="flex-1 p-4 sm:p-6 w-full max-w-lg mx-auto space-y-4">

      {/* ── Profile header card ── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#206070] to-[#2a7d90] p-6 text-white shadow-xl shadow-[#206070]/20">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative flex items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 border-2 border-white/30 shadow-lg">
            <span className="text-2xl font-black text-white">{initials}</span>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black truncate">{profile.name || "Pacient"}</h1>
            <p className="text-sm text-white/70 truncate mt-0.5">{profile.email}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Cont activ
            </div>
          </div>
        </div>
      </div>

      {/* ── Personal info ── */}
      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Informații Personale</h2>
          {!editing ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" /> Editează
            </button>
          ) : (
            <button
              onClick={cancelEdit}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Anulează
            </button>
          )}
        </div>

        <div className="px-5 pb-5 space-y-1">
          <InfoRow
            icon={User}
            label="Nume complet"
            value={draft.name}
            editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
          />
          <InfoRow
            icon={Phone}
            label="Telefon"
            value={draft.phone}
            editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, phone: v }))}
            type="tel"
          />
          <InfoRow
            icon={Mail}
            label="Email"
            value={draft.email}
            editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
            type="email"
          />
          <InfoRow
            icon={MapPin}
            label="Adresă"
            value={draft.address}
            editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, address: v }))}
            last
          />
        </div>

        {editing && (
          <div className="px-5 pb-5">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-11 rounded-2xl bg-[#206070] hover:bg-[#1a4d5a] text-white font-black shadow-md shadow-[#206070]/20 transition-all hover:scale-[1.01]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvează modificările
            </Button>
          </div>
        )}
      </div>

      {/* ── Security ── */}
      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setPwOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-slate-800">Securitate</p>
              <p className="text-xs text-slate-400">Schimbă parola contului</p>
            </div>
          </div>
          <ChevronRight className={cn("h-4 w-4 text-slate-400 transition-transform", pwOpen && "rotate-90")} />
        </button>

        {pwOpen && (
          <div className="px-5 pb-5 space-y-4 border-t border-slate-50 pt-4">
            <PasswordField
              label="Parola curentă"
              value={pwForm.currentPassword}
              onChange={(v) => setPwForm((p) => ({ ...p, currentPassword: v }))}
              show={showPw}
              onToggle={() => setShowPw((s) => !s)}
            />
            <PasswordField
              label="Parolă nouă"
              value={pwForm.newPassword}
              onChange={(v) => setPwForm((p) => ({ ...p, newPassword: v }))}
              show={showNewPw}
              onToggle={() => setShowNewPw((s) => !s)}
              hint="Minim 8 caractere"
            />
            <PasswordField
              label="Confirmă parola nouă"
              value={pwForm.confirmPassword}
              onChange={(v) => setPwForm((p) => ({ ...p, confirmPassword: v }))}
            />
            <Button
              onClick={handleChangePassword}
              disabled={savingPw || !pwForm.currentPassword || !pwForm.newPassword}
              className="w-full h-11 rounded-2xl bg-[#206070] hover:bg-[#1a4d5a] text-white font-black shadow-md shadow-[#206070]/20 transition-all hover:scale-[1.01]"
            >
              {savingPw ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              Schimbă Parola
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon, label, value, editing, onChange, type = "text", last = false,
}: {
  icon: any; label: string; value: string; editing: boolean
  onChange: (v: string) => void; type?: string; last?: boolean
}) {
  return (
    <div className={cn("py-3", !last && "border-b border-slate-50")}>
      {editing ? (
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-[#206070] opacity-70">{label}</Label>
          <div className="relative">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 pl-9 rounded-xl bg-slate-50 border-slate-200 focus:border-[#206070] text-sm font-medium"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
            <Icon className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{value || <span className="text-slate-300 font-normal italic">—</span>}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function PasswordField({
  label, value, onChange, show, onToggle, hint,
}: {
  label: string; value: string; onChange: (v: string) => void
  show?: boolean; onToggle?: () => void; hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-black uppercase tracking-widest text-[#206070] opacity-70">{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 pl-9 pr-9 rounded-xl bg-slate-50 border-slate-200 focus:border-[#206070] text-sm font-medium"
          placeholder="••••••••"
        />
        {onToggle && (
          <button type="button" onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#206070] transition-colors">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] text-slate-400 pl-1">{hint}</p>}
    </div>
  )
}
