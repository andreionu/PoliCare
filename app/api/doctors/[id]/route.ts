import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/doctors/[id] - Get single doctor
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        department: true,
        schedules: true,
        appointments: {
          take: 10,
          orderBy: { date: "desc" },
        },
      },
    })

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(doctor)
  } catch (error) {
    console.error("Error fetching doctor:", error)
    return NextResponse.json(
      { error: "Failed to fetch doctor" },
      { status: 500 }
    )
  }
}

// PUT /api/doctors/[id] - Update doctor
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        specialty: body.specialty,
        experience: body.experience,
        bio: body.bio,
        avatar: body.avatar,
        status: body.status,
        departmentId: body.departmentId,
      },
      include: {
        department: true,
      },
    })

    return NextResponse.json(doctor)
  } catch (error) {
    console.error("Error updating doctor:", error)
    return NextResponse.json(
      { error: "Failed to update doctor" },
      { status: 500 }
    )
  }
}

// DELETE /api/doctors/[id] - Delete doctor
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.doctor.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Doctor deleted" })
  } catch (error) {
    console.error("Error deleting doctor:", error)
    return NextResponse.json(
      { error: "Failed to delete doctor" },
      { status: 500 }
    )
  }
}
