import { Router } from "express";
import { IntegrationProvider, Prisma } from "@prisma/client";
import { prisma } from "@gestao/database";
import { authMiddleware } from "../middleware/auth";
import { organizationMiddleware } from "../middleware/organization";
import type { RequestWithUser } from "../types/http";
import { logger } from "../config/logger";
import { verifyGithubSignature } from "../services/integrations";
import {
  createWebhookSecret,
  findActiveApiTokensByOrganization,
  issueApiToken,
  revokeApiToken,
  summarizeApiToken
} from "../services/integrationTokens";
import { listImportJobsByOrganization, summarizeImportJob } from "../services/importJobs";
import {
  WEBHOOK_EVENT_CATALOG,
  createWebhookSubscription,
  deleteWebhookSubscription,
  dispatchIntegrationEvent,
  listWebhookDeliveries,
  listWebhookSubscriptions,
  sanitizeWebhookTargetUrl,
  summarizeWebhookSubscription,
  updateWebhookSubscription
} from "../services/webhookDispatcher";
import {
  buildGoogleCalendarFeed,
  generateIntegrationAccessToken,
  getIntegrationConnection,
  getIntegrationConnectionByAccessToken,
  sanitizeSlackWebhookUrl,
  sendSlackConnectionMessage,
  SLACK_SUPPORTED_EVENTS,
  summarizeIntegrationConnection,
  upsertGoogleCalendarConnection,
  upsertSlackConnection
} from "../services/integrationConnections";
import { writeAuditLog } from "../services/audit";
import { canManageOrganizationSettings } from "../services/permissions";
import { normalizeUuid } from "../utils/uuid";

export const integrationsRouter = Router();

const ensureOrgAdmin = (req: RequestWithUser, res: any) => {
  const role = req.organizationRole;
  if (!role || !canManageOrganizationSettings(role)) {
    res.status(403).json({ message: "Você não tem permissão para gerenciar integrações desta organização." });
    return false;
  }
  if (!req.organizationId || !req.user) {
    res.status(401).json({ message: "Authentication required" });
    return false;
  }
  return true;
};

const normalizeEvents = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

integrationsRouter.post("/github/webhook", async (req, res) => {
  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  const rawBody = (req as any).rawBody ?? JSON.stringify(req.body ?? {});

  if (!verifyGithubSignature(rawBody, signature)) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  logger.info({ event: req.headers["x-github-event"], body: req.body }, "GitHub webhook received");
  return res.json({ ok: true });
});

integrationsRouter.post("/webhooks/:event", (req, res) => {
  const { event } = req.params;
  logger.info({ event, payload: req.body }, "Inbound webhook");
  res.status(202).json({ status: "queued" });
});

integrationsRouter.get("/google-calendar/feed/:accessToken", async (req, res) => {
  const accessToken = typeof req.params.accessToken === "string" ? req.params.accessToken.trim() : "";
  if (!accessToken) {
    return res.status(400).send("Feed token is required.");
  }

  const connection = await getIntegrationConnectionByAccessToken(IntegrationProvider.GOOGLE_CALENDAR, accessToken);
  if (!connection) {
    return res.status(404).send("Feed not found.");
  }

  const ics = await buildGoogleCalendarFeed(connection);
  if (!ics) {
    return res.status(404).send("Feed not available.");
  }

  return res.setHeader("Content-Type", "text/calendar; charset=utf-8").send(ics);
});

integrationsRouter.use(authMiddleware, organizationMiddleware);

integrationsRouter.get("/catalog/events", (_req, res) => {
  return res.json({
    events: WEBHOOK_EVENT_CATALOG.map((eventName) => ({
      eventName,
      description: eventName
    }))
  });
});

integrationsRouter.get("/slack", async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;

  const connection = await getIntegrationConnection(req.organizationId!, IntegrationProvider.SLACK);
  if (!connection) {
    return res.json({ slack: null });
  }

  const config = connection.config && typeof connection.config === "object" ? (connection.config as Record<string, unknown>) : {};
  const webhookUrl = typeof config.webhookUrl === "string" ? config.webhookUrl : "";

  return res.json({
    slack: {
      ...summarizeIntegrationConnection(connection),
      webhookConfigured: Boolean(webhookUrl),
      webhookPreview: webhookUrl ? `${webhookUrl.slice(0, 36)}...` : null
    }
  });
});

