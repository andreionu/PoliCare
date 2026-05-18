import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

// Disable body parsing — Stripe needs the raw body to verify signatures
export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any
    const appointmentId = session.metadata?.appointmentId

    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { paymentStatus: "PAID" },
      })
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as any
    const appointmentId = session.metadata?.appointmentId

    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { paymentStatus: "UNPAID", stripeSessionId: null },
      })
    }
  }

  return NextResponse.json({ received: true })
}
