import { beforeEach, describe, expect, it, vi } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  settings: { findUnique: vi.fn() },
  appointment: { findMany: vi.fn() },
}))

const sendAppointmentNotification = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/notifications", () => ({ sendAppointmentNotification }))

import { POST } from "@/app/api/notifications/reminders/route"

function makeRequest(body?: unknown): Request {
  return new Request("http://localhost/api/notifications/reminders", {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("POST /api/notifications/reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.settings.findUnique.mockResolvedValue({
      reminderEnabled: true,
      reminderHoursBefore: 24,
      emailNotifications: true,
      smsNotifications: true,
    })
  })

  it("uses the stored SMS opt-in when no explicit sendSMS override is provided", async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000)
    mockPrisma.appointment.findMany.mockResolvedValue([
      {
        id: "apt-1",
        date: future,
        startTime: `${String(future.getHours()).padStart(2, "0")}:${String(future.getMinutes()).padStart(2, "0")}`,
        patient: { name: "Ion Popescu", email: "ion@example.com", phone: "0712345678" },
        doctor: { name: "Dr. Test" },
        department: { name: "Cardiologie" },
        notifications: [{ type: "SMS", event: "BOOKING_RECEIVED" }],
      },
    ])
    sendAppointmentNotification.mockResolvedValue(undefined)

    const res = await POST(makeRequest({}))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.sent).toBe(1)
    expect(sendAppointmentNotification).toHaveBeenCalledWith(
      expect.any(Object),
      "REMINDER",
      expect.objectContaining({
        sendEmail: true,
        sendSMS: true,
      })
    )
  })

  it("skips sending when neither email nor SMS is enabled for the appointment", async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000)
    mockPrisma.settings.findUnique.mockResolvedValue({
      reminderEnabled: true,
      reminderHoursBefore: 24,
      emailNotifications: false,
      smsNotifications: true,
    })
    mockPrisma.appointment.findMany.mockResolvedValue([
      {
        id: "apt-2",
        date: future,
        startTime: `${String(future.getHours()).padStart(2, "0")}:${String(future.getMinutes()).padStart(2, "0")}`,
        patient: { name: "Maria Popescu", email: "maria@example.com", phone: "0711111111" },
        doctor: { name: "Dr. Test" },
        department: { name: "Cardiologie" },
        notifications: [],
      },
    ])

    const res = await POST(makeRequest({}))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.sent).toBe(0)
    expect(sendAppointmentNotification).not.toHaveBeenCalled()
  })

  it("does not count SMS reminders as sent when global SMS notifications are disabled", async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000)
    mockPrisma.settings.findUnique.mockResolvedValue({
      reminderEnabled: true,
      reminderHoursBefore: 24,
      emailNotifications: false,
      smsNotifications: false,
    })
    mockPrisma.appointment.findMany.mockResolvedValue([
      {
        id: "apt-3",
        date: future,
        startTime: `${String(future.getHours()).padStart(2, "0")}:${String(future.getMinutes()).padStart(2, "0")}`,
        patient: { name: "Andrei Popescu", email: "andrei@example.com", phone: "0722222222" },
        doctor: { name: "Dr. Test" },
        department: { name: "Cardiologie" },
        notifications: [{ type: "SMS", event: "BOOKING_RECEIVED" }],
      },
    ])

    const res = await POST(makeRequest({}))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.sent).toBe(0)
    expect(sendAppointmentNotification).not.toHaveBeenCalled()
  })
})
