import { randomUUID } from "node:crypto";
import { Router } from "express";
import axios from "axios";
import { prisma } from "@gestao/database";
import { SubscriptionStatus } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { config } from "../config/env";
import { BillingCycle, getPlanDefinition, getPlanPriceCents, getPlanProduct } from "../config/plans";
import { getActiveSubscriptionForUser } from "../services/subscriptions";
import { logger } from "../config/logger";
import { MP_BASE_URL, resolveWebhookUrl, syncSubscriptionFromPayment } from "../services/mercadopago";

type PlanContext = {
  planCode: string;
  billingCycle: BillingCycle;
  planName: string;
  amountCents: number;
};

const resolveBillingCycle = (value?: string | null): BillingCycle => {
  const normalized = (value ?? "").toUpperCase();
  if (normalized === "ANNUAL") return "ANNUAL";
  return "MONTHLY";
};

const normalizeEmail = (value?: string | null) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || null;
};

const parseAmount = (value: any) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Number(parsed.toFixed(2));
};

const matchesAmount = (amount: number, amountCents: number) => {
  return Math.abs(amount - amountCents / 100) < 0.01;
};

const ensureUserRecord = async (user: any) => {
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

const buildPlanContext = (planCode: string, billingCycle: BillingCycle): PlanContext => {
  const plan = getPlanDefinition(planCode);
  if (!plan) {
    throw new Error("Plano nao encontrado.");
  }
  const amountCents = getPlanPriceCents(planCode, billingCycle);
  if (!amountCents) {
    throw new Error("Nao foi possivel calcular o valor do plano.");
  }
  return {
    planCode,
    billingCycle,
    planName: plan.name,
    amountCents
  };
};

const createPendingSubscription = async (
  user: any,
  planCode: string,
  billingCycle: BillingCycle,
  paymentMethod: string
) => {
  const activeSubscription = await getActiveSubscriptionForUser(user.id);
  if (activeSubscription) {
    throw new Error("Voce ja possui uma assinatura ativa.");
  }

  await ensureUserRecord(user);

  const planProduct = getPlanProduct(planCode);
  if (!planProduct) {
    throw new Error("Plano nao encontrado.");
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

  return prisma.subscription.create({
    data: {
      userId: user.id,
      productId: product.id,
      status: SubscriptionStatus.PENDING,
      billingCycle,
      paymentProvider: "MERCADO_PAGO",
      paymentMethod
    }
  });
};

export const paymentsRouter = Router();

paymentsRouter.use(authMiddleware);

paymentsRouter.post("/pix", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const requestId = randomUUID();
  const accessToken = config.mercadoPago.accessToken;
  if (!accessToken) {
    return res.status(500).json({ message: "Mercado Pago nao configurado." });
  }

  const body = req.body ?? {};
  const providedPlanCode = typeof body.planCode === "string" ? body.planCode : null;
  const billingCycle = resolveBillingCycle(body.billingCycle);
  const providedExternalReference = typeof body.externalReference === "string" ? body.externalReference : null;

  let planContext: PlanContext | null = null;
  try {
    if (providedPlanCode) {
      planContext = buildPlanContext(providedPlanCode, billingCycle);
    }
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : "Plano invalido." });
  }

  const payerEmail = normalizeEmail(body.payerEmail) ?? normalizeEmail(req.user.email);
  if (!payerEmail) {
    return res.status(400).json({ message: "payerEmail obrigatorio." });
  }

  let subscription = null;
  let externalReference = providedExternalReference;
  if (externalReference) {
    subscription = await prisma.subscription.findUnique({ where: { id: externalReference } });
    if (!subscription || subscription.userId !== req.user.id) {
      return res.status(404).json({ message: "Assinatura nao encontrada." });
    }
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      return res.status(409).json({ message: "Voce ja possui uma assinatura ativa." });
    }
  } else {
    if (!planContext) {
      return res.status(400).json({ message: "planCode obrigatorio quando externalReference nao for informado." });
    }
    try {
      subscription = await createPendingSubscription(req.user, planContext.planCode, planContext.billingCycle, "pix");
      externalReference = subscription.id;
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Falha ao criar assinatura." });
    }
  }

  const requestedAmount = parseAmount(body.amount);
  const resolvedAmount = planContext
    ? planContext.amountCents / 100
    : requestedAmount;
  if (!resolvedAmount) {
    return res.status(400).json({ message: "amount obrigatorio." });
  }
  if (requestedAmount && planContext && !matchesAmount(requestedAmount, planContext.amountCents)) {
    return res.status(400).json({ message: "amount nao corresponde ao valor do plano." });
  }

  const description = typeof body.description === "string" && body.description.trim()
    ? body.description.trim()
    : planContext?.planName ?? "Pagamento Pix";

  const notificationUrl = resolveWebhookUrl();
  const paymentPayload = {
    transaction_amount: resolvedAmount,
    description,
    payment_method_id: "pix",
    payer: { email: payerEmail },
    external_reference: externalReference,
    ...(notificationUrl ? { notification_url: notificationUrl } : {})
  };

  logger.info(
    {
      requestId,
      mp: {
        method: "pix",
        amount: resolvedAmount,
        description,
        externalReference,
        payerEmail,
        notificationUrl
      }
    },
    "Mercado Pago pix payment request"
  );

  try {
    const response = await axios.post(`${MP_BASE_URL}/v1/payments`, paymentPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const payment = response.data as {
      id: number | string;
      status: string;
      external_reference?: string;
      point_of_interaction?: {
        transaction_data?: {
          qr_code?: string;
          qr_code_base64?: string;
        };
      };
      payment_method_id?: string;
    };

    logger.info(
      {
        requestId,
        mp: {
          id: payment.id,
          status: payment.status
        }
      },
      "Mercado Pago pix payment response"
    );

    await syncSubscriptionFromPayment({
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference ?? externalReference ?? undefined,
      payment_method_id: payment.payment_method_id ?? "pix"
    });

    const transactionData = payment.point_of_interaction?.transaction_data;
    if (!transactionData?.qr_code || !transactionData?.qr_code_base64) {
      return res.status(502).json({ message: "Falha ao gerar QR Code Pix." });
    }

    return res.status(201).json({
      payment_id: String(payment.id),
      status: payment.status,
      qr_code: transactionData.qr_code,
      qr_code_base64: transactionData.qr_code_base64,
      externalReference
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(
        {
          requestId,
          mp: {
            status: error.response?.status,
            data: error.response?.data
          }
        },
        "Failed to create Mercado Pago pix payment"
      );
    } else {
      logger.error({ err: error, requestId }, "Failed to create Mercado Pago pix payment");
    }
    return res.status(502).json({ message: "Falha ao criar pagamento Pix." });
  }
});

