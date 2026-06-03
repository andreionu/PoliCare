import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email invalid" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, name: true, email: true, status: true },
    })

    // Always respond with success to avoid leaking which emails exist
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ success: true })
    }

    // Delete any existing unused tokens for this user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

    await sendEmail({
      to: user.email,
      subject: "Resetare parolă — PoliCare",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
          <div style="background: #206070; padding: 32px 40px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">PoliCare</h1>
          </div>
          <div style="background: #f8fafc; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800;">Resetare parolă</h2>
            <p style="color: #64748b; margin: 0 0 24px; line-height: 1.6;">
              Bună, <strong>${user.name}</strong>! Am primit o cerere de resetare a parolei pentru contul tău.
              Apasă butonul de mai jos pentru a seta o parolă nouă.
            </p>
            <a href="${resetUrl}"
               style="display: inline-block; background: #206070; color: white; text-decoration: none;
                      padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px;">
              Resetează parola
            </a>
            <p style="color: #94a3b8; margin: 24px 0 0; font-size: 13px; line-height: 1.6;">
              Linkul este valabil <strong>1 oră</strong>. Dacă nu ai solicitat resetarea parolei, ignoră acest email — contul tău este în siguranță.
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[forgot-password]", error)
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 })
  }
}