integrationsRouter.get("/google-calendar", async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;

  const connection = await getIntegrationConnection(req.organizationId!, IntegrationProvider.GOOGLE_CALENDAR);
  if (!connection) {
    return res.json({ calendar: null });
  }

  const config = connection.config && typeof connection.config === "object" ? (connection.config as Record<string, unknown>) : {};

  return res.json({
    calendar: {
      ...summarizeIntegrationConnection(connection),
      projectId: typeof config.projectId === "string" ? config.projectId : null,
      includeTasks: config.includeTasks !== false,
      includeMilestones: config.includeMilestones !== false,
      feedPath: connection.accessToken ? `/integrations/google-calendar/feed/${connection.accessToken}` : null
    }
  });
});

integrationsRouter.put("/slack", async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;

  const name = typeof req.body?.name === "string" && req.body.name.trim() ? req.body.name.trim() : "Slack";
  const eventNames = normalizeEvents(req.body?.eventNames);
  const isActive = typeof req.body?.isActive === "boolean" ? req.body.isActive : true;
  const webhookUrlRaw = typeof req.body?.webhookUrl === "string" ? req.body.webhookUrl.trim() : "";
  const existing = await getIntegrationConnection(req.organizationId!, IntegrationProvider.SLACK);
  const existingConfig =
    existing?.config && typeof existing.config === "object" ? (existing.config as Record<string, unknown>) : null;
  const fallbackWebhook = typeof existingConfig?.webhookUrl === "string" ? existingConfig.webhookUrl : "";
  const normalizedWebhookUrl = sanitizeSlackWebhookUrl(webhookUrlRaw || fallbackWebhook);

  if (!normalizedWebhookUrl) {
    return res.status(400).json({ message: "Webhook do Slack inválido." });
  }

  if (!eventNames.length) {
    return res.status(400).json({ message: "Selecione ao menos um evento para o Slack." });
  }

  const connection = await upsertSlackConnection({
    organizationId: req.organizationId!,
    createdById: req.user!.id,
    name,
    webhookUrl: normalizedWebhookUrl,
    eventNames,
    isActive
  });

  await writeAuditLog({
    organizationId: req.organizationId!,
    actorId: req.user!.id,
    action: existing ? "INTEGRATION_SLACK_UPDATED" : "INTEGRATION_SLACK_CREATED",
    entity: "INTEGRATION_CONNECTION",
    entityId: connection.id,
    diff: {
      after: {
        id: connection.id,
        provider: connection.provider,
        isActive: connection.isActive,
        eventNames: connection.eventNames
      }
    }
  });

  return res.json({
    slack: {
      ...summarizeIntegrationConnection(connection),
      webhookConfigured: true,
      webhookPreview: `${normalizedWebhookUrl.slice(0, 36)}...`
    }
  });
});

integrationsRouter.put("/google-calendar", async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;

  const projectId = normalizeUuid(req.body?.projectId);
  const name = typeof req.body?.name === "string" && req.body.name.trim() ? req.body.name.trim() : "Google Calendar";
  const includeTasks = req.body?.includeTasks !== false;
  const includeMilestones = req.body?.includeMilestones !== false;
  const isActive = typeof req.body?.isActive === "boolean" ? req.body.isActive : true;
  const regenerateToken = req.body?.regenerateToken === true;

  if (!projectId) {
    return res.status(400).json({ message: "projectId invalido." });
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId: req.organizationId!
    },
    select: {
      id: true,
      name: true
    }
  });

  if (!project) {
    return res.status(404).json({ message: "Projeto nao encontrado para esta organizacao." });
  }

  const connection = await upsertGoogleCalendarConnection({
    organizationId: req.organizationId!,
    createdById: req.user!.id,
    name,
    projectId,
    includeTasks,
    includeMilestones,
    isActive,
    accessToken: regenerateToken ? generateIntegrationAccessToken() : undefined
  });

  await writeAuditLog({
    organizationId: req.organizationId!,
    actorId: req.user!.id,
    action: "INTEGRATION_GOOGLE_CALENDAR_UPDATED",
    entity: "INTEGRATION_CONNECTION",
    entityId: connection.id,
    diff: {
      after: {
        provider: connection.provider,
        projectId,
        includeTasks,
        includeMilestones,
        isActive
      }
    }
  });

  return res.json({
    calendar: {
      ...summarizeIntegrationConnection(connection),
      projectId,
      includeTasks,
      includeMilestones,
      feedPath: connection.accessToken ? `/integrations/google-calendar/feed/${connection.accessToken}` : null
    }
  });
});

