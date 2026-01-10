import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/patients/[id] - Get single patient
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
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
  try {
    const { id } = await params
    const body = await request.json()

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        name: body.name,
        cnp: body.cnp,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        age: body.age,
        gender: body.gender,
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
  } catch (error) {
    console.error("Error updating patient:", error)
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
