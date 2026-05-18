import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { LoginScreen } from "@/components/login-screen"

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    const role = session.user.role
    if (role === "DOCTOR") redirect("/doctor/dashboard")
    else if (role === "PATIENT") redirect("/patient/dashboard")
    else redirect("/admin")
  }

  return <LoginScreen />
}
