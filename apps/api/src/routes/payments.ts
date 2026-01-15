import { randomUUID } from "node:crypto";
import { Router, type Response } from "express";
import { prisma } from "@gestao/database";
import { SubscriptionStatus } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { BillingCycle, getPlanDefinition, getPlanPriceCents, getPlanProduct } from "../config/plans";
import { getActiveSubscriptionForUser } from "../services/subscriptions";
import { logger } from "../config/logger";
import { resolveWebhookUrl, syncSubscriptionFromPayment } from "../services/mercadopago";
import {
  MercadoPagoClientError,
  mercadopagoGet,
  mercadopagoPost
} from "../services/mercadopagoClient";

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

const normalizeIdentificationNumber = (value?: string | null) => {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits || null;
};

const buildError = (
  requestId: string,
  message: string,
  code: string,
  details?: Record<string, unknown>
) => ({
  message,
  code,
  requestId,
  ...(details ? { details } : {})
});

const handleMercadoPagoError = (
  res: Response,
  requestId: string,
  error: unknown,
  fallbackMessage: string
) => {
  if (error instanceof MercadoPagoClientError) {
    const status = error.status ?? 502;
    const message = error.message || fallbackMessage;
    return res.status(status).json(buildError(requestId, message, error.code ?? "MP_ERROR", error.details));
  }
  logger.error({ err: error, requestId }, "Unexpected Mercado Pago error");
  return res.status(502).json(buildError(requestId, fallbackMessage, "MP_ERROR"));
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

paymentsRouter.get("/identification_types", async (req, res) => {
  const requestId = randomUUID();
  if (!req.user) {
    return res.status(401).json(buildError(requestId, "Authentication required", "UNAUTHORIZED"));
  }

  try {
    const response = await mercadopagoGet<any[]>(requestId, "/v1/identification_types");
    return res.status(200).json(response);
  } catch (error) {
    return handleMercadoPagoError(res, requestId, error, "Falha ao carregar documentos.");
  }
});

paymentsRouter.get("/payment_methods", async (req, res) => {
  const requestId = randomUUID();
  if (!req.user) {
    return res.status(401).json(buildError(requestId, "Authentication required", "UNAUTHORIZED"));
  }

  try {
    const response = await mercadopagoGet<any[]>(requestId, "/v1/payment_methods");
    return res.status(200).json(response);
  } catch (error) {
    return handleMercadoPagoError(res, requestId, error, "Falha ao consultar metodos de pagamento.");
  }
});

paymentsRouter.get("/installments", async (req, res) => {
  const requestId = randomUUID();
  if (!req.user) {
    return res.status(401).json(buildError(requestId, "Authentication required", "UNAUTHORIZED"));
  }

  const amount = parseAmount(req.query.transaction_amount ?? req.query.amount);
  if (!amount) {
    return res.status(400).json(buildError(requestId, "amount obrigatorio.", "VALIDATION_ERROR"));
  }

  const paymentMethodId =
    typeof req.query.payment_method_id === "string"
      ? req.query.payment_method_id
      : typeof req.query.paymentMethodId === "string"
        ? req.query.paymentMethodId
        : "";
  if (!paymentMethodId) {
    return res.status(400).json(buildError(requestId, "payment_method_id obrigatorio.", "VALIDATION_ERROR"));
  }

  const issuerId =
    typeof req.query.issuer_id === "string"
      ? req.query.issuer_id
      : typeof req.query.issuerId === "string"
        ? req.query.issuerId
        : null;

  try {
    const response = await mercadopagoGet<any[]>(requestId, "/v1/payment_methods/installments", {
      amount,
      payment_method_id: paymentMethodId,
      ...(issuerId ? { issuer_id: issuerId } : {})
    });
    return res.status(200).json(response);
  } catch (error) {
    return handleMercadoPagoError(res, requestId, error, "Falha ao calcular parcelas.");
  }
});

paymentsRouter.post("/pix", async (req, res) => {
  const requestId = randomUUID();
  if (!req.user) {
    return res.status(401).json(buildError(requestId, "Authentication required", "UNAUTHORIZED"));
  }

  const body = req.body ?? {};
  const payerFromBody = body.payer && typeof body.payer === "object" ? body.payer : null;
  const identification =
    payerFromBody && typeof payerFromBody.identification === "object" ? payerFromBody.identification : null;
  const identificationType = typeof identification?.type === "string" ? identification.type.trim() : "";
  const identificationNumber = normalizeIdentificationNumber(
    typeof identification?.number === "string" ? identification.number : null
  );

  if (!identificationType || !identificationNumber) {
    return res
      .status(400)
      .json(buildError(requestId, "identification obrigatorio.", "VALIDATION_ERROR"));
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
    return res
      .status(400)
      .json(buildError(requestId, error instanceof Error ? error.message : "Plano invalido.", "VALIDATION_ERROR"));
  }

  const payerEmail = normalizeEmail(req.user.email);
  if (!payerEmail) {
    return res
      .status(400)
      .json(buildError(requestId, "Email do usuario nao encontrado.", "VALIDATION_ERROR"));
  }

  let subscription = null;
  let externalReference = providedExternalReference;
  if (externalReference) {
    subscription = await prisma.subscription.findUnique({ where: { id: externalReference } });
    if (!subscription || subscription.userId !== req.user.id) {
      return res.status(404).json(buildError(requestId, "Assinatura nao encontrada.", "NOT_FOUND"));
    }
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      return res
        .status(409)
        .json(buildError(requestId, "Voce ja possui uma assinatura ativa.", "CONFLICT"));
    }
  } else {
    if (!planContext) {
      return res
        .status(400)
        .json(buildError(requestId, "planCode obrigatorio quando externalReference nao for informado.", "VALIDATION_ERROR"));
    }
    try {
      subscription = await createPendingSubscription(req.user, planContext.planCode, planContext.billingCycle, "pix");
      externalReference = subscription.id;
    } catch (error) {
      return res
        .status(400)
        .json(buildError(requestId, error instanceof Error ? error.message : "Falha ao criar assinatura.", "VALIDATION_ERROR"));
    }
  }

  const requestedAmount = parseAmount(body.transaction_amount ?? body.amount);
  const resolvedAmount = planContext ? planContext.amountCents / 100 : requestedAmount;
  if (!resolvedAmount) {
    return res.status(400).json(buildError(requestId, "amount obrigatorio.", "VALIDATION_ERROR"));
  }
  if (requestedAmount && planContext && !matchesAmount(requestedAmount, planContext.amountCents)) {
    return res
      .status(400)
      .json(buildError(requestId, "amount nao corresponde ao valor do plano.", "VALIDATION_ERROR"));
  }

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : planContext?.planName ?? "Pagamento Pix";

  const notificationUrl = resolveWebhookUrl();
  const paymentPayload = {
    transaction_amount: resolvedAmount,
    description,
    payment_method_id: "pix",
    payer: {
      email: payerEmail,
      identification: {
        type: identificationType,
        number: identificationNumber
      }
    },
    external_reference: externalReference,
    ...(notificationUrl ? { notification_url: notificationUrl } : {})
  };

  logger.info(
    {
      requestId,
      mp: {
        method: "pix",
        amount: resolvedAmount,
        externalReference,
        notificationUrl
      }
    },
    "Mercado Pago pix payment request"
  );

  try {
    const payment = await mercadopagoPost<{
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
    }>(requestId, "/v1/payments", paymentPayload);

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
      return res.status(502).json(buildError(requestId, "Falha ao gerar QR Code Pix.", "MP_ERROR"));
    }

    return res.status(201).json({
      payment_id: String(payment.id),
      status: payment.status,
      qr_code: transactionData.qr_code,
      qr_code_base64: transactionData.qr_code_base64,
      externalReference
    });
  } catch (error) {
    return handleMercadoPagoError(res, requestId, error, "Falha ao criar pagamento Pix.");
  }
});

