import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { sendEmail } from "@/lib/email"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["SUPER_ADMIN", "FRONT_DESK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const { appointmentId } = await request.json()
  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId required" }, { status: 400 })
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { name: true, email: true } },
      doctor: { select: { name: true } },
      service: { select: { name: true, price: true } },
    },
  })

  if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
  if (!appointment.patient.email) return NextResponse.json({ error: "Pacientul nu are adresă de email" }, { status: 400 })
  if (!appointment.service || appointment.service.price == null) {
    return NextResponse.json({ error: "Appointment has no priced service" }, { status: 400 })
  }
  if (appointment.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Already paid" }, { status: 400 })
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const apptDate = new Date(appointment.date).toLocaleDateString("ro-RO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "ron",
          unit_amount: Math.round(appointment.service.price * 100),
          product_data: {
            name: appointment.service.name,
            description: `Consultație ${appointment.doctor.name.replace(/^(Dr\.\s*)+/i, "Dr. ")} · ${apptDate} ${appointment.startTime}`,
          },
        },
        quantity: 1,
      },
    ],
    customer_email: appointment.patient.email,
    metadata: { appointmentId },
    success_url: `${baseUrl}/patient/appointments?payment=success`,
    cancel_url: `${baseUrl}/patient/appointments?payment=cancelled`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h expiry
  })

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { paymentStatus: "PENDING", stripeSessionId: checkoutSession.id },
  })

  const priceStr = appointment.service.price.toLocaleString("ro-RO") + " lei"

  const result = await sendEmail({
    to: appointment.patient.email,
    subject: `Plată în așteptare — ${appointment.service.name} cu ${appointment.doctor.name.replace(/^(Dr\.\s*)+/i, "Dr. ")}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #206070; padding: 28px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800;">PoliCare</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">Sistem de Gestiune Medicală</p>
        </div>
        <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="font-size: 16px; margin: 0 0 8px;">Bună ziua, <strong>${appointment.patient.name}</strong>,</p>
          <p style="color: #475569; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
            Aveți o programare achitabilă online. Detaliile sunt mai jos.
          </p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="color: #64748b; padding: 6px 0;">Serviciu</td><td style="font-weight: 700; text-align: right;">${appointment.service.name}</td></tr>
              <tr><td style="color: #64748b; padding: 6px 0;">Medic</td><td style="font-weight: 600; text-align: right;">${appointment.doctor.name.replace(/^(Dr\.\s*)+/i, "Dr. ")}</td></tr>
              <tr><td style="color: #64748b; padding: 6px 0;">Data</td><td style="font-weight: 600; text-align: right; text-transform: capitalize;">${apptDate}</td></tr>
              <tr><td style="color: #64748b; padding: 6px 0;">Ora</td><td style="font-weight: 600; text-align: right;">${appointment.startTime}</td></tr>
              <tr style="border-top: 1px solid #e2e8f0;"><td style="color: #1a1a1a; font-weight: 700; padding: 12px 0 6px;">Total de plată</td><td style="font-size: 18px; font-weight: 800; color: #206070; text-align: right; padding: 12px 0 6px;">${priceStr}</td></tr>
            </table>
          </div>
          <a href="${checkoutSession.url}" style="display: block; text-align: center; background: #206070; color: white; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 24px; border-radius: 10px; margin-bottom: 16px;">
            Plătește acum →
          </a>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            Link-ul este valabil 24 de ore. Plata este securizată prin Stripe.
          </p>
        </div>
      </div>
    `,
  })

  if (!result.success) {
    return NextResponse.json({ error: `Email failed: ${result.error}` }, { status: 500 })
  }

  return NextResponse.json({ sent: true })
}
