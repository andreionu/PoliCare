import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/medical-records?patientId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    const records = await prisma.medicalRecord.findMany({
      where: patientId ? { patientId } : undefined,
      include: {
        appointment: {
          select: {
            id: true,
            date: true,
            startTime: true,
            doctor: { select: { id: true, name: true, specialty: true } },
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { visitDate: "desc" },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error("Error fetching medical records:", error)
    return NextResponse.json({ error: "Failed to fetch medical records" }, { status: 500 })
  }
}

// POST /api/medical-records
export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.patientId) {
      return NextResponse.json({ error: "patientId is required" }, { status: 400 })
    }

    const record = await prisma.medicalRecord.create({
      data: {
        visitDate: body.visitDate ? new Date(body.visitDate) : new Date(),
        symptoms: body.symptoms || null,
        diagnosis: body.diagnosis || null,
        treatment: body.treatment || null,
        prescription: body.prescription || null,
        notes: body.notes || null,
        followUpRequired: body.followUpRequired ?? false,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        patientId: body.patientId,
        appointmentId: body.appointmentId || null,
      },
      include: {
        appointment: {
          select: {
            id: true,
            date: true,
            doctor: { select: { id: true, name: true } },
          },
        },
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error("Error creating medical record:", error)
    return NextResponse.json({ error: "Failed to create medical record" }, { status: 500 })
  }
}
