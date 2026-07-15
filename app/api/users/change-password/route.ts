import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { updateUserPassword } from "@/lib/password-change"

// POST /api/users/change-password
// Body: { email, currentPassword, newPassword }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, currentPassword, newPassword } = body

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "Toate câmpurile sunt obligatorii" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Parola nouă trebuie să aibă cel puțin 6 caractere" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (!user) {
      return NextResponse.json({ error: "Email sau parolă incorectă" }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: "Parola curentă este incorectă" }, { status: 401 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await updateUserPassword(user.id, hashedPassword)

    return NextResponse.json({ message: "Parola a fost schimbată cu succes" })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "Nu s-a putut schimba parola" }, { status: 500 })
  }
}
