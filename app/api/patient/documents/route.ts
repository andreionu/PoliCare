import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "PATIENT") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const patientId = session.user.patientId
  if (!patientId) return NextResponse.json({ message: "Profilul de pacient nu a fost găsit" }, { status: 404 })

  const documents = await prisma.document.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(documents)
}
