import type React from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DoctorLayout } from "@/components/doctor-layout"

export default async function DoctorPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")
  if (session.user.role !== "DOCTOR") redirect("/login")

  return (
    <DoctorLayout userName={session.user.name ?? "Medic"}>
      {children}
    </DoctorLayout>
  )
}
