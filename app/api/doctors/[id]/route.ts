import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
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
        schedules: {
          orderBy: { dayOfWeek: "asc" },
        },
        appointments: {
          take: 20,
          orderBy: { date: "desc" },
          include: {
            patient: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ ...doctor, hasAccount: !!doctor.userId, userId: undefined })
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
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["SUPER_ADMIN", "FRONT_DESK"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id } = await params
    const body = await request.json()

    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.email !== undefined) data.email = body.email
    if (body.phone !== undefined) data.phone = body.phone
    if (body.specialty !== undefined) data.specialty = body.specialty
    if (body.experience !== undefined) data.experience = body.experience
    if (body.bio !== undefined) data.bio = body.bio
    if (body.avatar !== undefined) data.avatar = body.avatar
    if (body.gender !== undefined) data.gender = body.gender
    if (body.status !== undefined) data.status = body.status
    if (body.departmentId !== undefined) data.departmentId = body.departmentId

    const doctor = await prisma.doctor.update({
      where: { id },
      data,
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
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["SUPER_ADMIN", "FRONT_DESK"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

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
