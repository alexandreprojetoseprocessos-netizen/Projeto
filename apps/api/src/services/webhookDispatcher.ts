import crypto from "node:crypto";
import axios from "axios";
import { prisma } from "@gestao/database";
import { WebhookDeliveryStatus, type IntegrationProvider, type Prisma, type WebhookSubscription } from "@prisma/client";
import { logger } from "../config/logger";
import { writeAuditLog } from "./audit";
import { sendCriticalWebhookAlertEmail } from "./emailNotifications";
import { dispatchSlackIntegrationEvent } from "./integrationConnections";

type DispatchClient = Prisma.TransactionClient | typeof prisma;

export const WEBHOOK_EVENT_CATALOG = [
  "organization.created",
  "organization.updated",
  "organization.deactivated",
  "organization.trashed",
  "organization.restored",
  "organization.deleted",
  "integration.test",
  "integration.webhook.critical"
] as const;

const DELIVERY_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BODY_LENGTH = 2_000;
const WEBHOOK_SIGNATURE_ALG = "HMAC-SHA256";
const WEBHOOK_SIGNATURE_VERSION = "v1";
const WEBHOOK_CRITICAL_ALERT_EVENT = "integration.webhook.critical";
const WEBHOOK_CRITICAL_ALERT_WINDOW_HOURS = 24;
const WEBHOOK_CRITICAL_ALERT_COOLDOWN_MINUTES = 60;

type DeliveryEnvelope = {
  id: string;
  event: string;
  occurredAt: string;
  organizationId: string;
  actorId?: string | null;
  entity?: string | null;
  entityId?: string | null;
  payload: Record<string, unknown>;
};

const truncateText = (value?: string | null) => {
  if (!value) return null;
  return value.length > MAX_RESPONSE_BODY_LENGTH ? `${value.slice(0, MAX_RESPONSE_BODY_LENGTH)}...` : value;
};

const signWebhookPayload = (secret: string, rawBody: string) =>
  crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

const signWebhookPayloadWithTimestamp = ({
  secret,
  timestamp,
  rawBody
}: {
  secret: string;
  timestamp: string;
  rawBody: string;
}) => signWebhookPayload(secret, `${timestamp}.${rawBody}`);

const supportsEvent = (subscription: WebhookSubscription, eventName: string) =>
  subscription.eventNames.includes("*") || subscription.eventNames.includes(eventName);

export const summarizeWebhookSubscription = (
  subscription: WebhookSubscription & {
    createdBy?: { id: string; fullName: string; email: string } | null;
    _count?: { deliveries: number };
  }
) => ({
  id: subscription.id,
  name: subscription.name,
  provider: subscription.provider,
  targetUrl: subscription.targetUrl,
  eventNames: subscription.eventNames,
  isActive: subscription.isActive,
  createdAt: subscription.createdAt,
  updatedAt: subscription.updatedAt,
  lastTriggeredAt: subscription.lastTriggeredAt,
  deliveriesCount: subscription._count?.deliveries ?? 0,
  createdBy: subscription.createdBy
    ? {
        id: subscription.createdBy.id,
        fullName: subscription.createdBy.fullName,
        email: subscription.createdBy.email
      }
    : null
});

export const sanitizeWebhookTargetUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

export const listWebhookSubscriptions = async (organizationId: string) =>
  prisma.webhookSubscription.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      },
      _count: {
        select: {
          deliveries: true
        }
      }
    }
  });

