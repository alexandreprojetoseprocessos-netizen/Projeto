import { Router } from "express";
import { prisma } from "@gestao/database";
import { OrganizationStatus } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { getActiveSubscriptionForUser } from "../services/subscriptions";
import { getOrgLimitForPlan, getProjectLimitForPlan } from "../services/subscriptionLimits";

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

  const organizations = memberships
    .map((membership) => ({
      id: membership.organizationId,
      name: membership.organization.name,
      domain: membership.organization.domain,
      createdAt: membership.organization.createdAt,
      isActive: membership.organization.isActive,
      status: membership.organization.status,
      role: membership.role,
      projectsCount: membership.organization._count?.projects ?? 0
    }))
    .filter((org) => org.status === OrganizationStatus.ACTIVE);

  const maxOrganizations = getOrgLimitForPlan(planCode);
  const usedOrganizations = organizations.length;
  const remainingOrganizations =
    maxOrganizations === null ? null : Math.max(maxOrganizations - usedOrganizations, 0);

  const maxProjects = getProjectLimitForPlan(planCode);
  const usedProjects = organizations.reduce((acc, org) => acc + (org.projectsCount ?? 0), 0);
  const remainingProjects = maxProjects === null ? null : Math.max(maxProjects - usedProjects, 0);

  return res.json({
    user: req.user,
    organizations,
    organizationLimits: {
      planCode,
      max: maxOrganizations,
      used: usedOrganizations,
      remaining: remainingOrganizations
    },
    projectLimits: {
      planCode,
      max: maxProjects,
      used: usedProjects,
      remaining: remainingProjects
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
