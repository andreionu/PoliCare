import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { normalizeEmail, normalizePhone } from "@/lib/contact"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, password } = body
    const normalizedEmail = normalizeEmail(email)
    const normalizedPhone = normalizePhone(phone)

    if (!name || !normalizedEmail || !password) {
      return NextResponse.json({ message: "Numele, emailul și parola sunt obligatorii" }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ message: "Parola trebuie să aibă minim 8 caractere" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ message: "Adresa de email nu este validă" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existingUser) {
      return NextResponse.json({ message: "Există deja un cont cu această adresă de email" }, { status: 409 })
    }

    if (normalizedPhone) {
      const [existingPhoneUser, linkedPatientWithPhone] = await Promise.all([
        prisma.user.findFirst({ where: { phone: normalizedPhone }, select: { id: true } }),
        prisma.patient.findMany({
          where: {
            userId: { not: null },
            phone: { not: null },
          },
          select: {
            id: true,
            phone: true,
          },
          orderBy: { createdAt: "desc" },
        }),
      ])

      if (existingPhoneUser || linkedPatientWithPhone.some((patient) => normalizePhone(patient.phone) === normalizedPhone)) {
        return NextResponse.json({ message: "Există deja un cont cu acest număr de telefon" }, { status: 409 })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const candidatePatients = await prisma.patient.findMany({
      where: {
        userId: null,
        OR: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
          ...(normalizedPhone ? [{ phone: { not: null } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    })
    const existingPatient =
      candidatePatients.find((patient) => patient.email === normalizedEmail) ??
      candidatePatients.find((patient) => normalizePhone(patient.phone) === normalizedPhone) ??
      null

    // Create user + link/create patient atomically so a partial failure doesn't leave an orphaned User
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          name,
          phone: normalizedPhone,
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
            email: normalizedEmail,
            phone: normalizedPhone,
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
