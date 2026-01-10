import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/departments/[id] - Get single department
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        doctors: true,
        services: true,
      },
    })

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error("Error fetching department:", error)
    return NextResponse.json(
      { error: "Failed to fetch department" },
      { status: 500 }
    )
  }
}

// PUT /api/departments/[id] - Update department
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        color: body.color,
        icon: body.icon,
        status: body.status,
      },
    })

    return NextResponse.json(department)
  } catch (error) {
    console.error("Error updating department:", error)
    return NextResponse.json(
      { error: "Failed to update department" },
      { status: 500 }
    )
  }
}

// DELETE /api/departments/[id] - Delete department
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.department.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Department deleted" })
  } catch (error) {
    console.error("Error deleting department:", error)
    return NextResponse.json(
      { error: "Failed to delete department" },
      { status: 500 }
    )
  }
}
