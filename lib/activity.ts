import { prisma } from "./prisma"
import type { Prisma } from "@prisma/client"

export function logActivity(params: {
  action: string
  entity: string
  entityId?: string
  description: string
  userId?: string | null
  metadata?: Record<string, unknown>
}) {
  void prisma.activityLog
    .create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        description: params.description,
        userId: params.userId ?? undefined,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
    })
    .catch(() => {})
}
