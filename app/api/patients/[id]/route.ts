import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/patients/[id] - Get single patient
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        primaryDoctor: true,
        appointments: {
          include: {
            doctor: true,
            department: true,
          },
          orderBy: { date: "desc" },
        },
        medicalRecords: {
          orderBy: { visitDate: "desc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
    }

    // Role-based access control
    if (session.user.role === "PATIENT") {
      if (patient.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (session.user.role === "DOCTOR") {
      const doctorId = session.user.doctorId
      const hasRelation =
        patient.primaryDoctorId === doctorId ||
        patient.appointments.some((a) => a.doctorId === doctorId)
      if (!hasRelation) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error("Error fetching patient:", error)
    return NextResponse.json(
      { error: "Failed to fetch patient" },
      { status: 500 }
    )
  }
}

// PUT /api/patients/[id] - Update patient
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: any;
  try {
    const { id } = await params
    body = await request.json()

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        name: body.name,
        cnp: body.cnp !== undefined ? (body.cnp || null) : undefined,
        birthDate: body.birthDate !== undefined ? (body.birthDate ? new Date(body.birthDate) : null) : undefined,
        age: body.age,
        gender: body.gender !== undefined ? (body.gender || null) : undefined,
        phone: body.phone,
        email: body.email,
        address: body.address,
        status: body.status,
        notes: body.notes,
        primaryDoctorId: body.primaryDoctorId,
      },
      include: {
        primaryDoctor: true,
      },
    })

    return NextResponse.json(patient)
  } catch (error: any) {
    console.error("Error updating patient:", error)
    
    // Handle CNP uniqueness conflict
    if (error.code === 'P2002' && error.meta?.target?.includes('cnp')) {
       try {
         if (body && body.cnp) {
           const existing = await prisma.patient.findUnique({ where: { cnp: body.cnp } });
           if (existing && existing.id !== (await params).id) {
             return NextResponse.json(
               { error: "Un alt pacient este deja înregistrat cu acest CNP.", existingPatientId: existing.id },
               { status: 409 }
             )
           }
         }
       } catch (e) {
         console.error("Error finding conflicting patient:", e)
       }
    }
    
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 500 }
    )
  }
}

// DELETE /api/patients/[id] - Delete patient
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.patient.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Patient deleted" })
  } catch (error) {
    console.error("Error deleting patient:", error)
    return NextResponse.json(
      { error: "Failed to delete patient" },
      { status: 500 }
    )
  }
}
