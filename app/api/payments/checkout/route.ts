import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Plățile online nu sunt configurate." }, { status: 503 })
  }

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const patientId = session.user.patientId
  if (!patientId) return NextResponse.json({ error: "Profilul de pacient nu a fost găsit" }, { status: 404 })

  try {
    const { appointmentId } = await request.json()
    if (!appointmentId) return NextResponse.json({ error: "appointmentId is required" }, { status: 400 })

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { name: true, email: true } },
        doctor: { select: { name: true } },
        department: { select: { name: true } },
        service: { select: { name: true, price: true } },
      },
    })

    if (!appointment) return NextResponse.json({ error: "Programarea nu a fost găsită" }, { status: 404 })
    if (appointment.patientId !== patientId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (appointment.paymentStatus === "PAID") return NextResponse.json({ error: "Programarea este deja plătită" }, { status: 400 })

    const cancellable = ["ANULAT", "NEPREZENTARE"]
    if (cancellable.includes(appointment.status)) {
      return NextResponse.json({ error: "Nu se poate plăti o programare anulată" }, { status: 400 })
    }

    if (!appointment.service?.price || appointment.service.price <= 0) {
      return NextResponse.json({ error: "Această programare nu are un preț asociat" }, { status: 400 })
    }

    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    const apptDate = new Date(appointment.date).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })

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
      customer_email: appointment.patient.email ?? undefined,
      metadata: { appointmentId: appointment.id },
      success_url: `${appUrl}/patient/appointments?payment=success`,
      cancel_url: `${appUrl}/patient/appointments?payment=cancelled`,
    })

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { paymentStatus: "PENDING", stripeSessionId: checkoutSession.id },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error("Stripe checkout error:", err)
    return NextResponse.json({ error: "Nu s-a putut crea sesiunea de plată" }, { status: 500 })
  }
}
