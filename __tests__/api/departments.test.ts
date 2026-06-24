import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  department: {
    findMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

import { GET as listGET, POST } from "@/app/api/departments/route"
import { GET as detailGET, PUT, DELETE } from "@/app/api/departments/[id]/route"

function makeListRequest(method: string, body?: unknown): Request {
  return new Request("http://localhost/api/departments", {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeIdRequest(method: string, id: string, body?: unknown): Request {
  return new Request(`http://localhost/api/departments/${id}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeIdParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe("GET /api/departments", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns list of departments", async () => {
    const depts = [
      { id: "d1", name: "Cardiologie", status: "ACTIV", _count: { doctors: 3, appointments: 10 } },
      { id: "d2", name: "Pediatrie", status: "ACTIV", _count: { doctors: 2, appointments: 5 } },
    ]
    mockPrisma.department.findMany.mockResolvedValue(depts)

    const res = await listGET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].name).toBe("Cardiologie")
  })

  it("returns 500 on database error", async () => {
    mockPrisma.department.findMany.mockRejectedValue(new Error("DB error"))

    const res = await listGET()
    expect(res.status).toBe(500)
  })
})

describe("POST /api/departments", () => {
  beforeEach(() => vi.clearAllMocks())

  it("creates department and returns 201", async () => {
    const body = { name: "Neurologie", description: "Boli neurologice", color: "blue", icon: "Building2" }
    mockPrisma.department.create.mockResolvedValue({ id: "d3", ...body, status: "ACTIV" })

    const res = await POST(makeListRequest("POST", body))

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.name).toBe("Neurologie")
  })

  it("defaults status to ACTIV", async () => {
    mockPrisma.department.create.mockResolvedValue({ id: "d4", name: "ORL", status: "ACTIV" })

    await POST(makeListRequest("POST", { name: "ORL" }))

    const call = mockPrisma.department.create.mock.calls[0][0]
    expect(call.data.status).toBe("ACTIV")
  })
})

describe("PUT /api/departments/[id]", () => {
  beforeEach(() => vi.clearAllMocks())

  it("updates department fields", async () => {
    const updated = { id: "d1", name: "Cardiologie Avansată", status: "ACTIV" }
    mockPrisma.department.update.mockResolvedValue(updated)

    const res = await PUT(makeIdRequest("PUT", "d1", { name: "Cardiologie Avansată" }), makeIdParams("d1"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.name).toBe("Cardiologie Avansată")
  })

  it("can set department to INACTIV", async () => {
    mockPrisma.department.update.mockResolvedValue({ id: "d1", name: "Old", status: "INACTIV" })

    await PUT(makeIdRequest("PUT", "d1", { status: "INACTIV" }), makeIdParams("d1"))

    const call = mockPrisma.department.update.mock.calls[0][0]
    expect(call.data.status).toBe("INACTIV")
  })
})

describe("DELETE /api/departments/[id]", () => {
  beforeEach(() => vi.clearAllMocks())

  it("deletes the department and returns success message", async () => {
    mockPrisma.department.delete.mockResolvedValue({ id: "d1" })

    const res = await DELETE(makeIdRequest("DELETE", "d1"), makeIdParams("d1"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.message).toBeDefined()
    expect(mockPrisma.department.delete).toHaveBeenCalledWith({ where: { id: "d1" } })
  })
})
