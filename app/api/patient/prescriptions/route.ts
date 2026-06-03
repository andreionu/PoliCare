import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/patient/prescriptions
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const patientId = session.user.patientId
    if (!patientId) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 })

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId },
      include: {
        doctor: { select: { id: true, name: true, specialty: true, department: { select: { name: true } } } },
        patient: { select: { id: true, name: true, cnp: true, birthDate: true } },
        appointment: { select: { id: true, date: true, startTime: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(prescriptions)
  } catch (error) {
    console.error("Error fetching patient prescriptions:", error)
    return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 })
  }
}
