import type React from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { AdminLayout } from "@/components/admin-layout"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")

  const adminRoles = ["SUPER_ADMIN", "FRONT_DESK"]
  if (!adminRoles.includes(session.user.role)) redirect("/login")

  return (
    <AdminLayout userName={session.user.name ?? "Admin"} userRole={session.user.role}>
      {children}
    </AdminLayout>
  )
}
