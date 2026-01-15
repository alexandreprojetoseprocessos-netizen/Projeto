import crypto from "node:crypto";
import { prisma } from "@gestao/database";
import { SubscriptionStatus } from "@prisma/client";
import { config } from "../config/env";
import type { BillingCycle } from "../config/plans";

export const MP_BASE_URL = "https://api.mercadopago.com";

const resolveBaseUrl = () => {
  if (!config.mercadoPago.publicApiUrl) return null;
  const base = config.mercadoPago.publicApiUrl.endsWith("/")
    ? config.mercadoPago.publicApiUrl.slice(0, -1)
    : config.mercadoPago.publicApiUrl;
  return base;
};

export const resolveWebhookUrl = () => {
  const base = resolveBaseUrl();
  return base ? `${base}/webhooks/mercadopago` : null;
};

export const resolvePeriodEnd = (cycle: BillingCycle, startAt?: Date | null) => {
  const base = startAt ?? new Date();
  const next = new Date(base);
  next.setMonth(next.getMonth() + (cycle === "ANNUAL" ? 12 : 1));
  return next;
};

export type MercadoPagoPayment = {
  id: string | number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  payment_method_id?: string;
};

export const syncSubscriptionFromPayment = async (payment: MercadoPagoPayment) => {
  const subscriptionId = payment.external_reference;
  if (!subscriptionId) return null;

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId }
  });
  if (!subscription) return null;

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

  return prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: nextStatus,
      startedAt,
      currentPeriodEnd,
      expiresAt: currentPeriodEnd ?? subscription.expiresAt,
      paymentProvider: "MERCADO_PAGO",
      paymentMethod: payment.payment_method_id ?? subscription.paymentMethod,
      mpPaymentId: String(payment.id),
      providerRef: String(payment.id)
    }
  });
};

const parseSignatureHeader = (value?: string) => {
  if (!value) return {};
  return value.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, rawValue] = part.split("=");
    if (!key || !rawValue) return acc;
    acc[key.trim()] = rawValue.trim();
    return acc;
  }, {});
};

const safeCompare = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const verifyMercadoPagoSignature = (params: {
  rawBody?: string;
  headers: Record<string, string | string[] | undefined>;
  dataId?: string | number;
}) => {
  const secret = config.mercadoPago.webhookSecret;
  if (!secret) return true;

  const signatureHeader = Array.isArray(params.headers["x-signature"])
    ? params.headers["x-signature"][0]
    : params.headers["x-signature"];
  if (!signatureHeader || typeof signatureHeader !== "string") {
    return false;
  }

  const signatureParts = parseSignatureHeader(signatureHeader);
  const ts = signatureParts.ts;
  const v1 = signatureParts.v1;
  if (!ts || !v1) {
    return false;
  }

  const requestId = Array.isArray(params.headers["x-request-id"])
    ? params.headers["x-request-id"][0]
    : params.headers["x-request-id"];

  const candidates: string[] = [];
  if (requestId && params.dataId) {
    candidates.push(`id:${params.dataId};request-id:${requestId};ts:${ts};`);
  }
  if (params.rawBody) {
    candidates.push(params.rawBody);
  }

  if (!candidates.length) {
    return false;
  }

  return candidates.some((candidate) => {
    const digest = crypto.createHmac("sha256", secret).update(candidate, "utf8").digest("hex");
    return safeCompare(digest, v1);
  });
};
