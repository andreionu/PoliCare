import type React from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { PatientLayout } from "@/components/patient-layout"

export default async function PatientPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")
  if (session.user.role !== "PATIENT") redirect("/login")

  return (
    <PatientLayout userName={session.user.name ?? "Pacient"}>
      {children}
    </PatientLayout>
  )
}
