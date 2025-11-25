import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createOrActivateSubscriptionForUser,
  getActiveSubscriptionForUser
} from "../services/subscriptions";

export const subscriptionsRouter = Router();

subscriptionsRouter.use(authMiddleware);

subscriptionsRouter.post("/checkout", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { planCode, paymentMethod } = req.body ?? {};
  if (!planCode || typeof planCode !== "string") {
    return res.status(400).json({ message: "planCode Ǹ obrigat��rio" });
  }
  if (!paymentMethod || typeof paymentMethod !== "string" || !["card", "pix", "boleto"].includes(paymentMethod)) {
    return res.status(400).json({ message: "Forma de pagamento invǭlida" });
  }

  try {
    const subscription = await createOrActivateSubscriptionForUser(req.user, planCode, paymentMethod);
    return res.status(201).json({
      status: "success",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        paymentMethod: subscription.paymentMethod,
        product: subscription.product
          ? {
              code: subscription.product.code,
              name: subscription.product.name
            }
          : null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao criar assinatura";
    return res.status(400).json({ message });
  }
});

subscriptionsRouter.get("/me", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
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