export const listWebhookDeliveries = async (organizationId: string, subscriptionId: string, limit = 20) =>
  prisma.webhookDelivery.findMany({
    where: {
      organizationId,
      subscriptionId
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });

type WebhookHealthLevel = "HEALTHY" | "WARNING" | "CRITICAL" | "IDLE" | "INACTIVE";

export type WebhookHealthItem = {
  id: string;
  name: string;
  provider: IntegrationProvider;
  isActive: boolean;
  attempts: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  successRate: number;
  failedRate: number;
  lastTriggeredAt: string | null;
  lastFailureAt: string | null;
  level: WebhookHealthLevel;
};

export type WebhookHealthSummary = {
  windowHours: number;
  generatedAt: string;
  totalWebhooks: number;
  activeWebhooks: number;
  totalAttempts: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  successRate: number;
  warningCount: number;
  criticalCount: number;
};

export type WebhookHealthAlert = {
  id: string;
  level: "WARNING" | "CRITICAL";
  webhookId: string;
  webhookName: string;
  attempts: number;
  failedCount: number;
  failedRate: number;
  title: string;
  message: string;
  recommendedAction: string;
};

export const getWebhookHealthByOrganization = async ({
  organizationId,
  windowHours = 24
}: {
  organizationId: string;
  windowHours?: number;
}) => {
  const safeWindowHours = Number.isFinite(windowHours) ? Math.min(Math.max(windowHours, 1), 168) : 24;
  const since = new Date(Date.now() - safeWindowHours * 60 * 60 * 1000);

  const [subscriptions, recentDeliveries] = await Promise.all([
    prisma.webhookSubscription.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        provider: true,
        isActive: true,
        lastTriggeredAt: true
      }
    }),
    prisma.webhookDelivery.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: since
        }
      },
      select: {
        subscriptionId: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })
  ]);

  const counters = new Map<
    string,
    {
      attempts: number;
      successCount: number;
      failedCount: number;
      pendingCount: number;
      lastFailureAt: string | null;
    }
  >();

  recentDeliveries.forEach((delivery) => {
    const current = counters.get(delivery.subscriptionId) ?? {
      attempts: 0,
      successCount: 0,
      failedCount: 0,
      pendingCount: 0,
      lastFailureAt: null
    };
    current.attempts += 1;
    if (delivery.status === WebhookDeliveryStatus.SUCCESS) current.successCount += 1;
    if (delivery.status === WebhookDeliveryStatus.FAILED) {
      current.failedCount += 1;
      if (!current.lastFailureAt) {
        current.lastFailureAt = delivery.createdAt.toISOString();
      }
    }
    if (delivery.status === WebhookDeliveryStatus.PENDING) current.pendingCount += 1;
    counters.set(delivery.subscriptionId, current);
  });

  const webhooks: WebhookHealthItem[] = subscriptions
    .map((subscription) => {
      const stat = counters.get(subscription.id) ?? {
        attempts: 0,
        successCount: 0,
        failedCount: 0,
        pendingCount: 0,
        lastFailureAt: null
      };
      const successRate = stat.attempts > 0 ? Number((stat.successCount / stat.attempts).toFixed(4)) : 0;
      const failedRate = stat.attempts > 0 ? Number((stat.failedCount / stat.attempts).toFixed(4)) : 0;

      let level: WebhookHealthLevel = "HEALTHY";
      if (!subscription.isActive) level = "INACTIVE";
      else if (stat.attempts === 0) level = "IDLE";
      else if (failedRate >= 0.35 || (stat.failedCount >= 5 && failedRate >= 0.2)) level = "CRITICAL";
      else if (stat.failedCount > 0) level = "WARNING";

      return {
        id: subscription.id,
        name: subscription.name,
        provider: subscription.provider,
        isActive: subscription.isActive,
        attempts: stat.attempts,
        successCount: stat.successCount,
        failedCount: stat.failedCount,
        pendingCount: stat.pendingCount,
        successRate,
        failedRate,
        lastTriggeredAt: subscription.lastTriggeredAt?.toISOString() ?? null,
        lastFailureAt: stat.lastFailureAt,
        level
      };
    })
    .sort((a, b) => {
      const severity = { CRITICAL: 0, WARNING: 1, HEALTHY: 2, IDLE: 3, INACTIVE: 4 } as const;
      const bySeverity = severity[a.level] - severity[b.level];
      if (bySeverity !== 0) return bySeverity;
      return b.attempts - a.attempts;
    });

  const totalAttempts = webhooks.reduce((acc, item) => acc + item.attempts, 0);
  const successCount = webhooks.reduce((acc, item) => acc + item.successCount, 0);
  const failedCount = webhooks.reduce((acc, item) => acc + item.failedCount, 0);
  const pendingCount = webhooks.reduce((acc, item) => acc + item.pendingCount, 0);
  const successRate = totalAttempts > 0 ? Number((successCount / totalAttempts).toFixed(4)) : 0;

  const summary: WebhookHealthSummary = {
    windowHours: safeWindowHours,
    generatedAt: new Date().toISOString(),
    totalWebhooks: webhooks.length,
    activeWebhooks: webhooks.filter((item) => item.isActive).length,
    totalAttempts,
    successCount,
    failedCount,
    pendingCount,
    successRate,
    warningCount: webhooks.filter((item) => item.level === "WARNING").length,
    criticalCount: webhooks.filter((item) => item.level === "CRITICAL").length
  };

  const alerts: WebhookHealthAlert[] = webhooks
    .filter((item) => item.level === "CRITICAL" || item.level === "WARNING")
    .map((item) => {
      const level: WebhookHealthAlert["level"] = item.level === "CRITICAL" ? "CRITICAL" : "WARNING";
      const failedPercent = Math.round(item.failedRate * 100);
      return {
        id: `${item.id}:${level}`,
        level,
        webhookId: item.id,
        webhookName: item.name,
        attempts: item.attempts,
        failedCount: item.failedCount,
        failedRate: item.failedRate,
        title:
          level === "CRITICAL"
            ? `Webhook crítico: ${item.name}`
            : `Webhook em atenção: ${item.name}`,
        message:
          level === "CRITICAL"
            ? `${item.failedCount} falhas em ${item.attempts} envios (${failedPercent}%). Risco alto de perda de integração.`
            : `${item.failedCount} falhas em ${item.attempts} envios (${failedPercent}%). Monitorar e corrigir destino.`,
        recommendedAction:
          level === "CRITICAL"
            ? "Validar URL/credenciais, testar endpoint e reenfileirar falhas."
            : "Acompanhar próximas entregas e executar retry se necessário."
      };
    })
    .sort((a, b) => {
      const levelScore = { CRITICAL: 0, WARNING: 1 } as const;
      const byLevel = levelScore[a.level] - levelScore[b.level];
      if (byLevel !== 0) return byLevel;
      return b.failedRate - a.failedRate;
    });

  return {
    summary,
    webhooks,
    alerts
  };
};

