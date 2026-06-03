import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password || typeof token !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Date lipsă" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Parola trebuie să aibă cel puțin 8 caractere" }, { status: 400 })
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, status: true } } },
    })

    if (!record) {
      return NextResponse.json({ error: "Link invalid sau expirat" }, { status: 400 })
    }

    if (record.used) {
      return NextResponse.json({ error: "Linkul a fost deja folosit" }, { status: 400 })
    }

    if (new Date() > record.expiresAt) {
      return NextResponse.json({ error: "Linkul a expirat. Solicită un nou email de resetare." }, { status: 400 })
    }

    if (record.user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Contul este dezactivat" }, { status: 403 })
    }

    const hashed = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { used: true },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[reset-password]", error)
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 })
  }
}
