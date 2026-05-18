import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const patientId = session.user.patientId
  if (!patientId) return NextResponse.json({ error: "Profilul de pacient nu a fost găsit" }, { status: 404 })

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, name: true, phone: true, email: true, address: true, birthDate: true, gender: true },
  })

  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(patient)
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const patientId = session.user.patientId
  if (!patientId) return NextResponse.json({ error: "Profilul de pacient nu a fost găsit" }, { status: 404 })

  try {
    const body = await request.json()
    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        name: body.name ?? undefined,
        phone: body.phone ?? undefined,
        email: body.email ?? undefined,
        address: body.address ?? undefined,
      },
      select: { id: true, name: true, phone: true, email: true, address: true },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
