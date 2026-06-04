import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/services - Get all services
export async function GET() {
  try {
    const services = await prisma.service.findMany({
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error("Error fetching services:", error)
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    )
  }
}

// POST /api/services - Create a new service
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["SUPER_ADMIN", "FRONT_DESK"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await request.json()

    if (!body.name?.trim() || !body.departmentId || body.duration == null || body.price == null) {
      return NextResponse.json({ error: "Name, departmentId, duration, and price are required" }, { status: 400 })
    }

    const service = await prisma.service.create({
      data: {
        name: body.name,
        description: body.description,
        duration: body.duration,
        price: body.price,
        isActive: body.isActive ?? true,
        departmentId: body.departmentId,
      },
      include: {
        department: true,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error("Error creating service:", error)
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    )
  }
}
