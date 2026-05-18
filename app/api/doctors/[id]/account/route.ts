import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const { id } = await params

  const doctor = await prisma.doctor.findUnique({ where: { id } })
  if (!doctor) return NextResponse.json({ message: "Doctor negăsit" }, { status: 404 })
  if (doctor.userId) return NextResponse.json({ message: "Medicul are deja un cont" }, { status: 409 })

  const body = await request.json()
  const { email, temporaryPassword } = body

  if (!email || !temporaryPassword) {
    return NextResponse.json({ message: "Email și parola temporară sunt obligatorii" }, { status: 400 })
  }
  if (temporaryPassword.length < 6) {
    return NextResponse.json({ message: "Parola trebuie să aibă minim 6 caractere" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ message: "Emailul este deja folosit" }, { status: 409 })

  const hashedPassword = await bcrypt.hash(temporaryPassword, 10)

  const user = await prisma.user.create({
    data: {
      email,
      name: doctor.name,
      password: hashedPassword,
      role: "DOCTOR",
      status: "ACTIVE",
    },
  })

  await prisma.doctor.update({ where: { id }, data: { userId: user.id } })

  return NextResponse.json({ message: "Cont creat cu succes", email: user.email }, { status: 201 })
}
