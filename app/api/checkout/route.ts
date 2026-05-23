import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

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
      service: { select: { name: true, price: true } },
    },
  })

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
  }
  if (!appointment.service || appointment.service.price == null) {
    return NextResponse.json({ error: "Appointment has no priced service" }, { status: 400 })
  }
  if (appointment.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Already paid" }, { status: 400 })
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "ron",
          product_data: { name: appointment.service.name },
          // Stripe expects amount in smallest currency unit (bani for RON)
          unit_amount: Math.round(appointment.service.price * 100),
        },
        quantity: 1,
      },
    ],
    customer_email: appointment.patient.email ?? undefined,
    metadata: { appointmentId },
    success_url: `${baseUrl}/billing?payment=success&appointmentId=${appointmentId}`,
    cancel_url: `${baseUrl}/billing?payment=cancelled`,
  })

  // Mark as PENDING while checkout is open
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { paymentStatus: "PENDING", stripeSessionId: checkoutSession.id },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
