import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/patients - Get all patients (supports ?phone=X and ?search=X filters)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {}
    if (phone) where.phone = phone
    if (search) where.name = { contains: search, mode: "insensitive" }

    const patients = await prisma.patient.findMany({
      where,
      include: {
        primaryDoctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            medicalRecords: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(patients)
  } catch (error) {
    console.error("Error fetching patients:", error)
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    )
  }
}

// POST /api/patients - Create a new patient
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const patient = await prisma.patient.create({
      data: {
        name: body.name,
        cnp: body.cnp,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        age: body.age,
        gender: body.gender,
        phone: body.phone,
        email: body.email,
        address: body.address,
        status: body.status || "NOU",
        notes: body.notes,
        primaryDoctorId: body.primaryDoctorId,
      },
      include: {
        primaryDoctor: { select: { id: true, name: true, specialty: true } },
      },
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    console.error("Error creating patient:", error)
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    )
  }
}
