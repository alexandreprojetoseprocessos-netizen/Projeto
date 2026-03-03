import { prisma } from "@gestao/database";
import { Prisma } from "@prisma/client";
import { logger } from "../config/logger";

type AuditClient = Prisma.TransactionClient | typeof prisma;

type WriteAuditLogInput = {
  client?: AuditClient;
  organizationId?: string | null;
  projectId?: string | null;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  diff?: Prisma.InputJsonValue | null;
};

export const writeAuditLog = async ({
  client = prisma,
  organizationId,
  projectId,
  actorId,
  action,
  entity,
  entityId,
  diff
}: WriteAuditLogInput) => {
  try {
    await client.auditLog.create({
      data: {
        organizationId: organizationId ?? null,
        projectId: projectId ?? null,
        actorId: actorId ?? null,
        action,
        entity,
        entityId,
        diff: diff ?? Prisma.JsonNull
      }
    });
  } catch (error) {
    logger.warn(
      {
        err: error,
        action,
        entity,
        entityId,
        organizationId: organizationId ?? null,
        projectId: projectId ?? null,
        actorId: actorId ?? null
      },
      "Failed to persist audit log"
    );
  }
};
