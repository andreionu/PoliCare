"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Loader2, UserPlus, Mail, Lock, User, Phone } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (form.password !== form.confirmPassword) {
      setError("Parolele nu coincid.")
      return
    }
    if (form.password.length < 8) {
      setError("Parola trebuie să aibă minim 8 caractere.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone || undefined, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Eroare la înregistrare")
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-8">
        <div className="w-full max-w-md text-center space-y-6 animate-in fade-in">
          <Logo size="lg" className="mx-auto" />
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <UserPlus className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Cont creat cu succes!</h2>
          <p className="text-slate-500 font-medium">Vă puteți autentifica acum cu adresa de email și parola aleasă.</p>
          <Link
            href="/login"
            className="inline-block w-full py-4 px-8 bg-[#206070] hover:bg-[#1a4d5a] text-white font-black rounded-[20px] transition-all hover:scale-[1.02]"
          >
            Mergi la Autentificare
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-8">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center space-y-3">
          <Logo size="lg" className="mx-auto" />
          <h2 className="text-4xl font-black text-slate-900 tracking-tight italic">Înregistrare</h2>
          <p className="text-slate-500 font-medium">
            Creați un cont pentru a vă gestiona programările.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-[#206070] opacity-70">Nume complet</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Popescu Ion"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="h-14 pl-12 bg-white border-slate-200 rounded-[20px] font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-[#206070] opacity-70">Email</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="email"
                placeholder="email@exemplu.ro"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="h-14 pl-12 bg-white border-slate-200 rounded-[20px] font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-[#206070] opacity-70">Telefon (opțional)</Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="tel"
                placeholder="07xx xxx xxx"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-14 pl-12 bg-white border-slate-200 rounded-[20px] font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-[#206070] opacity-70">Parolă</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Minim 8 caractere"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="h-14 pl-12 pr-12 bg-white border-slate-200 rounded-[20px] font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#206070]"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-[#206070] opacity-70">Confirmă Parola</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repetați parola"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className="h-14 pl-12 pr-12 bg-white border-slate-200 rounded-[20px] font-medium"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#206070]"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">!</div>
              <p className="text-sm font-bold text-rose-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-14 bg-[#206070] hover:bg-[#1a4d5a] text-white font-black rounded-[20px] shadow-xl shadow-[#206070]/20 transition-all hover:scale-[1.02]"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Se creează contul...</span>
              </div>
            ) : "Creare Cont"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Aveți deja cont?{" "}
          <Link href="/login" className="text-[#206070] font-bold hover:underline">
            Autentificați-vă
          </Link>
        </p>
      </div>
    </div>
  )
}
