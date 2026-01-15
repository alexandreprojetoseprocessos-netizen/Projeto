import { Router } from "express";
import { prisma } from "@gestao/database";
import { SubscriptionStatus } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { getLatestSubscriptionForUser } from "../services/subscriptions";

export const billingRouter = Router();

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

  return res.json({ subscription: canceled });
});
