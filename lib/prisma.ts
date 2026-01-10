import { PrismaClient } from "@prisma/client"

// This prevents creating multiple database connections in development
// (Next.js hot-reloads and would create a new connection each time)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
