import { Router } from "express";
import { prisma } from "@gestao/database";
import { OrganizationStatus } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { getActiveSubscriptionForUser, getLatestSubscriptionForUser } from "../services/subscriptions";
import { countOrganizationsForLimit, countProjectsForLimit } from "../services/planLimitCounts";
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
      organization: true
    }
  });

  const subscription =
    (await getActiveSubscriptionForUser(req.user.id)) ??
    (await getLatestSubscriptionForUser(req.user.id));
  const planCode = subscription?.product?.code ?? null;

  const organizationsWithCounts = await Promise.all(
    memberships.map(async (membership) => ({
      id: membership.organizationId,
      name: membership.organization.name,
      domain: membership.organization.domain,
      createdAt: membership.organization.createdAt,
      isActive: membership.organization.isActive,
      status: membership.organization.status,
      role: membership.role,
      projectsCount: await countProjectsForLimit(membership.organizationId)
    }))
  );

  const organizations = organizationsWithCounts.filter((org) => org.status === OrganizationStatus.ACTIVE);
  const organizationsForLimit = organizationsWithCounts.filter(
    (org) =>
      org.status === OrganizationStatus.ACTIVE ||
      org.status === OrganizationStatus.DEACTIVATED ||
      org.status === OrganizationStatus.SOFT_DELETED
  );

  const maxOrganizations = getOrgLimitForPlan(planCode);
  const usedOrganizations = await countOrganizationsForLimit(req.user.id);
  const remainingOrganizations =
    maxOrganizations === null ? null : Math.max(maxOrganizations - usedOrganizations, 0);

  const maxProjectsPerOrganization = getProjectLimitForPlan(planCode);
  const totalProjectLimit =
    maxProjectsPerOrganization === null ? null : maxProjectsPerOrganization * organizationsForLimit.length;
  const usedProjects = organizationsForLimit.reduce((acc, org) => acc + (org.projectsCount ?? 0), 0);
  const remainingProjects = totalProjectLimit === null ? null : Math.max(totalProjectLimit - usedProjects, 0);

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
      max: totalProjectLimit,
      used: usedProjects,
      remaining: remainingProjects,
      perOrganization: maxProjectsPerOrganization
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