const notifyCriticalWebhookAlertIfNeeded = async ({
  organizationId,
  webhookId,
  webhookName
}: {
  organizationId: string;
  webhookId: string;
  webhookName: string;
}) => {
  try {
    const since = new Date(Date.now() - WEBHOOK_CRITICAL_ALERT_WINDOW_HOURS * 60 * 60 * 1000);
    const [attempts, failedCount] = await Promise.all([
      prisma.webhookDelivery.count({
        where: {
          organizationId,
          subscriptionId: webhookId,
          createdAt: { gte: since }
        }
      }),
      prisma.webhookDelivery.count({
        where: {
          organizationId,
          subscriptionId: webhookId,
          status: WebhookDeliveryStatus.FAILED,
          createdAt: { gte: since }
        }
      })
    ]);

    if (attempts <= 0) return;
    const failedRate = failedCount / attempts;
    const isCritical = failedRate >= 0.35 || (failedCount >= 5 && failedRate >= 0.2);
    if (!isCritical) return;

    const cooldownSince = new Date(Date.now() - WEBHOOK_CRITICAL_ALERT_COOLDOWN_MINUTES * 60 * 1000);
    const alreadyNotified = await prisma.auditLog.findFirst({
      where: {
        organizationId,
        action: "INTEGRATION_WEBHOOK_CRITICAL_ALERT_SENT",
        entity: "WEBHOOK_SUBSCRIPTION",
        entityId: webhookId,
        createdAt: { gte: cooldownSince }
      },
      select: { id: true }
    });
    if (alreadyNotified) return;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true }
    });

    const [slackDispatch, emailDispatch] = await Promise.all([
      dispatchSlackIntegrationEvent({
        organizationId,
        organizationName: organization?.name ?? null,
        eventName: WEBHOOK_CRITICAL_ALERT_EVENT,
        entity: "WEBHOOK_SUBSCRIPTION",
        entityId: webhookId,
        payload: {
          webhookId,
          webhookName,
          attempts,
          failedCount,
          failedRate: Number(failedRate.toFixed(4)),
          windowHours: WEBHOOK_CRITICAL_ALERT_WINDOW_HOURS
        }
      }),
      sendCriticalWebhookAlertEmail({
        organizationId,
        organizationName: organization?.name ?? null,
        webhookId,
        webhookName,
        attempts,
        failedCount,
        failedRate: Number(failedRate.toFixed(4)),
        windowHours: WEBHOOK_CRITICAL_ALERT_WINDOW_HOURS
      })
    ]);

    const deliveredChannels: string[] = [];
    if (slackDispatch.dispatched > 0) deliveredChannels.push("SLACK");
    if (emailDispatch.delivered) deliveredChannels.push("EMAIL");

    if (!deliveredChannels.length) return;

    await writeAuditLog({
      organizationId,
      action: "INTEGRATION_WEBHOOK_CRITICAL_ALERT_SENT",
      entity: "WEBHOOK_SUBSCRIPTION",
      entityId: webhookId,
      diff: {
        channels: deliveredChannels,
        webhookName,
        attempts,
        failedCount,
        failedRate: Number(failedRate.toFixed(4)),
        cooldownMinutes: WEBHOOK_CRITICAL_ALERT_COOLDOWN_MINUTES,
        emailRecipients: emailDispatch.recipients,
        emailSkippedReason: emailDispatch.skippedReason ?? null
      } as Prisma.InputJsonValue
    });
  } catch (error) {
    logger.warn(
      {
        err: error,
        organizationId,
        webhookId
      },
      "Failed to dispatch critical webhook alert"
    );
  }
};

