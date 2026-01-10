import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/doctors - Get all doctors
export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        department: true, // Include department info
        _count: {
          select: {
            appointments: true,
            patients: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(doctors)
  } catch (error) {
    console.error("Error fetching doctors:", error)
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 }
    )
  }
}

// POST /api/doctors - Create a new doctor
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const doctor = await prisma.doctor.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        specialty: body.specialty,
        experience: body.experience,
        bio: body.bio,
        avatar: body.avatar,
        status: body.status || "ACTIV",
        departmentId: body.departmentId,
      },
      include: {
        department: true,
      },
    })

    return NextResponse.json(doctor, { status: 201 })
  } catch (error) {
    console.error("Error creating doctor:", error)
    return NextResponse.json(
      { error: "Failed to create doctor" },
      { status: 500 }
    )
  }
}