paymentsRouter.post("/card", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const requestId = randomUUID();
  const accessToken = config.mercadoPago.accessToken;
  if (!accessToken) {
    return res.status(500).json({ message: "Mercado Pago nao configurado." });
  }

  const body = req.body ?? {};
  const cardToken =
    typeof body.cardToken === "string" ? body.cardToken : typeof body.token === "string" ? body.token : null;
  if (!cardToken) {
    return res.status(400).json({ message: "cardToken obrigatorio." });
  }

  const paymentMethodId = typeof body.paymentMethodId === "string" ? body.paymentMethodId : null;
  if (!paymentMethodId) {
    return res.status(400).json({ message: "paymentMethodId obrigatorio." });
  }

  const issuerId = typeof body.issuer_id === "string" ? body.issuer_id : typeof body.issuerId === "string" ? body.issuerId : null;
  const installments = Number(body.installments);
  if (!Number.isFinite(installments) || installments < 1) {
    return res.status(400).json({ message: "installments obrigatorio." });
  }

  const providedPlanCode = typeof body.planCode === "string" ? body.planCode : null;
  const billingCycle = resolveBillingCycle(body.billingCycle);
  const providedExternalReference = typeof body.externalReference === "string" ? body.externalReference : null;

  let planContext: PlanContext | null = null;
  try {
    if (providedPlanCode) {
      planContext = buildPlanContext(providedPlanCode, billingCycle);
    }
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : "Plano invalido." });
  }

  const payerEmail = normalizeEmail(body.payerEmail) ?? normalizeEmail(req.user.email);
  if (!payerEmail) {
    return res.status(400).json({ message: "payerEmail obrigatorio." });
  }

  let subscription = null;
  let externalReference = providedExternalReference;
  if (externalReference) {
    subscription = await prisma.subscription.findUnique({ where: { id: externalReference } });
    if (!subscription || subscription.userId !== req.user.id) {
      return res.status(404).json({ message: "Assinatura nao encontrada." });
    }
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      return res.status(409).json({ message: "Voce ja possui uma assinatura ativa." });
    }
  } else {
    if (!planContext) {
      return res.status(400).json({ message: "planCode obrigatorio quando externalReference nao for informado." });
    }
    try {
      subscription = await createPendingSubscription(req.user, planContext.planCode, planContext.billingCycle, "card");
      externalReference = subscription.id;
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Falha ao criar assinatura." });
    }
  }

  const requestedAmount = parseAmount(body.amount);
  const resolvedAmount = planContext
    ? planContext.amountCents / 100
    : requestedAmount;
  if (!resolvedAmount) {
    return res.status(400).json({ message: "amount obrigatorio." });
  }
  if (requestedAmount && planContext && !matchesAmount(requestedAmount, planContext.amountCents)) {
    return res.status(400).json({ message: "amount nao corresponde ao valor do plano." });
  }

  const description = typeof body.description === "string" && body.description.trim()
    ? body.description.trim()
    : planContext?.planName ?? "Pagamento Cartao";

  const notificationUrl = resolveWebhookUrl();
  const paymentPayload = {
    transaction_amount: resolvedAmount,
    token: cardToken,
    description,
    installments,
    payment_method_id: paymentMethodId,
    payer: { email: payerEmail },
    external_reference: externalReference,
    ...(issuerId ? { issuer_id: issuerId } : {}),
    ...(notificationUrl ? { notification_url: notificationUrl } : {})
  };

  logger.info(
    {
      requestId,
      mp: {
        method: "card",
        amount: resolvedAmount,
        description,
        externalReference,
        payerEmail,
        installments,
        issuerId,
        paymentMethodId,
        notificationUrl
      }
    },
    "Mercado Pago card payment request"
  );

  try {
    const response = await axios.post(`${MP_BASE_URL}/v1/payments`, paymentPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const payment = response.data as {
      id: number | string;
      status: string;
      status_detail?: string;
      external_reference?: string;
      payment_method_id?: string;
    };

    logger.info(
      {
        requestId,
        mp: {
          id: payment.id,
          status: payment.status,
          statusDetail: payment.status_detail
        }
      },
      "Mercado Pago card payment response"
    );

    await syncSubscriptionFromPayment({
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference ?? externalReference ?? undefined,
      payment_method_id: payment.payment_method_id ?? paymentMethodId
    });

    return res.status(201).json({
      id: String(payment.id),
      status: payment.status,
      status_detail: payment.status_detail ?? null
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(
        {
          requestId,
          mp: {
            status: error.response?.status,
            data: error.response?.data
          }
        },
        "Failed to create Mercado Pago card payment"
      );
    } else {
      logger.error({ err: error, requestId }, "Failed to create Mercado Pago card payment");
    }
    return res.status(502).json({ message: "Falha ao criar pagamento com cartao." });
  }
});
