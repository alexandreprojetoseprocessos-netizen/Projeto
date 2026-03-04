import axios from "axios";
import { prisma } from "@gestao/database";
import { IntegrationProvider, type IntegrationConnection, type Prisma } from "@prisma/client";
import { logger } from "../config/logger";

type ServiceClient = Prisma.TransactionClient | typeof prisma;

const DELIVERY_TIMEOUT_MS = 10_000;

export const SLACK_SUPPORTED_EVENTS = [
  "organization.created",
  "organization.updated",
  "organization.deactivated",
  "organization.trashed",
  "organization.restored",
  "organization.deleted",
  "integration.test"
] as const;

type SlackConfig = {
  webhookUrl: string;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

export const sanitizeSlackWebhookUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return null;
    if (parsed.hostname !== "hooks.slack.com") return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

const readSlackConfig = (config: unknown): SlackConfig | null => {
  const record = asRecord(config);
  const webhookUrl = typeof record?.webhookUrl === "string" ? sanitizeSlackWebhookUrl(record.webhookUrl) : null;
  if (!webhookUrl) return null;
  return { webhookUrl };
};

export const summarizeIntegrationConnection = (connection: IntegrationConnection) => ({
  id: connection.id,
  provider: connection.provider,
  name: connection.name,
  isActive: connection.isActive,
  eventNames: connection.eventNames,
  createdAt: connection.createdAt,
  updatedAt: connection.updatedAt,
  lastTriggeredAt: connection.lastTriggeredAt,
  lastValidatedAt: connection.lastValidatedAt,
  lastValidationStatus: connection.lastValidationStatus,
  lastValidationMessage: connection.lastValidationMessage
});

export const getIntegrationConnection = async (organizationId: string, provider: IntegrationProvider) =>
  prisma.integrationConnection.findUnique({
    where: {
      organizationId_provider: {
        organizationId,
        provider
      }
    }
  });

export const upsertSlackConnection = async ({
  client = prisma,
  organizationId,
  createdById,
  name,
  webhookUrl,
  eventNames,
  isActive
}: {
  client?: ServiceClient;
  organizationId: string;
  createdById: string;
  name: string;
  webhookUrl: string;
  eventNames: string[];
  isActive: boolean;
}) =>
  client.integrationConnection.upsert({
    where: {
      organizationId_provider: {
        organizationId,
        provider: IntegrationProvider.SLACK
      }
    },
    update: {
      name,
      isActive,
      eventNames,
      config: {
        webhookUrl
      }
    },
    create: {
      organizationId,
      createdById,
      provider: IntegrationProvider.SLACK,
      name,
      isActive,
      eventNames,
      config: {
        webhookUrl
      }
    }
  });

export const sendSlackConnectionMessage = async ({
  connection,
  text
}: {
  connection: IntegrationConnection;
  text: string;
}) => {
  const config = readSlackConfig(connection.config);
  if (!config?.webhookUrl) {
    throw new Error("Webhook do Slack não configurado.");
  }

  const response = await axios.post(
    config.webhookUrl,
    { text },
    {
      timeout: DELIVERY_TIMEOUT_MS,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "meu-gp-slack/1.0"
      },
      validateStatus: () => true
    }
  );

  const ok = response.status >= 200 && response.status < 300;
  await prisma.integrationConnection.update({
    where: { id: connection.id },
    data: {
      lastValidatedAt: new Date(),
      lastValidationStatus: ok ? "SUCCESS" : "FAILED",
      lastValidationMessage: ok
        ? "Entrega concluída."
        : typeof response.data === "string"
        ? response.data.slice(0, 300)
        : `Slack respondeu HTTP ${response.status}`
    }
  });

  if (!ok) {
    throw new Error(typeof response.data === "string" ? response.data : `Slack respondeu HTTP ${response.status}`);
  }
};

const supportsEvent = (connection: IntegrationConnection, eventName: string) =>
  connection.eventNames.includes("*") || connection.eventNames.includes(eventName);

const formatSlackMessage = ({
  organizationName,
  eventName,
  entity,
  entityId,
  payload
}: {
  organizationName?: string | null;
  eventName: string;
  entity?: string | null;
  entityId?: string | null;
  payload: Record<string, unknown>;
}) => {
  const details = Object.entries(payload)
    .slice(0, 4)
    .map(([key, value]) => `• ${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
    .join("\n");

  return [
    `:satellite: *Meu G&P*`,
    `Organização: *${organizationName ?? "Organização"}*`,
    `Evento: \`${eventName}\``,
    entity ? `Entidade: \`${entity}\`` : null,
    entityId ? `Registro: \`${entityId}\`` : null,
    details ? `\n${details}` : null
  ]
    .filter(Boolean)
    .join("\n");
};

export const dispatchSlackIntegrationEvent = async ({
  organizationId,
  organizationName,
  eventName,
  entity,
  entityId,
  payload
}: {
  organizationId: string;
  organizationName?: string | null;
  eventName: string;
  entity?: string | null;
  entityId?: string | null;
  payload: Record<string, unknown>;
}) => {
  const connection = await getIntegrationConnection(organizationId, IntegrationProvider.SLACK);
  if (!connection || !connection.isActive || !supportsEvent(connection, eventName)) {
    return { dispatched: 0 };
  }

  try {
    await sendSlackConnectionMessage({
      connection,
      text: formatSlackMessage({ organizationName, eventName, entity, entityId, payload })
    });

    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        lastTriggeredAt: new Date()
      }
    });

    return { dispatched: 1 };
  } catch (error) {
    logger.warn(
      {
        err: error,
        organizationId,
        provider: "SLACK",
        eventName
      },
      "Failed to deliver native Slack integration"
    );
    return { dispatched: 0 };
  }
};
