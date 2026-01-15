import { Router } from "express";
import axios from "axios";
import { prisma } from "@gestao/database";
import { SubscriptionStatus } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { config } from "../config/env";
import { BillingCycle, getPlanDefinition, getPlanPriceCents, getPlanProduct } from "../config/plans";
import { getActiveSubscriptionForUser, getLatestSubscriptionForUser } from "../services/subscriptions";
import { logger } from "../config/logger";

const MP_BASE_URL = "https://api.mercadopago.com";

const maskAccessToken = (token?: string | null) => {
  if (!token) return null;
  return `***${token.slice(-6)}`;
};

const resolveMpEnv = (value?: string | null) => {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "production") return "production";
  if (normalized === "sandbox") return "sandbox";
  return null;
};

const resolveBillingCycle = (value?: string | null): BillingCycle => {
  const normalized = (value ?? "").toUpperCase();
  if (normalized === "ANNUAL") return "ANNUAL";
  return "MONTHLY";
};

const resolveFrontendUrl = (req: any) => {
  const fallback =
    typeof req.headers?.origin === "string" && req.headers.origin
      ? req.headers.origin
      : "http://localhost:5173";
  const base = config.frontendUrl ?? fallback;
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

const resolveWebhookUrl = () => {
  if (!config.mercadoPago.publicApiUrl) return null;
  const base = config.mercadoPago.publicApiUrl.endsWith("/")
    ? config.mercadoPago.publicApiUrl.slice(0, -1)
    : config.mercadoPago.publicApiUrl;
  return `${base}/billing/webhook`;
};

const resolvePeriodEnd = (cycle: BillingCycle, startAt?: Date | null) => {
  const base = startAt ?? new Date();
  const next = new Date(base);
  next.setMonth(next.getMonth() + (cycle === "ANNUAL" ? 12 : 1));
  return next;
};

export const billingRouter = Router();

billingRouter.post("/checkout", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const planCode = typeof req.body?.planId === "string" ? req.body.planId : req.body?.planCode;
  if (!planCode || typeof planCode !== "string") {
    return res.status(400).json({ message: "planId é obrigatório." });
  }

  const billingCycle = resolveBillingCycle(req.body?.billingCycle);
  const plan = getPlanDefinition(planCode);
  if (!plan) {
    return res.status(400).json({ message: "Plano não encontrado." });
  }

  const accessToken = config.mercadoPago.accessToken;
  if (!accessToken) {
    return res.status(500).json({ message: "Mercado Pago não configurado." });
  }

  const activeSubscription = await getActiveSubscriptionForUser(req.user.id);
  if (activeSubscription) {
    return res.status(409).json({ message: "Você já possui uma assinatura ativa." });
  }

  const amountCents = getPlanPriceCents(planCode, billingCycle);
  if (!amountCents) {
    return res.status(400).json({ message: "Não foi possível calcular o valor do plano." });
  }

  const planProduct = getPlanProduct(planCode);
  if (!planProduct) {
    return res.status(400).json({ message: "Plano não encontrado." });
  }

  await prisma.user.upsert({
    where: { id: req.user.id },
    update: {
      email: req.user.email,
      corporateEmail: req.user.email,
      fullName: req.user.name ?? req.user.email
    },
    create: {
      id: req.user.id,
      email: req.user.email,
      corporateEmail: req.user.email,
      fullName: req.user.name ?? req.user.email,
      passwordHash: "supabase-auth",
      locale: "pt-BR",
      timezone: "America/Sao_Paulo"
    }
  });

  let product = await prisma.product.findUnique({ where: { code: planCode } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        code: planCode,
        ...planProduct
      }
    });
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: req.user.id,
      productId: product.id,
      status: SubscriptionStatus.PENDING,
      billingCycle,
      paymentProvider: "MERCADO_PAGO",
      paymentMethod: "card"
    }
  });

  const frontendUrl = resolveFrontendUrl(req);
  const webhookUrl = resolveWebhookUrl();
  const preferencePayload = {
    items: [
      {
        title: plan.name,
        quantity: 1,
        unit_price: amountCents / 100,
        currency_id: "BRL"
      }
    ],
    payer: {
      email: req.user.email
    },
    external_reference: subscription.id,
    back_urls: {
      success: `${frontendUrl}/billing/return?status=success`,
      failure: `${frontendUrl}/billing/return?status=failure`,
      pending: `${frontendUrl}/billing/return?status=pending`
    },
    auto_return: "approved",
    ...(webhookUrl ? { notification_url: webhookUrl } : {})
  };

  try {
    const mpEnv = resolveMpEnv(config.mercadoPago.env);
    logger.info(
      {
        mp: {
          env: mpEnv,
          nodeEnv: config.env,
          accessToken: maskAccessToken(accessToken),
          frontendUrl,
          webhookUrl,
          payload: preferencePayload
        }
      },
      "Mercado Pago preference create request"
    );

    const response = await axios.post(`${MP_BASE_URL}/checkout/preferences`, preferencePayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    logger.info(
      {
        mp: {
          status: response.status,
          data: response.data
        }
      },
      "Mercado Pago preference create response"
    );

    const preference = response.data as { id: string; init_point?: string; sandbox_init_point?: string };
    const useSandbox = mpEnv === "sandbox";
    const checkoutUrlType = useSandbox ? "sandbox_init_point" : "init_point";
    const checkoutUrl = useSandbox ? preference.sandbox_init_point : preference.init_point;
    if (!checkoutUrl) {
      logger.error(
        {
          mp: {
            preferenceId: preference.id,
            checkoutUrlType,
            data: response.data
          }
        },
        "Missing Mercado Pago checkout url"
      );
      return res.status(502).json({ message: "Falha ao iniciar pagamento." });
    }

    logger.info(
      {
        mp: {
          checkoutUrlType,
          checkoutUrl
        }
      },
      "Mercado Pago checkout url selected"
    );

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        mpPreferenceId: preference.id,
        providerRef: preference.id
      }
    });

    return res.status(201).json({
      init_point: checkoutUrl,
      subscriptionId: subscription.id
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(
        {
          mp: {
            status: error.response?.status,
            data: error.response?.data
          }
        },
        "Failed to create Mercado Pago preference"
      );
    } else {
      logger.error({ err: error }, "Failed to create Mercado Pago preference");
    }
    return res.status(500).json({ message: "Falha ao iniciar pagamento." });
  }
});