integrationsRouter.post("/slack/test", async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;

  try {
    const connection = await getIntegrationConnection(req.organizationId!, IntegrationProvider.SLACK);
    if (!connection) {
      return res.status(404).json({ message: "Integração Slack não configurada." });
    }

    await sendSlackConnectionMessage({
      connection,
      text: `:white_check_mark: Slack integration test OK for organization ${req.organization?.name ?? req.organizationId}.`
    });

    await writeAuditLog({
      organizationId: req.organizationId!,
      actorId: req.user!.id,
      action: "INTEGRATION_SLACK_TESTED",
      entity: "INTEGRATION_CONNECTION",
      entityId: connection.id
    });

    return res.json({ message: "Mensagem de teste enviada ao Slack." });
  } catch (error) {
    logger.error({ err: error, organizationId: req.organizationId }, "Failed to send Slack test");
    return res.status(500).json({ message: "Falha ao enviar teste para o Slack." });
  }
});

integrationsRouter.get("/tokens", async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;

  const tokens = await findActiveApiTokensByOrganization(req.organizationId!);
  return res.json({ tokens: tokens.map(summarizeApiToken) });
});

integrationsRouter.get("/import-jobs", async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;

  const rawLimit = Number(req.query.limit ?? "15");
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 15;
  const jobs = await listImportJobsByOrganization({
    organizationId: req.organizationId!,
    limit
  });

  return res.json({
    jobs: jobs.map(summarizeImportJob)
  });
});

integrationsRouter.post("/tokens", async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;

  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const events = normalizeEvents(req.body?.scopes);
  const expiresAtRaw = typeof req.body?.expiresAt === "string" ? req.body.expiresAt.trim() : "";

  if (!name) {
    return res.status(400).json({ message: "Nome do token é obrigatório." });
  }

  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;
  if (expiresAtRaw && Number.isNaN(expiresAt?.getTime())) {
    return res.status(400).json({ message: "expiresAt inválido." });
  }

  const { token, plainToken } = await issueApiToken({
    organizationId: req.organizationId!,
    createdById: req.user!.id,
    name,
    scopes: events.length ? (events as Prisma.InputJsonValue) : undefined,
    expiresAt
  });

  await writeAuditLog({
    organizationId: req.organizationId!,
    actorId: req.user!.id,
    action: "INTEGRATION_API_TOKEN_CREATED",
    entity: "API_TOKEN",
    entityId: token.id,
    diff: {
      after: {
        id: token.id,
        name: token.name,
        tokenPrefix: token.tokenPrefix,
        tokenLastFour: token.tokenLastFour,
        scopes: token.scopes,
        expiresAt: token.expiresAt?.toISOString() ?? null
      }
    }
  });

  return res.status(201).json({
    token: {
      ...summarizeApiToken(token),
      plainText: plainToken
    }
  });
});

integrationsRouter.delete("/tokens/:tokenId", async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;

  const { count } = await revokeApiToken({
    tokenId: req.params.tokenId,
    organizationId: req.organizationId!
  });

  if (!count) {
    return res.status(404).json({ message: "Token não encontrado." });
  }

  await writeAuditLog({
    organizationId: req.organizationId!,
    actorId: req.user!.id,
    action: "INTEGRATION_API_TOKEN_REVOKED",
    entity: "API_TOKEN",
    entityId: req.params.tokenId
  });

  return res.json({ success: true });
});

integrationsRouter.get("/webhooks", async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;

  const subscriptions = await listWebhookSubscriptions(req.organizationId!);
  return res.json({ webhooks: subscriptions.map(summarizeWebhookSubscription) });
});

integrationsRouter.post("/webhooks", async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;

  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const targetUrl = typeof req.body?.targetUrl === "string" ? req.body.targetUrl.trim() : "";
  const providerRaw = typeof req.body?.provider === "string" ? req.body.provider.trim().toUpperCase() : "CUSTOM";
  const eventNames = normalizeEvents(req.body?.eventNames);
  const secretRaw = typeof req.body?.secret === "string" ? req.body.secret.trim() : "";

  if (!name) {
    return res.status(400).json({ message: "Nome do webhook é obrigatório." });
  }
  const normalizedUrl = sanitizeWebhookTargetUrl(targetUrl);
  if (!normalizedUrl) {
    return res.status(400).json({ message: "targetUrl inválida." });
  }
  if (!eventNames.length) {
    return res.status(400).json({ message: "Selecione ao menos um evento." });
  }
  if (!(providerRaw in IntegrationProvider)) {
    return res.status(400).json({ message: "provider inválido." });
  }

  const secret = secretRaw || createWebhookSecret();
  const subscription = await createWebhookSubscription({
    organizationId: req.organizationId!,
    createdById: req.user!.id,
    provider: providerRaw as IntegrationProvider,
    name,
    targetUrl: normalizedUrl,
    secret,
    eventNames
  });

  await writeAuditLog({
    organizationId: req.organizationId!,
    actorId: req.user!.id,
    action: "INTEGRATION_WEBHOOK_CREATED",
    entity: "WEBHOOK_SUBSCRIPTION",
    entityId: subscription.id,
    diff: {
      after: {
        id: subscription.id,
        name: subscription.name,
        provider: subscription.provider,
        targetUrl: subscription.targetUrl,
        eventNames: subscription.eventNames,
        isActive: subscription.isActive
      }
    }
  });

  return res.status(201).json({
    webhook: {
      ...summarizeWebhookSubscription(subscription),
      secretPreview: secret.slice(-6)
    }
  });
});

