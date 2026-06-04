import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Numele, emailul și parola sunt obligatorii" }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ message: "Parola trebuie să aibă minim 8 caractere" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Adresa de email nu este validă" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ message: "Există deja un cont cu această adresă de email" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Find an existing unlinked patient before the transaction
    const existingPatient = await prisma.patient.findFirst({
      where: {
        userId: null,
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    })

    // Create user + link/create patient atomically so a partial failure doesn't leave an orphaned User
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          phone: phone || null,
          password: hashedPassword,
          role: "PATIENT",
          status: "ACTIVE",
        },
      })

      if (existingPatient) {
        await tx.patient.update({
          where: { id: existingPatient.id },
          data: { userId: user.id },
        })
      } else {
        await tx.patient.create({
          data: {
            name,
            email,
            phone: phone || null,
            userId: user.id,
            status: "NOU",
          },
        })
      }
    })

    return NextResponse.json({ message: "Cont creat cu succes" }, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ message: "Există deja un cont cu aceste date" }, { status: 409 })
    }
    console.error("[register]", error)
    return NextResponse.json({ message: "Eroare internă" }, { status: 500 })
  }
}