billingRouter.get("/debug/mp/preference/:id", async (req, res) => {
  const debugKey = config.mercadoPago.debugKey;
  const providedKey = req.header("X-Debug-Key");
  if (!debugKey || !providedKey || providedKey !== debugKey) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const accessToken = config.mercadoPago.accessToken;
  if (!accessToken) {
    return res.status(500).json({ message: "Mercado Pago nao configurado." });
  }

  try {
    const response = await axios.get(`${MP_BASE_URL}/checkout/preferences/${req.params.id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const preference = response.data as { id?: string; status?: string; payment_methods?: unknown };
    return res.json({
      id: preference.id ?? req.params.id,
      status: preference.status ?? null,
      payment_methods: preference.payment_methods ?? null
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status ?? 502).json({
        message: "Falha ao consultar preference.",
        status: error.response?.status,
        body: error.response?.data ?? null
      });
    }
    return res.status(502).json({ message: "Falha ao consultar preference." });
  }
});

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

billingRouter.post("/webhook", async (req, res) => {
  const accessToken = config.mercadoPago.accessToken;
  if (!accessToken) {
    return res.status(200).json({ received: true });
  }

  const body: any = req.body ?? {};
  const dataId =
    body?.data?.id ??
    (typeof req.query?.["data.id"] === "string" ? req.query?.["data.id"] : undefined) ??
    body?.id ??
    (typeof req.query?.id === "string" ? req.query?.id : undefined);

  if (!dataId) {
    return res.status(200).json({ received: true });
  }

  try {
    const paymentResponse = await axios.get(`${MP_BASE_URL}/v1/payments/${dataId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const payment = paymentResponse.data as {
      id: number;
      status: string;
      external_reference?: string;
      payment_method_id?: string;
    };

    const subscriptionId = payment.external_reference;
    if (!subscriptionId) {
      return res.status(200).json({ received: true });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription) {
      return res.status(200).json({ received: true });
    }

    if (subscription.mpPaymentId && String(subscription.mpPaymentId) === String(payment.id)) {
      return res.status(200).json({ received: true });
    }

    const paymentStatus = payment.status;
    let nextStatus: SubscriptionStatus = SubscriptionStatus.PENDING;
    if (paymentStatus === "approved") {
      nextStatus = SubscriptionStatus.ACTIVE;
    } else if (["rejected", "cancelled", "refunded", "charged_back"].includes(paymentStatus)) {
      nextStatus = SubscriptionStatus.PAST_DUE;
    }

    const startedAt = nextStatus === SubscriptionStatus.ACTIVE ? new Date() : subscription.startedAt ?? null;
    const currentPeriodEnd =
      nextStatus === SubscriptionStatus.ACTIVE
        ? resolvePeriodEnd(subscription.billingCycle as BillingCycle, startedAt)
        : subscription.currentPeriodEnd ?? null;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: nextStatus,
        startedAt,
        currentPeriodEnd,
        expiresAt: currentPeriodEnd ?? subscription.expiresAt,
        paymentProvider: "MERCADO_PAGO",
        paymentMethod: payment.payment_method_id ?? subscription.paymentMethod,
        mpPaymentId: String(payment.id)
      }
    });

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error({ err: error }, "Failed to handle Mercado Pago webhook");
    return res.status(200).json({ received: true });
  }
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
