import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { emitAppEvent } from "@/lib/event-bus"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const rawBody = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 })
  }

  let event: import("stripe").Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session
    const appointmentId = session.metadata?.appointmentId

    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { status: true },
      })

      const updateData: Record<string, unknown> = {
        paymentStatus: "PAID",
        stripePaymentIntentId: session.payment_intent as string ?? null,
      }

      // Auto-confirm appointments that were awaiting confirmation
      if (appointment?.status === "IN_ASTEPTARE") {
        updateData.status = "CONFIRMAT"
      }

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: updateData,
      })

      emitAppEvent("payment_updated", { appointmentId, paymentStatus: "PAID" })
      emitAppEvent("appointments_updated", { action: "updated" })
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session
    const appointmentId = session.metadata?.appointmentId

    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId, paymentStatus: "PENDING" },
        data: { paymentStatus: "UNPAID", stripeSessionId: null },
      })
      emitAppEvent("payment_updated", { appointmentId, paymentStatus: "UNPAID" })
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as import("stripe").Stripe.Charge
    const paymentIntentId = charge.payment_intent as string | null

    if (paymentIntentId) {
      const appointment = await prisma.appointment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
        select: { id: true },
      })

      if (appointment) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { paymentStatus: "REFUNDED" },
        })
        emitAppEvent("payment_updated", { appointmentId: appointment.id, paymentStatus: "REFUNDED" })
      }
    }
  }

  return NextResponse.json({ received: true })
}
