import { prisma } from "@gestao/database";
import { SubscriptionStatus } from "@prisma/client";
import { BillingCycle, getPlanProduct } from "../config/plans";
import type { AuthenticatedUser } from "../types/http";

const ensureUserExists = async (user: AuthenticatedUser) => {
  const email = user.email || `${user.id}@supabase.local`;
  const name = user.name || email;
  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email,
      corporateEmail: email,
      fullName: name
    },
    create: {
      id: user.id,
      email,
      corporateEmail: email,
      fullName: name,
      passwordHash: "supabase-auth",
      locale: "pt-BR",
      timezone: "America/Sao_Paulo"
    }
  });
};

export const createOrActivateSubscriptionForUser = async (
  user: AuthenticatedUser,
  productCode: string,
  paymentMethod: string,
  billingCycle: BillingCycle = "MONTHLY"
) => {
  await ensureUserExists(user);

  const planProduct = getPlanProduct(productCode);
  if (!planProduct) {
    throw new Error("Plano não encontrado");
  }

  let product = await prisma.product.findUnique({ where: { code: productCode } });

  if (!product) {
    product = await prisma.product.create({
      data: {
        code: productCode,
        ...planProduct
      }
    });
  }

  const existing = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      productId: product.id,
      status: SubscriptionStatus.ACTIVE
    }
  });

  const resolvePeriodEnd = () => {
    const now = new Date();
    const target = new Date(now);
    target.setMonth(target.getMonth() + (billingCycle === "ANNUAL" ? 12 : 1));
    return target;
  };

  if (existing) {
    const periodEnd = resolvePeriodEnd();
    return prisma.subscription.update({
      where: { id: existing.id },
      data: {
        productId: product.id,
        paymentMethod,
        billingCycle,
        status: SubscriptionStatus.ACTIVE,
        startedAt: new Date(),
        currentPeriodEnd: periodEnd,
        expiresAt: periodEnd
      },
      include: { product: true }
    });
  }

  const periodEnd = resolvePeriodEnd();
  return prisma.subscription.create({
    data: {
      userId: user.id,
      productId: product.id,
      paymentMethod,
      status: SubscriptionStatus.ACTIVE,
      billingCycle,
      startedAt: new Date(),
      currentPeriodEnd: periodEnd,
      expiresAt: periodEnd
    },
    include: { product: true }
  });
};

export const getActiveSubscriptionForUser = async (userId: string) => {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE
    },
    orderBy: { startedAt: "desc" },
    include: { product: true }
  });
};

export const getLatestSubscriptionForUser = async (userId: string) => {
  return prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { product: true }
  });
};
