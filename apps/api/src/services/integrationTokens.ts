import crypto from "node:crypto";
import { prisma } from "@gestao/database";
import { Prisma, type ApiToken } from "@prisma/client";

type TokenClient = Prisma.TransactionClient | typeof prisma;

const TOKEN_PREFIX = "gpit";

const hashToken = (value: string) => crypto.createHash("sha256").update(value, "utf8").digest("hex");

export const createPlainApiToken = () => {
  const secret = crypto.randomBytes(24).toString("hex");
  return `${TOKEN_PREFIX}_${secret}`;
};

export const createWebhookSecret = () => crypto.randomBytes(24).toString("hex");

export const summarizeApiToken = (token: ApiToken & { createdBy?: { id: string; fullName: string; email: string } | null }) => ({
  id: token.id,
  name: token.name,
  tokenPrefix: token.tokenPrefix,
  tokenLastFour: token.tokenLastFour,
  scopes: token.scopes,
  createdAt: token.createdAt,
  updatedAt: token.updatedAt,
  lastUsedAt: token.lastUsedAt,
  expiresAt: token.expiresAt,
  revokedAt: token.revokedAt,
  createdBy: token.createdBy
    ? {
        id: token.createdBy.id,
        fullName: token.createdBy.fullName,
        email: token.createdBy.email
      }
    : null
});

export const issueApiToken = async ({
  client = prisma,
  organizationId,
  createdById,
  name,
  scopes,
  expiresAt
}: {
  client?: TokenClient;
  organizationId: string;
  createdById: string;
  name: string;
  scopes?: Prisma.InputJsonValue | null;
  expiresAt?: Date | null;
}) => {
  const plainToken = createPlainApiToken();
  const suffix = plainToken.split("_")[1] ?? plainToken;
  const tokenPrefix = `${TOKEN_PREFIX}_${suffix.slice(0, 8)}`;
  const tokenLastFour = suffix.slice(-4);
  const tokenHash = hashToken(plainToken);

  const token = await client.apiToken.create({
    data: {
      organizationId,
      createdById,
      name,
      tokenPrefix,
      tokenLastFour,
      tokenHash,
      scopes: scopes ?? Prisma.JsonNull,
      expiresAt: expiresAt ?? null
    }
  });

  return { token, plainToken };
};

export const revokeApiToken = async ({
  client = prisma,
  tokenId,
  organizationId
}: {
  client?: TokenClient;
  tokenId: string;
  organizationId: string;
}) =>
  client.apiToken.updateMany({
    where: {
      id: tokenId,
      organizationId,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });

export const findActiveApiTokensByOrganization = async (organizationId: string) =>
  prisma.apiToken.findMany({
    where: {
      organizationId,
      revokedAt: null
    },
    orderBy: { createdAt: "desc" },
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

export const resolveApiTokenByPlainText = async (plainToken: string) =>
  prisma.apiToken.findFirst({
    where: {
      tokenHash: hashToken(plainToken),
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
    }
  });

export const touchApiTokenLastUsed = async (tokenId: string) =>
  prisma.apiToken.update({
    where: { id: tokenId },
    data: { lastUsedAt: new Date() }
  });