paymentsRouter.post("/card", async (req, res) => {
  const requestId = randomUUID();
  if (!req.user) {
    return res.status(401).json(buildError(requestId, "Authentication required", "UNAUTHORIZED"));
  }

  const body = req.body ?? {};
  const cardToken =
    typeof body.cardToken === "string" ? body.cardToken : typeof body.token === "string" ? body.token : null;
  if (!cardToken) {
    return res.status(400).json(buildError(requestId, "token obrigatorio.", "VALIDATION_ERROR"));
  }

  const paymentMethodId =
    typeof body.paymentMethodId === "string"
      ? body.paymentMethodId
      : typeof body.payment_method_id === "string"
        ? body.payment_method_id
        : null;
  if (!paymentMethodId) {
    return res.status(400).json(buildError(requestId, "payment_method_id obrigatorio.", "VALIDATION_ERROR"));
  }

  const issuerId =
    typeof body.issuer_id === "string"
      ? body.issuer_id
      : typeof body.issuerId === "string"
        ? body.issuerId
        : null;
  const installments = Number(body.installments);
  if (!Number.isFinite(installments) || installments < 1) {
    return res.status(400).json(buildError(requestId, "installments obrigatorio.", "VALIDATION_ERROR"));
  }

  const providedPlanCode = typeof body.planCode === "string" ? body.planCode : null;
  const billingCycle = resolveBillingCycle(body.billingCycle);
  const providedExternalReference = typeof body.externalReference === "string" ? body.externalReference : null;
  const payerFromBody = body.payer && typeof body.payer === "object" ? body.payer : null;
  const identification =
    payerFromBody && typeof payerFromBody.identification === "object" ? payerFromBody.identification : null;
  const identificationType = typeof identification?.type === "string" ? identification.type.trim() : "";
  const identificationNumber = normalizeIdentificationNumber(
    typeof identification?.number === "string" ? identification.number : null
  );

  if (!identificationType || !identificationNumber) {
    return res
      .status(400)
      .json(buildError(requestId, "identification obrigatorio.", "VALIDATION_ERROR"));
  }

  let planContext: PlanContext | null = null;
  try {
    if (providedPlanCode) {
      planContext = buildPlanContext(providedPlanCode, billingCycle);
    }
  } catch (error) {
    return res
      .status(400)
      .json(buildError(requestId, error instanceof Error ? error.message : "Plano invalido.", "VALIDATION_ERROR"));
  }

  const payerEmail = normalizeEmail(req.user.email);
  if (!payerEmail) {
    return res
      .status(400)
      .json(buildError(requestId, "Email do usuario nao encontrado.", "VALIDATION_ERROR"));
  }

  let subscription = null;
  let externalReference = providedExternalReference;
  if (externalReference) {
    subscription = await prisma.subscription.findUnique({ where: { id: externalReference } });
    if (!subscription || subscription.userId !== req.user.id) {
      return res.status(404).json(buildError(requestId, "Assinatura nao encontrada.", "NOT_FOUND"));
    }
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      return res
        .status(409)
        .json(buildError(requestId, "Voce ja possui uma assinatura ativa.", "CONFLICT"));
    }
  } else {
    if (!planContext) {
      return res
        .status(400)
        .json(buildError(requestId, "planCode obrigatorio quando externalReference nao for informado.", "VALIDATION_ERROR"));
    }
    try {
      subscription = await createPendingSubscription(req.user, planContext.planCode, planContext.billingCycle, "card");
      externalReference = subscription.id;
    } catch (error) {
      return res
        .status(400)
        .json(buildError(requestId, error instanceof Error ? error.message : "Falha ao criar assinatura.", "VALIDATION_ERROR"));
    }
  }

  const requestedAmount = parseAmount(body.transaction_amount ?? body.amount);
  const resolvedAmount = planContext ? planContext.amountCents / 100 : requestedAmount;
  if (!resolvedAmount) {
    return res.status(400).json(buildError(requestId, "amount obrigatorio.", "VALIDATION_ERROR"));
  }
  if (requestedAmount && planContext && !matchesAmount(requestedAmount, planContext.amountCents)) {
    return res
      .status(400)
      .json(buildError(requestId, "amount nao corresponde ao valor do plano.", "VALIDATION_ERROR"));
  }

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : planContext?.planName ?? "Pagamento Cartao";

  const notificationUrl = resolveWebhookUrl();
  const paymentPayload = {
    transaction_amount: resolvedAmount,
    token: cardToken,
    description,
    installments,
    payment_method_id: paymentMethodId,
    payer: {
      email: payerEmail,
      identification: {
        type: identificationType,
        number: identificationNumber
      }
    },
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
        externalReference,
        installments,
        issuerId,
        paymentMethodId,
        notificationUrl
      }
    },
    "Mercado Pago card payment request"
  );

  try {
    const payment = await mercadopagoPost<{
      id: number | string;
      status: string;
      status_detail?: string;
      external_reference?: string;
      payment_method_id?: string;
    }>(requestId, "/v1/payments", paymentPayload);

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
    return handleMercadoPagoError(res, requestId, error, "Falha ao criar pagamento com cartao.");
  }
});
