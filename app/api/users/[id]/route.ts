import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Role, UserStatus } from "@prisma/client"
import bcrypt from "bcryptjs"
import { updateUserPassword } from "@/lib/password-change"
import { logActivity } from "@/lib/activity"

// GET /api/users/[id]
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

// PUT /api/users/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id } = await params
    const body = await request.json()

    const updateData: {
      name?: string
      email?: string
      phone?: string
      role?: Role
      status?: UserStatus
      password?: string
    } = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.role !== undefined) updateData.role = body.role as Role
    if (body.status !== undefined) updateData.status = body.status as UserStatus
    if (body.password) {
      const hashedPassword = await bcrypt.hash(body.password, 10)
      await updateUserPassword(id, hashedPassword)
    }

    const user = Object.keys(updateData).length > 0
      ? await prisma.user.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
        })
      : await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
        })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

// DELETE /api/users/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id } = await params
    if (id === session.user.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true, patientProfile: { select: { id: true } } },
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Super-admin accounts cannot be deleted" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // Keep the medical record and its history; only revoke portal access.
      if (user.patientProfile) {
        await tx.patient.update({
          where: { id: user.patientProfile.id },
          data: { userId: null },
        })
      }
      await tx.user.delete({ where: { id } })
    })

    logActivity({
      action: "DELETE",
      entity: "user",
      entityId: id,
      description: `Cont utilizator șters: ${user.name}`,
      userId: session.user.id,
      metadata: { patientRecordPreserved: Boolean(user.patientProfile) },
    })

    return NextResponse.json({
      message: "User deleted",
      patientRecordPreserved: Boolean(user.patientProfile),
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