integrationsRouter.patch("/webhooks/:webhookId", async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;

  const data: Prisma.WebhookSubscriptionUpdateInput = {};
  const auditPatch: Record<string, unknown> = {};

  if (typeof req.body?.name === "string" && req.body.name.trim()) {
    data.name = req.body.name.trim();
    auditPatch.name = req.body.name.trim();
  }

  if (typeof req.body?.targetUrl === "string") {
    const normalizedUrl = sanitizeWebhookTargetUrl(req.body.targetUrl.trim());
    if (!normalizedUrl) {
      return res.status(400).json({ message: "targetUrl inválida." });
    }
    data.targetUrl = normalizedUrl;
    auditPatch.targetUrl = normalizedUrl;
  }

  if (typeof req.body?.isActive === "boolean") {
    data.isActive = req.body.isActive;
    auditPatch.isActive = req.body.isActive;
  }

  if (Array.isArray(req.body?.eventNames)) {
    const eventNames = normalizeEvents(req.body.eventNames);
    if (!eventNames.length) {
      return res.status(400).json({ message: "Selecione ao menos um evento." });
    }
    data.eventNames = eventNames;
    auditPatch.eventNames = eventNames;
  }

  if (typeof req.body?.secret === "string" && req.body.secret.trim()) {
    data.secret = req.body.secret.trim();
    auditPatch.secretRotated = true;
  }

  const updated = await updateWebhookSubscription({
    organizationId: req.organizationId!,
    subscriptionId: req.params.webhookId,
    data
  });

  if (!updated) {
    return res.status(404).json({ message: "Webhook não encontrado." });
  }

  await writeAuditLog({
    organizationId: req.organizationId!,
    actorId: req.user!.id,
    action: "INTEGRATION_WEBHOOK_UPDATED",
    entity: "WEBHOOK_SUBSCRIPTION",
    entityId: req.params.webhookId,
    diff: {
      patch: auditPatch as Prisma.InputJsonValue
    }
  });

  return res.json({ webhook: summarizeWebhookSubscription(updated) });
});

integrationsRouter.delete("/webhooks/:webhookId", async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;

  const result = await deleteWebhookSubscription({
    organizationId: req.organizationId!,
    subscriptionId: req.params.webhookId
  });

  if (!result.count) {
    return res.status(404).json({ message: "Webhook não encontrado." });
  }

  await writeAuditLog({
    organizationId: req.organizationId!,
    actorId: req.user!.id,
    action: "INTEGRATION_WEBHOOK_DELETED",
    entity: "WEBHOOK_SUBSCRIPTION",
    entityId: req.params.webhookId
  });

  return res.json({ success: true });
});

integrationsRouter.get("/webhooks/:webhookId/deliveries", async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;

  const rawLimit = Number(req.query.limit ?? "20");
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;
  const deliveries = await listWebhookDeliveries(req.organizationId!, req.params.webhookId, limit);
  return res.json({ deliveries });
});

integrationsRouter.post("/webhooks/:webhookId/test", async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;

  const subscriptions = await listWebhookSubscriptions(req.organizationId!);
  const target = subscriptions.find((subscription) => subscription.id === req.params.webhookId);
  if (!target) {
    return res.status(404).json({ message: "Webhook não encontrado." });
  }

  await dispatchIntegrationEvent({
    organizationId: req.organizationId!,
    organizationName: req.organization?.name ?? null,
    actorId: req.user!.id,
    entity: "WEBHOOK_SUBSCRIPTION",
    entityId: target.id,
    eventName: "integration.test",
    payload: {
      webhookId: target.id,
      webhookName: target.name,
      organizationName: req.organization?.name ?? null
    }
  });

  await writeAuditLog({
    organizationId: req.organizationId!,
    actorId: req.user!.id,
    action: "INTEGRATION_WEBHOOK_TESTED",
    entity: "WEBHOOK_SUBSCRIPTION",
    entityId: target.id
  });

  return res.status(202).json({ queued: true });
});