export type RetriedWebhookDelivery = {
  id: string;
  subscriptionId: string;
  eventName: string;
};

export const retryWebhookDelivery = async ({
  organizationId,
  subscriptionId,
  deliveryId
}: {
  organizationId: string;
  subscriptionId: string;
  deliveryId: string;
}) => {
  const delivery = await prisma.webhookDelivery.findFirst({
    where: {
      id: deliveryId,
      organizationId,
      subscriptionId
    },
    include: {
      subscription: true
    }
  });

  if (!delivery) return null;

  const rawEnvelope =
    delivery.payload && typeof delivery.payload === "object" && !Array.isArray(delivery.payload)
      ? (delivery.payload as Record<string, unknown>)
      : null;
  const rawPayload =
    rawEnvelope?.payload && typeof rawEnvelope.payload === "object" && !Array.isArray(rawEnvelope.payload)
      ? (rawEnvelope.payload as Record<string, unknown>)
      : {};

  const envelope: DeliveryEnvelope = {
    id: crypto.randomUUID(),
    event: typeof rawEnvelope?.event === "string" ? rawEnvelope.event : delivery.eventName,
    occurredAt: new Date().toISOString(),
    organizationId: delivery.organizationId,
    actorId: typeof rawEnvelope?.actorId === "string" ? rawEnvelope.actorId : null,
    entity: typeof rawEnvelope?.entity === "string" ? rawEnvelope.entity : null,
    entityId: typeof rawEnvelope?.entityId === "string" ? rawEnvelope.entityId : null,
    payload: rawPayload
  };

  await deliverToSubscription({
    subscription: delivery.subscription,
    envelope
  });

  return {
    id: delivery.id,
    subscriptionId: delivery.subscriptionId,
    eventName: delivery.eventName
  } as RetriedWebhookDelivery;
};

