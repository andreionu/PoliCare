import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  notification: {
    findMany: vi.fn(),
  },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: "user-1", role: "SUPER_ADMIN", name: "Test Admin", email: "admin@test.com" },
  }),
}))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))

import { GET } from "@/app/api/notifications/route"

function makeRequest(searchParams?: Record<string, string>): Request {
  const url = new URL("http://localhost/api/notifications")
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) url.searchParams.set(k, v)
  }
  return new Request(url.toString(), { method: "GET" })
}

const SAMPLE_NOTIF = {
  id: "n1",
  appointmentId: "a1",
  type: "EMAIL",
  event: "CONFIRMATION",
  status: "SENT",
  recipient: "test@example.com",
  message: "<p>Test</p>",
  error: null,
  sentAt: new Date(),
  createdAt: new Date(),
}

describe("GET /api/notifications", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns all notifications when no appointmentId filter", async () => {
    mockPrisma.notification.findMany.mockResolvedValue([SAMPLE_NOTIF])

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe("n1")
  })

  it("filters by appointmentId when provided", async () => {
    mockPrisma.notification.findMany.mockResolvedValue([SAMPLE_NOTIF])

    await GET(makeRequest({ appointmentId: "a1" }))

    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { appointmentId: "a1" } })
    )
  })

  it("passes undefined where when no filter", async () => {
    mockPrisma.notification.findMany.mockResolvedValue([])

    await GET(makeRequest())

    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    )
  })

  it("returns 500 on database error", async () => {
    mockPrisma.notification.findMany.mockRejectedValue(new Error("DB error"))

    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })
})
