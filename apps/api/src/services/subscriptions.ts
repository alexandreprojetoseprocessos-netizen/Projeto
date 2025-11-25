import { prisma } from "@gestao/database";
import { SubscriptionStatus } from "@prisma/client";
import type { AuthenticatedUser } from "../types/http";

const defaultProducts: Record<
  string,
  { name: string; description?: string; priceCents: number; billingPeriod: string }
> = {
  START: {
    name: "Plano Start",
    description: "Ideal para validar o fluxo de projetos",
    priceCents: 4900,
    billingPeriod: "monthly"
  },
  BUSINESS: {
    name: "Plano Business",
    description: "Para PMOs e squads colaborativos",
    priceCents: 9700,
    billingPeriod: "monthly"
  },
  ENTERPRISE: {
    name: "Plano Enterprise",
    description: "Limites customizados e suporte dedicado",
    priceCents: 19700,
    billingPeriod: "monthly"
  }
};

const ensureUserExists = async (user: AuthenticatedUser) => {
  const email = user.email || `${user.id}@supabase.local`;
  const name = user.name || email;
  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email,
      fullName: name
    },
    create: {
      id: user.id,
      email,
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
  paymentMethod: string
) => {
  await ensureUserExists(user);

  let product = await prisma.product.findUnique({ where: { code: productCode } });

  if (!product && defaultProducts[productCode]) {
    product = await prisma.product.create({
      data: {
        code: productCode,
        ...defaultProducts[productCode]
      }
    });
  }

  if (!product) {
    throw new Error("Plano não encontrado");
  }

  const existing = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      productId: product.id,
      status: SubscriptionStatus.ACTIVE
    }
  });

  if (existing) {
    return prisma.subscription.update({
      where: { id: existing.id },
      data: {
        productId: product.id,
        paymentMethod,
        status: SubscriptionStatus.ACTIVE
      },
      include: { product: true }
    });
  }

  return prisma.subscription.create({
    data: {
      userId: user.id,
      productId: product.id,
      paymentMethod,
      status: SubscriptionStatus.ACTIVE,
      startedAt: new Date()
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
