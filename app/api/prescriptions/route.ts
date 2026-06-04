import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/prescriptions?patientId=xxx
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ error: "patientId is required" }, { status: 400 })
    }

    if (session.user.role === "DOCTOR") {
      const doctorId = session.user.doctorId
      if (!doctorId) return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 })
      const patient = await prisma.patient.findFirst({
        where: {
          id: patientId,
          OR: [{ primaryDoctorId: doctorId }, { appointments: { some: { doctorId } } }],
        },
        select: { id: true },
      })
      if (!patient) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

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
    console.error("Error fetching prescriptions:", error)
    return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 })
  }
}

// POST /api/prescriptions
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (session.user.role !== "DOCTOR") {
      return NextResponse.json({ error: "Only doctors can create prescriptions" }, { status: 403 })
    }

    const doctorId = session.user.doctorId
    if (!doctorId) return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 })

    const body = await request.json()

    if (!body.patientId || !body.diagnosis) {
      return NextResponse.json({ error: "patientId and diagnosis are required" }, { status: 400 })
    }

    if (!Array.isArray(body.medications) || body.medications.length === 0) {
      return NextResponse.json({ error: "At least one medication is required" }, { status: 400 })
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id: body.patientId,
        OR: [{ primaryDoctorId: doctorId }, { appointments: { some: { doctorId } } }],
      },
      select: { id: true },
    })
    if (!patient) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const year = new Date().getFullYear()
    const lastRx = await prisma.prescription.findFirst({
      where: { number: { startsWith: `RX-${year}-` } },
      orderBy: { number: "desc" },
      select: { number: true },
    })
    const lastNum = lastRx ? parseInt(lastRx.number.split("-")[2], 10) : 0
    const number = `RX-${year}-${String(lastNum + 1).padStart(4, "0")}`

    const prescription = await prisma.prescription.create({
      data: {
        number,
        patientId: body.patientId,
        doctorId,
        appointmentId: body.appointmentId || null,
        diagnosis: body.diagnosis,
        medications: body.medications,
        notes: body.notes || null,
      },
      include: {
        doctor: { select: { id: true, name: true, specialty: true, department: { select: { name: true } } } },
        patient: { select: { id: true, name: true, cnp: true, birthDate: true } },
      },
    })

    return NextResponse.json(prescription, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("number")) {
      return NextResponse.json({ error: "Eroare la generarea numărului rețetei. Reîncercați." }, { status: 409 })
    }
    console.error("Error creating prescription:", error)
    return NextResponse.json({ error: "Failed to create prescription" }, { status: 500 })
  }
}
