import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/medical-records/[id]
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, name: true } },
        appointment: {
          select: {
            id: true,
            date: true,
            startTime: true,
            doctor: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!record) {
      return NextResponse.json({ error: "Medical record not found" }, { status: 404 })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error("Error fetching medical record:", error)
    return NextResponse.json({ error: "Failed to fetch medical record" }, { status: 500 })
  }
}

// PUT /api/medical-records/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()

    const record = await prisma.medicalRecord.update({
      where: { id },
      data: {
        visitDate: body.visitDate ? new Date(body.visitDate) : undefined,
        symptoms: body.symptoms ?? undefined,
        diagnosis: body.diagnosis ?? undefined,
        treatment: body.treatment ?? undefined,
        prescription: body.prescription ?? undefined,
        notes: body.notes ?? undefined,
        followUpRequired: body.followUpRequired ?? undefined,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : body.followUpDate === null ? null : undefined,
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error("Error updating medical record:", error)
    return NextResponse.json({ error: "Failed to update medical record" }, { status: 500 })
  }
}

// DELETE /api/medical-records/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await prisma.medicalRecord.delete({ where: { id } })
    return NextResponse.json({ message: "Medical record deleted" })
  } catch (error) {
    console.error("Error deleting medical record:", error)
    return NextResponse.json({ error: "Failed to delete medical record" }, { status: 500 })
  }
}
