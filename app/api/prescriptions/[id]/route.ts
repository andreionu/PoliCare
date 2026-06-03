import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/prescriptions/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        doctor: { select: { id: true, name: true, specialty: true, department: { select: { name: true } } } },
        patient: { select: { id: true, name: true, cnp: true, birthDate: true } },
        appointment: { select: { id: true, date: true, startTime: true } },
      },
    })

    if (!prescription) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (session.user.role === "PATIENT") {
      if (prescription.patientId !== session.user.patientId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.json(prescription)
  } catch (error) {
    console.error("Error fetching prescription:", error)
    return NextResponse.json({ error: "Failed to fetch prescription" }, { status: 500 })
  }
}

// PUT /api/prescriptions/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.prescription.findUnique({ where: { id }, select: { doctorId: true } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (session.user.role === "DOCTOR") {
      if (existing.doctorId !== session.user.doctorId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        ...(body.diagnosis !== undefined && { diagnosis: body.diagnosis }),
        ...(body.medications !== undefined && { medications: body.medications }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.status !== undefined && { status: body.status }),
      },
      include: {
        doctor: { select: { id: true, name: true, specialty: true, department: { select: { name: true } } } },
        patient: { select: { id: true, name: true, cnp: true, birthDate: true } },
      },
    })

    return NextResponse.json(prescription)
  } catch (error) {
    console.error("Error updating prescription:", error)
    return NextResponse.json({ error: "Failed to update prescription" }, { status: 500 })
  }
}

// DELETE /api/prescriptions/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const existing = await prisma.prescription.findUnique({ where: { id }, select: { doctorId: true } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (session.user.role === "DOCTOR") {
      if (existing.doctorId !== session.user.doctorId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.prescription.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting prescription:", error)
    return NextResponse.json({ error: "Failed to delete prescription" }, { status: 500 })
  }
}
