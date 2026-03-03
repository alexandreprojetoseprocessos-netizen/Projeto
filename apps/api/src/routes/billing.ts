import { Router } from "express";
import { prisma } from "@gestao/database";
import { SubscriptionStatus } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { getLatestSubscriptionForUser } from "../services/subscriptions";
import { canManageBilling } from "../services/permissions";
import { normalizeUuid } from "../utils/uuid";
import { writeAuditLog } from "../services/audit";

export const billingRouter = Router();

const resolveScopedMembership = async (userId: string, rawOrganizationId: unknown) => {
  const organizationId = normalizeUuid(rawOrganizationId);
  if (organizationId) {
    return prisma.organizationMembership.findFirst({
      where: {
        userId,
        organizationId
      }
    });
  }

  return prisma.organizationMembership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" }
  });
};

billingRouter.get("/status", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const subscription = await getLatestSubscriptionForUser(req.user.id);
  return res.json({
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          paymentMethod: subscription.paymentMethod,
          paymentProvider: subscription.paymentProvider,
          billingCycle: subscription.billingCycle,
          currentPeriodEnd: subscription.currentPeriodEnd,
          startedAt: subscription.startedAt,
          expiresAt: subscription.expiresAt,
          product: subscription.product
            ? {
                id: subscription.product.id,
                code: subscription.product.code,
                name: subscription.product.name,
                priceCents: subscription.product.priceCents,
                billingPeriod: subscription.product.billingPeriod
              }
            : null
        }
      : null
  });
});

billingRouter.post("/cancel", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const membership = await resolveScopedMembership(req.user.id, req.header("x-organization-id"));
  if (!membership || !canManageBilling(membership.role as any)) {
    return res.status(403).json({
      message: "Você não tem permissão para cancelar a assinatura. Apenas o proprietário pode gerenciar a assinatura."
    });
  }

  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" }
  });
  if (!subscription) {
    return res.status(404).json({ message: "Nenhuma assinatura encontrada." });
  }

  const canceled = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: SubscriptionStatus.CANCELED,
      expiresAt: new Date()
    }
  });

  await writeAuditLog({
    organizationId: membership.organizationId,
    actorId: req.user.id,
    action: "SUBSCRIPTION_CANCELED",
    entity: "SUBSCRIPTION",
    entityId: canceled.id,
    diff: {
      before: {
        status: subscription.status,
        expiresAt: subscription.expiresAt
      },
      after: {
        status: canceled.status,
        expiresAt: canceled.expiresAt
      }
    }
  });

  return res.json({ subscription: canceled });
});
