import { Prisma } from "@prisma/client"
import { prisma } from "./prisma"

let passwordChangedAtSupported: boolean | null = null

export async function hasPasswordChangedAtColumn(): Promise<boolean> {
  if (passwordChangedAtSupported !== null) return passwordChangedAtSupported

  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>(Prisma.sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'User'
        AND column_name = 'passwordChangedAt'
    ) AS "exists"
  `)

  passwordChangedAtSupported = rows[0]?.exists === true
  return passwordChangedAtSupported
}

export async function getPasswordChangedAt(userId: string): Promise<Date | null> {
  if (!(await hasPasswordChangedAtColumn())) return null

  const rows = await prisma.$queryRaw<Array<{ passwordChangedAt: Date | null }>>(Prisma.sql`
    SELECT "passwordChangedAt"
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `)

  return rows[0]?.passwordChangedAt ?? null
}

export async function updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
  if (await hasPasswordChangedAtColumn()) {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE "User"
      SET "password" = ${hashedPassword},
          "passwordChangedAt" = ${new Date()}
      WHERE "id" = ${userId}
    `)
    return
  }

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  })
}
