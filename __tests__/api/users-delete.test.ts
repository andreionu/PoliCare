import { beforeEach, describe, expect, it, vi } from "vitest"

const mockSession = vi.hoisted(() => ({
  value: { user: { id: "admin-1", role: "SUPER_ADMIN" } } as any,
}))
const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), delete: vi.fn() },
  patient: { update: vi.fn() },
  activityLog: { create: vi.fn().mockResolvedValue({}) },
  $transaction: vi.fn(async (callback: (tx: any) => unknown) => callback(mockPrisma)),
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
vi.mock("next-auth", () => ({ getServerSession: vi.fn(() => mockSession.value) }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))

import { DELETE } from "@/app/api/users/[id]/route"

const params = (id: string) => ({ params: Promise.resolve({ id }) })

describe("DELETE /api/users/[id]", () => {
  beforeEach(() => vi.clearAllMocks())

  it("keeps the patient record and removes only the linked portal account", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Ion Popescu",
      role: "PATIENT",
      patientProfile: { id: "patient-1" },
    })

    const response = await DELETE(new Request("http://localhost/api/users/user-1"), params("user-1"))

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ patientRecordPreserved: true })
    expect(mockPrisma.patient.update).toHaveBeenCalledWith({
      where: { id: "patient-1" },
      data: { userId: null },
    })
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } })
  })

  it("rejects deleting the currently authenticated account", async () => {
    const response = await DELETE(new Request("http://localhost/api/users/admin-1"), params("admin-1"))

    expect(response.status).toBe(400)
    expect(mockPrisma.user.delete).not.toHaveBeenCalled()
  })

  it("rejects deleting another super-admin account", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "admin-2",
      name: "Second Admin",
      role: "SUPER_ADMIN",
      patientProfile: null,
    })

    const response = await DELETE(new Request("http://localhost/api/users/admin-2"), params("admin-2"))

    expect(response.status).toBe(400)
    expect(mockPrisma.user.delete).not.toHaveBeenCalled()
  })
})
