import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const mockPrisma = vi.hoisted(() => ({
  appointment: {
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
}))

const mockStripe = vi.hoisted(() => ({
  refunds: { create: vi.fn() },
}))

const mockGetServerSession = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/stripe", () => ({ stripe: mockStripe }))
vi.mock("@/lib/event-bus", () => ({ emitAppEvent: vi.fn() }))

import { PATCH } from "@/app/api/payments/route"

function makePATCH(body: unknown): Request {
  return new Request("http://localhost/api/payments", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("PATCH /api/payments", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await PATCH(makePATCH({ appointmentId: "appt1", paymentStatus: "PAID" }))
    expect(res.status).toBe(401)
  })

  it("returns 403 for PATIENT role", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "PATIENT" } })
    const res = await PATCH(makePATCH({ appointmentId: "appt1", paymentStatus: "PAID" }))
    expect(res.status).toBe(403)
  })

  it("returns 403 for DOCTOR role", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "DOCTOR" } })
    const res = await PATCH(makePATCH({ appointmentId: "appt1", paymentStatus: "PAID" }))
    expect(res.status).toBe(403)
  })

  it("returns 400 when appointmentId is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "FRONT_DESK" } })
    const res = await PATCH(makePATCH({ paymentStatus: "PAID" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 when paymentStatus is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "FRONT_DESK" } })
    const res = await PATCH(makePATCH({ appointmentId: "appt1" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 for invalid paymentStatus value", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "FRONT_DESK" } })
    const res = await PATCH(makePATCH({ appointmentId: "appt1", paymentStatus: "INVALID" }))
    expect(res.status).toBe(400)
  })

  it("returns 404 when appointment not found", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "FRONT_DESK" } })
    mockPrisma.appointment.findUnique.mockResolvedValue(null)
    const res = await PATCH(makePATCH({ appointmentId: "appt1", paymentStatus: "PAID" }))
    expect(res.status).toBe(404)
  })

  it("marks appointment as PAID without Stripe when no stripePaymentIntentId", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "FRONT_DESK" } })
    mockPrisma.appointment.findUnique.mockResolvedValue({ stripePaymentIntentId: null })
    mockPrisma.appointment.update.mockResolvedValue({ id: "appt1", paymentStatus: "PAID" })

    const res = await PATCH(makePATCH({ appointmentId: "appt1", paymentStatus: "PAID" }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.paymentStatus).toBe("PAID")
    expect(mockStripe.refunds.create).not.toHaveBeenCalled()
  })

  it("triggers real Stripe refund when REFUNDED and has stripePaymentIntentId", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "SUPER_ADMIN" } })
    mockPrisma.appointment.findUnique.mockResolvedValue({ stripePaymentIntentId: "pi_123" })
    mockStripe.refunds.create.mockResolvedValue({ id: "re_1", status: "succeeded" })
    mockPrisma.appointment.update.mockResolvedValue({ id: "appt1", paymentStatus: "REFUNDED" })

    const res = await PATCH(makePATCH({ appointmentId: "appt1", paymentStatus: "REFUNDED" }))
    expect(res.status).toBe(200)
    expect(mockStripe.refunds.create).toHaveBeenCalledWith({ payment_intent: "pi_123" })
  })

  it("skips Stripe refund when REFUNDED but no stripePaymentIntentId", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "SUPER_ADMIN" } })
    mockPrisma.appointment.findUnique.mockResolvedValue({ stripePaymentIntentId: null })
    mockPrisma.appointment.update.mockResolvedValue({ id: "appt1", paymentStatus: "REFUNDED" })

    const res = await PATCH(makePATCH({ appointmentId: "appt1", paymentStatus: "REFUNDED" }))
    expect(res.status).toBe(200)
    expect(mockStripe.refunds.create).not.toHaveBeenCalled()
  })

  it("returns 500 when Stripe refund fails", async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: "SUPER_ADMIN" } })
    mockPrisma.appointment.findUnique.mockResolvedValue({ stripePaymentIntentId: "pi_fail" })
    mockStripe.refunds.create.mockRejectedValue(new Error("Stripe error"))

    const res = await PATCH(makePATCH({ appointmentId: "appt1", paymentStatus: "REFUNDED" }))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toMatch(/Stripe error/)
  })
})
