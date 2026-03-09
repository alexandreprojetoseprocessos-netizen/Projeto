import crypto from "node:crypto";
import axios from "axios";
import { prisma } from "@gestao/database";
import { IntegrationProvider, type IntegrationConnection, type Prisma } from "@prisma/client";
import { logger } from "../config/logger";

type ServiceClient = Prisma.TransactionClient | typeof prisma;

const DELIVERY_TIMEOUT_MS = 10_000;
export const WEBHOOK_CRITICAL_ALERT_EVENT = "integration.webhook.critical";

export const SLACK_SUPPORTED_EVENTS = [
  "organization.created",
  "organization.updated",
  "organization.deactivated",
  "organization.trashed",
  "organization.restored",
  "organization.deleted",
  "integration.test",
  WEBHOOK_CRITICAL_ALERT_EVENT
] as const;

type SlackConfig = {
  webhookUrl: string;
};

type EmailAlertsConfig = {
  kind: "EMAIL_ALERTS";
  recipients: string[];
};

type GoogleCalendarConfig = {
  projectId: string;
  includeTasks: boolean;
  includeMilestones: boolean;
};

const EMAIL_ALERTS_KIND = "EMAIL_ALERTS";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const truncateText = (value: string | null | undefined, max = 300) => {
  if (!value) return null;
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

const normalizeEmailList = (items: string[]) =>
  [...new Set(items.map((item) => item.trim().toLowerCase()).filter((item) => EMAIL_REGEX.test(item)))];

export const generateIntegrationAccessToken = () => crypto.randomBytes(24).toString("hex");

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

const readGoogleCalendarConfig = (config: unknown): GoogleCalendarConfig | null => {
  const record = asRecord(config);
  const projectId = typeof record?.projectId === "string" ? record.projectId : null;
  if (!projectId) return null;
  return {
    projectId,
    includeTasks: record?.includeTasks !== false,
    includeMilestones: record?.includeMilestones !== false
  };
};

const readEmailAlertsConfig = (config: unknown): EmailAlertsConfig | null => {
  const record = asRecord(config);
  if (!record) return null;
  if (record.kind !== EMAIL_ALERTS_KIND) return null;
  const recipients = Array.isArray(record.recipients)
    ? normalizeEmailList(record.recipients.filter((item): item is string => typeof item === "string"))
    : [];
  return {
    kind: EMAIL_ALERTS_KIND,
    recipients
  };
};

export const summarizeIntegrationConnection = (connection: IntegrationConnection) => ({
  id: connection.id,
  provider: connection.provider,
  name: connection.name,
  accessToken: connection.accessToken,
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

export const getIntegrationConnectionByAccessToken = async (provider: IntegrationProvider, accessToken: string) =>
  prisma.integrationConnection.findFirst({
    where: {
      provider,
      accessToken,
      isActive: true
    }
  });

export const getEmailAlertsConnection = async (organizationId: string) => {
  const connection = await getIntegrationConnection(organizationId, IntegrationProvider.CUSTOM);
  if (!connection) return null;
  const emailConfig = readEmailAlertsConfig(connection.config);
  if (!emailConfig) return null;
  return {
    ...connection,
    emailConfig
  };
};

export const upsertEmailAlertsConnection = async ({
  client = prisma,
  organizationId,
  createdById,
  name,
  recipients,
  isActive
}: {
  client?: ServiceClient;
  organizationId: string;
  createdById: string;
  name: string;
  recipients: string[];
  isActive: boolean;
}) => {
  const normalizedRecipients = normalizeEmailList(recipients);
  const existing = await client.integrationConnection.findUnique({
    where: {
      organizationId_provider: {
        organizationId,
        provider: IntegrationProvider.CUSTOM
      }
    }
  });

  if (existing) {
    const existingEmailConfig = readEmailAlertsConfig(existing.config);
    if (!existingEmailConfig) {
      throw new Error("CUSTOM_PROVIDER_ALREADY_IN_USE");
    }
  }

  return client.integrationConnection.upsert({
    where: {
      organizationId_provider: {
        organizationId,
        provider: IntegrationProvider.CUSTOM
      }
    },
    update: {
      name,
      isActive,
      eventNames: [WEBHOOK_CRITICAL_ALERT_EVENT],
      config: {
        kind: EMAIL_ALERTS_KIND,
        recipients: normalizedRecipients
      }
    },
    create: {
      organizationId,
      createdById,
      provider: IntegrationProvider.CUSTOM,
      name,
      isActive,
      eventNames: [WEBHOOK_CRITICAL_ALERT_EVENT],
      config: {
        kind: EMAIL_ALERTS_KIND,
        recipients: normalizedRecipients
      }
    }
  });
};

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

export const upsertGoogleCalendarConnection = async ({
  client = prisma,
  organizationId,
  createdById,
  name,
  projectId,
  includeTasks,
  includeMilestones,
  isActive,
  accessToken
}: {
  client?: ServiceClient;
  organizationId: string;
  createdById: string;
  name: string;
  projectId: string;
  includeTasks: boolean;
  includeMilestones: boolean;
  isActive: boolean;
  accessToken?: string;
}) => {
  const existing = await client.integrationConnection.findUnique({
    where: {
      organizationId_provider: {
        organizationId,
        provider: IntegrationProvider.GOOGLE_CALENDAR
      }
    }
  });

  const resolvedAccessToken = accessToken ?? existing?.accessToken ?? generateIntegrationAccessToken();

  return client.integrationConnection.upsert({
    where: {
      organizationId_provider: {
        organizationId,
        provider: IntegrationProvider.GOOGLE_CALENDAR
      }
    },
    update: {
      name,
      isActive,
      accessToken: resolvedAccessToken,
      config: {
        projectId,
        includeTasks,
        includeMilestones
      }
    },
    create: {
      organizationId,
      createdById,
      provider: IntegrationProvider.GOOGLE_CALENDAR,
      name,
      isActive,
      accessToken: resolvedAccessToken,
      eventNames: [],
      config: {
        projectId,
        includeTasks,
        includeMilestones
      }
    }
  });
};

export const sendSlackConnectionMessage = async ({
  connection,
  text
}: {
  connection: IntegrationConnection;
  text: string;
}) => {
  const config = readSlackConfig(connection.config);
  if (!config?.webhookUrl) {
    throw new Error("Webhook do Slack nao configurado.");
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
        ? "Entrega concluida."
        : typeof response.data === "string"
        ? truncateText(response.data)
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
    .map(([key, value]) => `- ${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
    .join("\n");

  return [
    `:satellite: *Meu G&P*`,
    `Organizacao: *${organizationName ?? "Organizacao"}*`,
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

const formatIcsDateTime = (value: Date) => {
  const year = value.getUTCFullYear();
  const month = `${value.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${value.getUTCDate()}`.padStart(2, "0");
  const hours = `${value.getUTCHours()}`.padStart(2, "0");
  const minutes = `${value.getUTCMinutes()}`.padStart(2, "0");
  const seconds = `${value.getUTCSeconds()}`.padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

const formatIcsDateOnly = (value: Date) => {
  const year = value.getUTCFullYear();
  const month = `${value.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${value.getUTCDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
};

const escapeIcs = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

const addOneDay = (value: Date) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate() + 1));

export const buildGoogleCalendarFeed = async (connection: IntegrationConnection) => {
  const config = readGoogleCalendarConfig(connection.config);
  if (!config?.projectId) {
    return null;
  }

  const project = await prisma.project.findFirst({
    where: {
      id: config.projectId,
      organizationId: connection.organizationId
    },
    select: {
      id: true,
      name: true,
      milestones: {
        select: {
          id: true,
          name: true,
          dueDate: true,
          status: true
        },
        orderBy: { dueDate: "asc" }
      },
      wbsNodes: {
        where: {
          deletedAt: null,
          type: { in: ["TASK", "SUBTASK"] }
        },
        select: {
          id: true,
          title: true,
          status: true,
          startDate: true,
          endDate: true
        },
        orderBy: { startDate: "asc" }
      }
    }
  });

  if (!project) {
    return null;
  }

  const now = new Date();
  const events: string[] = [];

  if (config.includeMilestones) {
    for (const milestone of project.milestones) {
      const dueDate = milestone.dueDate instanceof Date ? milestone.dueDate : new Date(milestone.dueDate);
      events.push([
        "BEGIN:VEVENT",
        `UID:milestone-${milestone.id}@meugp`,
        `DTSTAMP:${formatIcsDateTime(now)}`,
        `DTSTART;VALUE=DATE:${formatIcsDateOnly(dueDate)}`,
        `DTEND;VALUE=DATE:${formatIcsDateOnly(addOneDay(dueDate))}`,
        `SUMMARY:${escapeIcs(`[Marco] ${milestone.name}`)}`,
        `DESCRIPTION:${escapeIcs(`Status: ${milestone.status ?? "PLANNED"} | Projeto: ${project.name}`)}`,
        "END:VEVENT"
      ].join("\r\n"));
    }
  }

  if (config.includeTasks) {
    for (const task of project.wbsNodes) {
      if (!task.startDate && !task.endDate) continue;
      const startDate = task.startDate ? new Date(task.startDate) : new Date(task.endDate as Date);
      const endDate = task.endDate ? addOneDay(new Date(task.endDate)) : addOneDay(startDate);
      events.push([
        "BEGIN:VEVENT",
        `UID:task-${task.id}@meugp`,
        `DTSTAMP:${formatIcsDateTime(now)}`,
        `DTSTART;VALUE=DATE:${formatIcsDateOnly(startDate)}`,
        `DTEND;VALUE=DATE:${formatIcsDateOnly(endDate)}`,
        `SUMMARY:${escapeIcs(task.title)}`,
        `DESCRIPTION:${escapeIcs(`Status: ${task.status} | Projeto: ${project.name}`)}`,
        "END:VEVENT"
      ].join("\r\n"));
    }
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Meu GP//Google Calendar Feed//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(`Meu G&P - ${project.name}`)}`,
    ...events,
    "END:VCALENDAR"
  ].join("\r\n");
};
