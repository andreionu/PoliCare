"use client"

import { LoginScreen } from "@/components/login-screen"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // If they are already logged in, redirect them to dashboard
    if (localStorage.getItem("userRole")) {
      router.push("/admin")
    }
  }, [router])

  return <LoginScreen onLogin={() => router.push("/admin")} />
}
