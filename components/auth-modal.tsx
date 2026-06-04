"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn, getSession } from "next-auth/react"
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, ArrowRight, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface AuthModalProps {
  open: boolean
  defaultTab?: "login" | "register"
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, defaultTab = "login", onOpenChange }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab)

  // reset tab whenever defaultTab changes (e.g. user clicks "Cont Nou" vs "Autentificare")
  const handleOpenChange = (v: boolean) => {
    if (!v) setTab(defaultTab)
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 gap-0 w-[calc(100vw-24px)] sm:max-w-md rounded-3xl overflow-hidden border-0 shadow-2xl max-h-[92vh] flex flex-col">
        <VisuallyHidden>
          <DialogTitle>{tab === "login" ? "Autentificare" : "Creare Cont"}</DialogTitle>
        </VisuallyHidden>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 border-b border-slate-100">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "py-4 text-sm font-black uppercase tracking-widest transition-colors",
                tab === t
                  ? "text-[#206070] border-b-2 border-[#206070]"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {t === "login" ? "Autentificare" : "Cont Nou"}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {tab === "login" ? (
            <LoginForm onSuccess={() => onOpenChange(false)} onSwitchTab={() => setTab("register")} />
          ) : (
            <RegisterForm onSuccess={() => setTab("login")} onSwitchTab={() => setTab("login")} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Login Form ──────────────────────────────────────────────────────────────

function LoginForm({ onSuccess, onSwitchTab }: { onSuccess: () => void; onSwitchTab: () => void }) {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lockoutTime, setLockoutTime] = useState<number | null>(null)

  const isLocked = !!(lockoutTime && Date.now() < lockoutTime)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (isLocked) {
      const remaining = Math.ceil((lockoutTime! - Date.now()) / 60000)
      setError(`Prea multe încercări. Încearcă din nou în ${remaining} minut(e).`)
      return
    }

    setIsLoading(true)
    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    })

    if (result?.error) {
      const attempts = loginAttempts + 1
      setLoginAttempts(attempts)
      if (attempts >= 5) {
        setLockoutTime(Date.now() + 5 * 60 * 1000)
        setError("Cont blocat temporar. Prea multe încercări eșuate.")
      } else {
        setError(
          result.error === "CredentialsSignin"
            ? `Date de acces invalide. ${5 - attempts} încercări rămase.`
            : result.error
        )
      }
      setIsLoading(false)
    } else {
      const session = await getSession()
      const role = session?.user?.role
      toast({ title: "Autentificare reușită", description: "Bine ai venit în PoliCare!" })
      onSuccess()
      if (role === "DOCTOR") router.push("/doctor/dashboard")
      else if (role === "PATIENT") router.push("/patient/dashboard")
      else router.push("/admin")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bine ai venit</h2>
        <p className="text-sm text-slate-500">Intră în contul tău PoliCare</p>
      </div>

      <div className="space-y-2 group">
        <Label className="text-xs font-black uppercase tracking-widest text-[#206070] opacity-70">Email</Label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#206070] transition-colors" />
          <Input
            type="email"
            placeholder="nume@policare.ro"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading || isLocked}
            className="h-12 pl-11 bg-slate-50 border-slate-200 focus:border-[#206070] focus:ring-[#206070]/10 rounded-2xl font-medium"
          />
        </div>
      </div>

      <div className="space-y-2 group">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-black uppercase tracking-widest text-[#206070] opacity-70">Parolă</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-[#40A0D0] hover:text-[#206070] font-bold transition-colors"
          >
            Ai uitat parola?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#206070] transition-colors" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading || isLocked}
            className="h-12 pl-11 pr-11 bg-slate-50 border-slate-200 focus:border-[#206070] focus:ring-[#206070]/10 rounded-2xl font-medium"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#206070] transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex gap-3 p-3 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-top-2">
          <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 text-[9px] font-bold mt-0.5">!</div>
          <p className="text-xs font-bold text-rose-600">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-12 bg-[#206070] hover:bg-[#1a4d5a] text-white font-black rounded-2xl shadow-lg shadow-[#206070]/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
        disabled={isLoading || isLocked}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Se procesează...
          </div>
        ) : (
          <span className="flex items-center gap-2">
            Conectare <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        )}
      </Button>

      <p className="text-center text-xs text-slate-500">
        Ești pacient nou?{" "}
        <button type="button" onClick={onSwitchTab} className="text-[#206070] font-bold hover:underline">
          Creează un cont
        </button>
      </p>
    </form>
  )
}

// ── Register Form ────────────────────────────────────────────────────────────

function RegisterForm({ onSuccess, onSwitchTab }: { onSuccess: () => void; onSwitchTab: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (form.password !== form.confirmPassword) { setError("Parolele nu coincid."); return }
    if (form.password.length < 8) { setError("Parola trebuie să aibă minim 8 caractere."); return }

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
      <div className="text-center space-y-5 py-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900">Cont creat cu succes!</h3>
          <p className="text-sm text-slate-500 mt-1">Vă puteți autentifica acum.</p>
        </div>
        <Button
          onClick={onSuccess}
          className="w-full h-12 bg-[#206070] hover:bg-[#1a4d5a] text-white font-black rounded-2xl"
        >
          Mergi la Autentificare
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Creare Cont</h2>
        <p className="text-sm text-slate-500">Gestionează-ți programările online</p>
      </div>

      {[
        { key: "name",  icon: User,  type: "text",     label: "Nume complet",      placeholder: "Popescu Ion",       required: true  },
        { key: "email", icon: Mail,  type: "email",    label: "Email",             placeholder: "email@exemplu.ro",  required: true  },
        { key: "phone", icon: Phone, type: "tel",      label: "Telefon (opțional)",placeholder: "07xx xxx xxx",      required: false },
      ].map(({ key, icon: Icon, type, label, placeholder, required }) => (
        <div key={key} className="space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-[#206070] opacity-70">{label}</Label>
          <div className="relative">
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type={type}
              placeholder={placeholder}
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required={required}
              className="h-11 pl-11 bg-slate-50 border-slate-200 rounded-2xl font-medium"
            />
          </div>
        </div>
      ))}

      <div className="space-y-1.5">
        <Label className="text-xs font-black uppercase tracking-widest text-[#206070] opacity-70">Parolă</Label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Minim 8 caractere"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="h-11 pl-11 pr-11 bg-slate-50 border-slate-200 rounded-2xl font-medium"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#206070]">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-black uppercase tracking-widest text-[#206070] opacity-70">Confirmă Parola</Label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Repetați parola"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
            className="h-11 pl-11 pr-11 bg-slate-50 border-slate-200 rounded-2xl font-medium"
          />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#206070]">
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex gap-3 p-3 bg-rose-50 border border-rose-100 rounded-2xl">
          <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 text-[9px] font-bold mt-0.5">!</div>
          <p className="text-xs font-bold text-rose-600">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-12 bg-[#206070] hover:bg-[#1a4d5a] text-white font-black rounded-2xl shadow-lg shadow-[#206070]/20 transition-all hover:scale-[1.02]"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Se creează contul...</div>
        ) : "Creare Cont"}
      </Button>

      <p className="text-center text-xs text-slate-500">
        Ai deja cont?{" "}
        <button type="button" onClick={onSwitchTab} className="text-[#206070] font-bold hover:underline">
          Autentifică-te
        </button>
      </p>
    </form>
  )
}
