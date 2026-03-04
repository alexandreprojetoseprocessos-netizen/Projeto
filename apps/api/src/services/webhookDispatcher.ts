import crypto from "node:crypto";
import axios from "axios";
import { prisma } from "@gestao/database";
import { WebhookDeliveryStatus, type IntegrationProvider, type Prisma, type WebhookSubscription } from "@prisma/client";
import { logger } from "../config/logger";
import { dispatchSlackIntegrationEvent } from "./integrationConnections";

type DispatchClient = Prisma.TransactionClient | typeof prisma;

export const WEBHOOK_EVENT_CATALOG = [
  "organization.created",
  "organization.updated",
  "organization.deactivated",
  "organization.trashed",
  "organization.restored",
  "organization.deleted",
  "integration.test"
] as const;

const DELIVERY_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BODY_LENGTH = 2_000;

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
        "X-Webhook-Signature": `sha256=${signWebhookPayload(subscription.secret, rawPayload)}`
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
