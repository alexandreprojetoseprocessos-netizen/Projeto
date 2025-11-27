import { Router } from "express";
import { prisma } from "@gestao/database";
import { authMiddleware } from "../middleware/auth";
import { getActiveSubscriptionForUser } from "../services/subscriptions";

export const meRouter = Router();

meRouter.use(authMiddleware);

meRouter.get("/", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const memberships = await prisma.organizationMembership.findMany({
    where: { userId: req.user.id },
    include: {
      organization: {
        include: {
          _count: { select: { projects: true } }
        }
      }
    }
  });

  const subscription = await getActiveSubscriptionForUser(req.user.id);
  const planCode = subscription?.product?.code ?? null;

  const getOrgLimitForPlan = (code?: string | null): number | null => {
    switch (code) {
      case "START":
        return 1;
      case "BUSINESS":
        return 3;
      case "ENTERPRISE":
        return null;
      default:
        return 1;
    }
  };

  const organizations = memberships
    .map((membership) => ({
      id: membership.organizationId,
      name: membership.organization.name,
      domain: membership.organization.domain,
      createdAt: membership.organization.createdAt,
      isActive: membership.organization.isActive,
      role: membership.role,
      projectsCount: membership.organization._count?.projects ?? 0
    }))
    .filter((org) => org.isActive);

  const maxOrganizations = getOrgLimitForPlan(planCode);
  const usedOrganizations = organizations.length;
  const remainingOrganizations =
    maxOrganizations === null ? null : Math.max(maxOrganizations - usedOrganizations, 0);

  return res.json({
    user: req.user,
    organizations,
    organizationLimits: {
      planCode,
      max: maxOrganizations,
      used: usedOrganizations,
      remaining: remainingOrganizations
    }
  });
});

meRouter.get("/subscription", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const subscription = await getActiveSubscriptionForUser(req.user.id);
  return res.json({
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          paymentMethod: subscription.paymentMethod,
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
