import { Router } from "express";
import { prisma } from "@gestao/database";
import { SubscriptionStatus } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import {
  createOrActivateSubscriptionForUser,
  getActiveSubscriptionForUser
} from "../services/subscriptions";
import { canManageBilling } from "../services/permissions";
import { getPlanProduct } from "../config/plans";

export const subscriptionsRouter = Router();

subscriptionsRouter.use(authMiddleware);

subscriptionsRouter.post("/checkout", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { planCode, paymentMethod, billingCycle } = req.body ?? {};
  if (!planCode || typeof planCode !== "string") {
    return res.status(400).json({ message: "planCode é obrigatório" });
  }
  if (!paymentMethod || typeof paymentMethod !== "string" || !["card", "pix", "boleto"].includes(paymentMethod)) {
    return res.status(400).json({ message: "Forma de pagamento inválida" });
  }
  const normalizedCycle = typeof billingCycle === "string" ? billingCycle.toUpperCase() : "MONTHLY";
  if (!["MONTHLY", "ANNUAL"].includes(normalizedCycle)) {
    return res.status(400).json({ message: "billingCycle inválido" });
  }

  try {
    const subscription = await createOrActivateSubscriptionForUser(
      req.user,
      planCode,
      paymentMethod,
      normalizedCycle as any
    );
    return res.status(201).json({
      status: "success",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        paymentMethod: subscription.paymentMethod,
        paymentProvider: subscription.paymentProvider,
        billingCycle: subscription.billingCycle,
        currentPeriodEnd: subscription.currentPeriodEnd,
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

subscriptionsRouter.post("/change-plan", async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Authentication required" });
  const { planCode } = req.body ?? {};
  if (!planCode || typeof planCode !== "string") {
    return res.status(400).json({ message: "planCode é obrigatório" });
  }

  const membership = await prisma.organizationMembership.findFirst({ where: { userId: req.user.id } });
  if (!membership || !canManageBilling(membership.role as any)) {
    return res.status(403).json({
      message: "Você não tem permissão para alterar o plano. Apenas o proprietário pode gerenciar a assinatura."
    });
  }

  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.id },
    orderBy: { startedAt: "desc" },
    include: { product: true }
  });
  if (!subscription) {
    return res.status(404).json({ message: "Nenhuma assinatura ativa encontrada" });
  }

  const planProduct = getPlanProduct(planCode);
  if (!planProduct) {
    return res.status(400).json({ message: "Plano não encontrado" });
  }

  let product = await prisma.product.findUnique({ where: { code: planCode } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        code: planCode,
        ...planProduct
      }
    });
  }

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: { productId: product.id },
    include: { product: true }
  });

  return res.json({ subscription: updated });
});

subscriptionsRouter.post("/cancel", async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Authentication required" });

  const membership = await prisma.organizationMembership.findFirst({ where: { userId: req.user.id } });
  if (!membership || !canManageBilling(membership.role as any)) {
    return res.status(403).json({
      message: "Você não tem permissão para cancelar a assinatura. Apenas o proprietário pode gerenciar a assinatura."
    });
  }

  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.id },
    orderBy: { startedAt: "desc" },
    include: { product: true }
  });
  if (!subscription) {
    return res.status(404).json({ message: "Nenhuma assinatura ativa encontrada" });
  }

  const canceled = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: SubscriptionStatus.CANCELED,
      expiresAt: new Date()
    },
    include: { product: true }
  });

  return res.json({ subscription: canceled });
});
