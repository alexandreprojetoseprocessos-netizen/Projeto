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

  return res.json({
    user: req.user,
    organizations: memberships.map((membership) => ({
      id: membership.organizationId,
      name: membership.organization.name,
      role: membership.role,
      projectCount: membership.organization._count?.projects ?? 0
    }))
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
