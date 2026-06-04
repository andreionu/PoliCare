import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/services/[id]
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const service = await prisma.service.findUnique({
      where: { id },
      include: { department: { select: { id: true, name: true } } },
    })
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }
    return NextResponse.json(service)
  } catch (error) {
    console.error("Error fetching service:", error)
    return NextResponse.json({ error: "Failed to fetch service" }, { status: 500 })
  }
}

// PUT /api/services/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["SUPER_ADMIN", "FRONT_DESK"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id } = await params
    const body = await request.json()

    const service = await prisma.service.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description ?? undefined,
        duration: body.duration !== undefined ? Number(body.duration) : undefined,
        price: body.price !== undefined ? (body.price ? Number(body.price) : null) : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        departmentId: body.departmentId ?? undefined,
      },
      include: { department: { select: { id: true, name: true } } },
    })
    return NextResponse.json(service)
  } catch (error) {
    console.error("Error updating service:", error)
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
  }
}

// DELETE /api/services/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["SUPER_ADMIN", "FRONT_DESK"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id } = await params
    await prisma.service.delete({ where: { id } })
    return NextResponse.json({ message: "Service deleted" })
  } catch (error) {
    console.error("Error deleting service:", error)
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 })
  }
}
