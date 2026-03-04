import { prisma } from "@gestao/database";
import { Prisma, type IntegrationImportJob } from "@prisma/client";

type ImportJobClient = Prisma.TransactionClient | typeof prisma;

const asInputJson = (value: Record<string, unknown>) => value as Prisma.InputJsonValue;

export const createImportJob = async ({
  client = prisma,
  organizationId,
  createdById,
  source,
  entity,
  fileName,
  summary
}: {
  client?: ImportJobClient;
  organizationId: string;
  createdById: string;
  source: string;
  entity: string;
  fileName?: string | null;
  summary?: Record<string, unknown>;
}) =>
  client.integrationImportJob.create({
    data: {
      organizationId,
      createdById,
      source,
      entity,
      status: "PROCESSING",
      fileName: fileName ?? null,
      summary: summary ? asInputJson(summary) : Prisma.JsonNull
    }
  });

export const completeImportJob = async ({
  client = prisma,
  jobId,
  summary
}: {
  client?: ImportJobClient;
  jobId: string;
  summary: Record<string, unknown>;
}) =>
  client.integrationImportJob.update({
    where: { id: jobId },
    data: {
      status: "SUCCESS",
      summary: asInputJson(summary)
    }
  });

export const failImportJob = async ({
  client = prisma,
  jobId,
  summary
}: {
  client?: ImportJobClient;
  jobId: string;
  summary: Record<string, unknown>;
}) =>
  client.integrationImportJob.update({
    where: { id: jobId },
    data: {
      status: "FAILED",
      summary: asInputJson(summary)
    }
  });

export const listImportJobsByOrganization = async ({
  organizationId,
  limit = 20
}: {
  organizationId: string;
  limit?: number;
}) =>
  prisma.integrationImportJob.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  });

export const summarizeImportJob = (
  job: IntegrationImportJob & {
    createdBy?: { id: string; fullName: string; email: string } | null;
  }
) => ({
  id: job.id,
  source: job.source,
  entity: job.entity,
  status: job.status,
  fileName: job.fileName,
  summary: job.summary,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
  createdBy: job.createdBy
    ? {
        id: job.createdBy.id,
        fullName: job.createdBy.fullName,
        email: job.createdBy.email
      }
    : null
});