export const retryWebhookDeliveriesBatch = async ({
  organizationId,
  subscriptionId,
  deliveryIds
}: {
  organizationId: string;
  subscriptionId: string;
  deliveryIds: string[];
}) => {
  const uniqueIds = [...new Set(deliveryIds.filter((id) => typeof id === "string" && id.trim().length > 0))];
  const results = await Promise.allSettled(
    uniqueIds.map((deliveryId) =>
      retryWebhookDelivery({
        organizationId,
        subscriptionId,
        deliveryId
      })
    )
  );

  const retried: RetriedWebhookDelivery[] = [];
  const failed: Array<{ deliveryId: string; reason: string }> = [];

  results.forEach((result, index) => {
    const deliveryId = uniqueIds[index]!;
    if (result.status === "fulfilled" && result.value) {
      retried.push(result.value);
      return;
    }
    if (result.status === "fulfilled" && !result.value) {
      failed.push({ deliveryId, reason: "NOT_FOUND" });
      return;
    }
    failed.push({ deliveryId, reason: "RETRY_ERROR" });
  });

  return {
    retried,
    failed
  };
};

export const createWebhookSubscription = async ({
  client = prisma,
  organizationId,
  createdById,
  provider,
  name,
  targetUrl,
  secret,
  eventNames
}: {
  client?: DispatchClient;
  organizationId: string;
  createdById: string;
  provider?: IntegrationProvider;
  name: string;
  targetUrl: string;
  secret: string;
  eventNames: string[];
}) =>
  client.webhookSubscription.create({
    data: {
      organizationId,
      createdById,
      provider: provider ?? "CUSTOM",
      name,
      targetUrl,
      secret,
      eventNames
    }
  });

export const updateWebhookSubscription = async ({
  client = prisma,
  organizationId,
  subscriptionId,
  data
}: {
  client?: DispatchClient;
  organizationId: string;
  subscriptionId: string;
  data: Prisma.WebhookSubscriptionUpdateInput;
}) => {
  const existing = await client.webhookSubscription.findFirst({
    where: {
      id: subscriptionId,
      organizationId
    }
  });

  if (!existing) return null;

  return client.webhookSubscription.update({
    where: {
      id: subscriptionId
    },
    data
  });
};

export const deleteWebhookSubscription = async ({
  client = prisma,
  organizationId,
  subscriptionId
}: {
  client?: DispatchClient;
  organizationId: string;
  subscriptionId: string;
}) =>
  client.webhookSubscription.deleteMany({
    where: {
      id: subscriptionId,
      organizationId
    }
  });

const deliverToSubscription = async ({
  subscription,
  envelope
}: {
  subscription: WebhookSubscription;
  envelope: DeliveryEnvelope;
}) => {
  const rawPayload = JSON.stringify(envelope);
  const signatureTimestamp = Math.floor(Date.now() / 1000).toString();
  const signatureV1 = signWebhookPayloadWithTimestamp({
    secret: subscription.secret,
    timestamp: signatureTimestamp,
    rawBody: rawPayload
  });
  const delivery = await prisma.webhookDelivery.create({
    data: {
      subscriptionId: subscription.id,
      organizationId: subscription.organizationId,
      eventName: envelope.event,
      requestId: envelope.id,
      payload: envelope as unknown as Prisma.InputJsonValue,
      status: WebhookDeliveryStatus.PENDING
    }
  });

  const startedAt = new Date();

  try {
    const response = await axios.post(subscription.targetUrl, envelope, {
      timeout: DELIVERY_TIMEOUT_MS,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "meu-gp-webhooks/1.0",
        "X-Webhook-Event": envelope.event,
        "X-Webhook-Id": envelope.id,
        // legacy signature kept for backward compatibility
        "X-Webhook-Signature": `sha256=${signWebhookPayload(subscription.secret, rawPayload)}`,
        // replay-safe signature format
        "X-Webhook-Signature-Alg": WEBHOOK_SIGNATURE_ALG,
        "X-Webhook-Signature-Version": WEBHOOK_SIGNATURE_VERSION,
        "X-Webhook-Signature-Timestamp": signatureTimestamp,
        "X-Webhook-Signature-V1": `t=${signatureTimestamp},v1=${signatureV1}`
      },
      validateStatus: () => true
    });

    const ok = response.status >= 200 && response.status < 300;
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: ok ? WebhookDeliveryStatus.SUCCESS : WebhookDeliveryStatus.FAILED,
        responseStatus: response.status,
        responseBody:
          typeof response.data === "string"
            ? truncateText(response.data)
            : truncateText(JSON.stringify(response.data)),
        deliveredAt: ok ? new Date() : null,
        lastAttemptAt: startedAt
      }
    });

    await prisma.webhookSubscription.update({
      where: { id: subscription.id },
      data: { lastTriggeredAt: new Date() }
    });

    if (!ok) {
      void notifyCriticalWebhookAlertIfNeeded({
        organizationId: subscription.organizationId,
        webhookId: subscription.id,
        webhookName: subscription.name
      });
      logger.warn(
        {
          organizationId: subscription.organizationId,
          subscriptionId: subscription.id,
          event: envelope.event,
          status: response.status
        },
        "Webhook delivery responded with non-2xx status"
      );
    }
  } catch (error) {
    const candidateError = error as {
      message?: string;
      response?: { status?: number; data?: unknown };
    };
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: WebhookDeliveryStatus.FAILED,
        responseStatus: candidateError.response?.status ?? null,
        responseBody:
          typeof candidateError.response?.data === "string"
            ? truncateText(candidateError.response.data)
            : candidateError.response?.data
            ? truncateText(JSON.stringify(candidateError.response.data))
            : null,
        errorMessage: truncateText(candidateError.message ?? "Unknown webhook delivery error"),
        lastAttemptAt: startedAt
      }
    });

    void notifyCriticalWebhookAlertIfNeeded({
      organizationId: subscription.organizationId,
      webhookId: subscription.id,
      webhookName: subscription.name
    });

    logger.warn(
      {
        err: error,
        organizationId: subscription.organizationId,
        subscriptionId: subscription.id,
        event: envelope.event
      },
      "Failed to deliver webhook"
    );
  }
};

export const dispatchIntegrationEvent = async ({
  organizationId,
  organizationName,
  eventName,
  actorId,
  entity,
  entityId,
  payload
}: {
  organizationId: string;
  organizationName?: string | null;
  eventName: string;
  actorId?: string | null;
  entity?: string | null;
  entityId?: string | null;
  payload: Record<string, unknown>;
}) => {
  const subscriptions = await prisma.webhookSubscription.findMany({
    where: {
      organizationId,
      isActive: true
    }
  });

  const envelope: DeliveryEnvelope = {
    id: crypto.randomUUID(),
    event: eventName,
    occurredAt: new Date().toISOString(),
    organizationId,
    actorId: actorId ?? null,
    entity: entity ?? null,
    entityId: entityId ?? null,
    payload
  };

  const matches = subscriptions.filter((subscription) => supportsEvent(subscription, eventName));

  await Promise.allSettled(matches.map((subscription) => deliverToSubscription({ subscription, envelope })));

  const slackResult = await dispatchSlackIntegrationEvent({
    organizationId,
    organizationName,
    eventName,
    entity,
    entityId,
    payload
  });

  return { dispatched: matches.length + slackResult.dispatched };
};
