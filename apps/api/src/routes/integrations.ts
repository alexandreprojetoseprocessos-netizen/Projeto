import { Router } from "express";
import { IntegrationProvider, Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import multer from "multer";
import * as XLSX from "xlsx";
import { prisma } from "@gestao/database";
import { authMiddleware } from "../middleware/auth";
import { ensureModulePermission } from "../middleware/modulePermission";
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
import { completeImportJob, createImportJob, failImportJob, listImportJobsByOrganization, summarizeImportJob } from "../services/importJobs";
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
import { ensureProjectMembership } from "../services/rbac";
import { normalizeUuid } from "../utils/uuid";

export const integrationsRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

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

const DEFAULT_BOARD_COLUMNS: Array<{ label: string; status: TaskStatus; wipLimit?: number | null }> = [
  { label: "Backlog", status: TaskStatus.BACKLOG },
  { label: "Planejamento", status: TaskStatus.TODO },
  { label: "Em andamento", status: TaskStatus.IN_PROGRESS, wipLimit: 6 },
  { label: "Revisao", status: TaskStatus.REVIEW, wipLimit: 4 },
  { label: "Concluido", status: TaskStatus.DONE }
];

const ensureBoardColumns = async (projectId: string) => {
  const count = await prisma.boardColumn.count({ where: { projectId } });
  if (count > 0) return;
  await prisma.boardColumn.createMany({
    data: DEFAULT_BOARD_COLUMNS.map((column, index) => ({
      projectId,
      label: column.label,
      order: index,
      status: column.status,
      wipLimit: column.wipLimit ?? null
    }))
  });
};

const normalizeBoardStatusKey = (value?: string | null) =>
  (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s]+/g, " ");

const resolveBoardStatus = (value?: string | null): TaskStatus => {
  const key = normalizeBoardStatusKey(value);
  if (!key) return TaskStatus.BACKLOG;
  if (["done", "finalizado", "finalizada", "concluido", "concluida", "completed", "finished"].includes(key)) {
    return TaskStatus.DONE;
  }
  if (["in progress", "em andamento", "andamento", "doing", "progresso", "em progresso"].includes(key)) {
    return TaskStatus.IN_PROGRESS;
  }
  if (["review", "revisao", "homologacao", "qa", "teste", "testes"].includes(key)) {
    return TaskStatus.REVIEW;
  }
  if (["delayed", "em atraso", "atrasado", "atrasada", "late", "overdue"].includes(key)) {
    return TaskStatus.DELAYED;
  }
  if (["risk", "em risco", "risco"].includes(key)) {
    return TaskStatus.RISK;
  }
  if (["blocked", "bloqueado", "bloqueada", "impedido", "impedida"].includes(key)) {
    return TaskStatus.BLOCKED;
  }
  if (["todo", "a fazer", "planejado", "planejamento"].includes(key)) {
    return TaskStatus.TODO;
  }
  return TaskStatus.BACKLOG;
};

const resolveTrelloPriority = (card: Record<string, unknown>): TaskPriority => {
  const labels = Array.isArray(card.labels) ? card.labels : [];
  const tokens = labels
    .flatMap((label) => {
      if (!label || typeof label !== "object") return [];
      const record = label as Record<string, unknown>;
      return [record.name, record.color]
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => normalizeBoardStatusKey(value));
    })
    .filter(Boolean);

  if (tokens.some((token) => ["urgente", "critical", "critico", "critica", "red"].includes(token))) {
    return TaskPriority.CRITICAL;
  }
  if (tokens.some((token) => ["alta", "high", "orange"].includes(token))) {
    return TaskPriority.HIGH;
  }
  if (tokens.some((token) => ["baixa", "low", "green", "blue"].includes(token))) {
    return TaskPriority.LOW;
  }
  return TaskPriority.MEDIUM;
};

const buildTrelloDescription = (card: Record<string, unknown>, listName: string) => {
  const parts: string[] = [];
  const description = typeof card.desc === "string" ? card.desc.trim() : "";
  const shortUrl = typeof card.shortUrl === "string" ? card.shortUrl.trim() : "";
  if (description) parts.push(description);
  parts.push(`Importado do Trello · Lista original: ${listName}`);
  if (shortUrl) parts.push(`Origem: ${shortUrl}`);
  return parts.join("\n\n");
};

const normalizeImportKey = (value?: string | null) =>
  (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

const parseSpreadsheetDateValue = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    }
  }
  const text = String(value).trim();
  if (!text) return null;
  const brMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s|T|$)/);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]);
    let year = Number(brMatch[3]);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, month - 1, day));
  }
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s|T|$)/);
  if (isoMatch) {
    return new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])));
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const resolveJiraPriority = (value?: string | null): TaskPriority => {
  const key = normalizeBoardStatusKey(value);
  if (["highest", "urgent", "urgente", "critical", "critico", "critica", "blocker"].includes(key)) {
    return TaskPriority.CRITICAL;
  }
  if (["high", "alta", "major"].includes(key)) {
    return TaskPriority.HIGH;
  }
  if (["low", "baixa", "lowest", "minor"].includes(key)) {
    return TaskPriority.LOW;
  }
  return TaskPriority.MEDIUM;
};

const buildJiraDescription = (row: Record<string, unknown>) => {
  const parts: string[] = [];
  const description = typeof row.description === "string" ? row.description.trim() : "";
  const issueKey = typeof row.issuekey === "string" ? row.issuekey.trim() : "";
  const issueType = typeof row.issuetype === "string" ? row.issuetype.trim() : "";
  if (description) parts.push(description);
  parts.push("Importado do Jira");
  if (issueKey) parts.push(`Issue: ${issueKey}`);
  if (issueType) parts.push(`Tipo: ${issueType}`);
  return parts.join("\n\n");
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

integrationsRouter.post("/imports/trello", upload.single("file"), async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;
  if (!ensureModulePermission(req, res, "kanban", "create", "Voce nao tem permissao para importar cards para o Kanban.")) {
    return;
  }

  const projectId = normalizeUuid((req.query.projectId as string) ?? (req.body?.projectId as string) ?? "");
  const file = req.file;

  if (!projectId) {
    return res.status(400).json({ message: "projectId is required" });
  }
  if (!file) {
    return res.status(400).json({ message: "file is required" });
  }

  const membership = await ensureProjectMembership(req, res, projectId);
  if (!membership) return;

  const importJob = await createImportJob({
    organizationId: req.organizationId!,
    createdById: req.user!.id,
    source: "TRELLO_JSON",
    entity: "TRELLO_BOARD",
    fileName: file.originalname ?? null,
    summary: { projectId }
  });

  try {
    const parsed = JSON.parse(file.buffer.toString("utf-8")) as Record<string, unknown>;
    const lists = Array.isArray(parsed.lists) ? parsed.lists : [];
    const cards = Array.isArray(parsed.cards) ? parsed.cards : [];

    if (!lists.length || !cards.length) {
      await failImportJob({
        jobId: importJob.id,
        summary: { projectId, errorCount: 1, message: "Arquivo do Trello sem listas ou cards validos." }
      });
      return res.status(400).json({ message: "Arquivo do Trello invalido. Exporte o board em JSON completo." });
    }

    await ensureBoardColumns(projectId);
    const [columns, existingTasks] = await Promise.all([
      prisma.boardColumn.findMany({
        where: { projectId },
        orderBy: [{ order: "asc" }]
      }),
      prisma.wbsNode.findMany({
        where: { projectId, boardColumnId: { not: null } },
        select: { id: true, boardColumnId: true, order: true }
      })
    ]);

    const columnByStatus = new Map<TaskStatus, { id: string; status: TaskStatus | null }>();
    for (const column of columns) {
      if (column.status) columnByStatus.set(column.status, { id: column.id, status: column.status });
    }
    const fallbackColumn = columns[0] ?? null;
    if (!fallbackColumn) {
      throw new Error("BOARD_COLUMNS_NOT_AVAILABLE");
    }

    const nextOrderByColumn = new Map<string, number>();
    for (const task of existingTasks) {
      if (!task.boardColumnId) continue;
      const current = nextOrderByColumn.get(task.boardColumnId) ?? 0;
      nextOrderByColumn.set(task.boardColumnId, Math.max(current, task.order + 1));
    }

    const activeLists = new Map(
      lists
        .filter((list): list is Record<string, unknown> => Boolean(list) && typeof list === "object")
        .filter((list) => list.closed !== true && typeof list.id === "string")
        .map((list) => [String(list.id), list])
    );

    const sortedCards = cards
      .filter((card): card is Record<string, unknown> => Boolean(card) && typeof card === "object")
      .filter((card) => card.closed !== true && typeof card.idList === "string" && activeLists.has(String(card.idList)))
      .sort((left, right) => {
        const leftList = String(left.idList);
        const rightList = String(right.idList);
        if (leftList !== rightList) return leftList.localeCompare(rightList);
        const leftPos = typeof left.pos === "number" ? left.pos : Number(left.pos ?? 0);
        const rightPos = typeof right.pos === "number" ? right.pos : Number(right.pos ?? 0);
        return leftPos - rightPos;
      });

    let created = 0;
    let skipped = 0;
    const warnings: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const card of sortedCards) {
        const title = typeof card.name === "string" ? card.name.trim() : "";
        if (!title) {
          skipped += 1;
          continue;
        }

        const list = activeLists.get(String(card.idList));
        const listName = typeof list?.name === "string" ? list.name : "Lista Trello";
        const status = resolveBoardStatus(listName);
        const targetColumn = columnByStatus.get(status) ?? { id: fallbackColumn.id, status: fallbackColumn.status };

        if (!columnByStatus.has(status)) {
          warnings.push(`Lista "${listName}" mapeada para a coluna "${fallbackColumn.label}".`);
        }

        const nextOrder = nextOrderByColumn.get(targetColumn.id) ?? 0;
        nextOrderByColumn.set(targetColumn.id, nextOrder + 1);

        const dueRaw = typeof card.due === "string" && card.due.trim() ? new Date(card.due) : null;
        const dueDate = dueRaw && !Number.isNaN(dueRaw.getTime()) ? dueRaw : null;
        const dueComplete = card.dueComplete === true;
        const finalStatus = dueComplete ? TaskStatus.DONE : targetColumn.status ?? status;

        await tx.wbsNode.create({
          data: {
            projectId,
            parentId: null,
            level: 0,
            order: nextOrder,
            title,
            description: buildTrelloDescription(card, listName),
            type: "TASK",
            status: finalStatus,
            priority: resolveTrelloPriority(card),
            boardColumnId: targetColumn.id,
            endDate: dueDate,
            progress: dueComplete ? 100 : 0
          }
        });

        created += 1;
      }
    });

    const summary = {
      projectId,
      imported: created,
      created,
      updated: 0,
      warningCount: warnings.length,
      errorCount: 0,
      skipped
    };

    await completeImportJob({
      jobId: importJob.id,
      summary
    });

    await writeAuditLog({
      organizationId: req.organizationId!,
      actorId: req.user!.id,
      projectId,
      action: "TRELLO_BOARD_IMPORTED",
      entity: "INTEGRATION_IMPORT",
      entityId: importJob.id,
      diff: summary
    });

    return res.json({
      message: "Importacao do Trello concluida.",
      ...summary,
      warnings
    });
  } catch (error) {
    logger.error({ err: error, projectId }, "Failed to import Trello board");
    await failImportJob({
      jobId: importJob.id,
      summary: {
        projectId,
        errorCount: 1,
        message: error instanceof Error ? error.message : "Falha ao importar board do Trello."
      }
    });
    return res
      .status(error instanceof SyntaxError ? 400 : 500)
      .json({ message: error instanceof SyntaxError ? "Arquivo JSON do Trello invalido." : "Falha ao importar board do Trello." });
  }
});

integrationsRouter.post("/imports/jira", upload.single("file"), async (req, res) => {
  if (!ensureOrgAdmin(req, res)) return;
  if (!ensureModulePermission(req, res, "kanban", "create", "Voce nao tem permissao para importar cards para o Kanban.")) {
    return;
  }

  const projectId = normalizeUuid((req.query.projectId as string) ?? (req.body?.projectId as string) ?? "");
  const file = req.file;

  if (!projectId) {
    return res.status(400).json({ message: "projectId is required" });
  }
  if (!file) {
    return res.status(400).json({ message: "file is required" });
  }

  const membership = await ensureProjectMembership(req, res, projectId);
  if (!membership) return;

  const importJob = await createImportJob({
    organizationId: req.organizationId!,
    createdById: req.user!.id,
    source: "JIRA_EXPORT",
    entity: "JIRA_ISSUES",
    fileName: file.originalname ?? null,
    summary: { projectId }
  });

  try {
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    const parsedRows = rawRows
      .map((row) =>
        Object.entries(row).reduce<Record<string, unknown>>((acc, [key, value]) => {
          acc[normalizeImportKey(key)] = value;
          return acc;
        }, {})
      )
      .map((row) => ({
        summary:
          typeof row.summary === "string" && row.summary.trim()
            ? row.summary.trim()
            : typeof row.titulo === "string" && row.titulo.trim()
            ? row.titulo.trim()
            : typeof row.nome === "string" && row.nome.trim()
            ? row.nome.trim()
            : "",
        status:
          typeof row.status === "string" && row.status.trim()
            ? row.status.trim()
            : typeof row.statuscategory === "string" && row.statuscategory.trim()
            ? row.statuscategory.trim()
            : "Backlog",
        priority:
          typeof row.priority === "string" && row.priority.trim()
            ? row.priority.trim()
            : typeof row.prioridade === "string" && row.prioridade.trim()
            ? row.prioridade.trim()
            : "Medium",
        dueDate:
          parseSpreadsheetDateValue(
            row.duedate ?? row.dataentrega ?? row.vencimento ?? row.prazo ?? row.resolutiondate ?? null
          ),
        description:
          typeof row.description === "string" && row.description.trim()
            ? row.description.trim()
            : typeof row.descricao === "string" && row.descricao.trim()
            ? row.descricao.trim()
            : "",
        issueKey:
          typeof row.issuekey === "string" && row.issuekey.trim()
            ? row.issuekey.trim()
            : typeof row.key === "string" && row.key.trim()
            ? row.key.trim()
            : typeof row.chave === "string" && row.chave.trim()
            ? row.chave.trim()
            : "",
        issueType:
          typeof row.issuetype === "string" && row.issuetype.trim()
            ? row.issuetype.trim()
            : typeof row.tipo === "string" && row.tipo.trim()
            ? row.tipo.trim()
            : ""
      }))
      .filter((row) => row.summary.length > 0);

    if (!parsedRows.length) {
      await failImportJob({
        jobId: importJob.id,
        summary: { projectId, errorCount: 1, message: "Arquivo do Jira sem linhas validas." }
      });
      return res.status(400).json({ message: "Arquivo do Jira invalido. Confirme colunas como Summary, Status e Priority." });
    }

    await ensureBoardColumns(projectId);
    const [columns, existingTasks] = await Promise.all([
      prisma.boardColumn.findMany({
        where: { projectId },
        orderBy: [{ order: "asc" }]
      }),
      prisma.wbsNode.findMany({
        where: { projectId, boardColumnId: { not: null } },
        select: { id: true, boardColumnId: true, order: true }
      })
    ]);

    const columnByStatus = new Map<TaskStatus, { id: string; status: TaskStatus | null; label: string }>();
    for (const column of columns) {
      if (column.status) {
        columnByStatus.set(column.status, { id: column.id, status: column.status, label: column.label });
      }
    }
    const fallbackColumn = columns[0] ?? null;
    if (!fallbackColumn) {
      throw new Error("BOARD_COLUMNS_NOT_AVAILABLE");
    }

    const nextOrderByColumn = new Map<string, number>();
    for (const task of existingTasks) {
      if (!task.boardColumnId) continue;
      const current = nextOrderByColumn.get(task.boardColumnId) ?? 0;
      nextOrderByColumn.set(task.boardColumnId, Math.max(current, task.order + 1));
    }

    let created = 0;
    const warnings: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const row of parsedRows) {
        const status = resolveBoardStatus(row.status);
        const targetColumn = columnByStatus.get(status) ?? {
          id: fallbackColumn.id,
          status: fallbackColumn.status,
          label: fallbackColumn.label
        };
        if (!columnByStatus.has(status)) {
          warnings.push(`Status "${row.status}" mapeado para a coluna "${fallbackColumn.label}".`);
        }

        const nextOrder = nextOrderByColumn.get(targetColumn.id) ?? 0;
        nextOrderByColumn.set(targetColumn.id, nextOrder + 1);

        const finalDescription = buildJiraDescription({
          description: row.description,
          issuekey: row.issueKey,
          issuetype: row.issueType
        });

        await tx.wbsNode.create({
          data: {
            projectId,
            parentId: null,
            level: 0,
            order: nextOrder,
            title: row.summary,
            description: finalDescription,
            type: "TASK",
            status: targetColumn.status ?? status,
            priority: resolveJiraPriority(row.priority),
            boardColumnId: targetColumn.id,
            endDate: row.dueDate,
            progress: targetColumn.status === TaskStatus.DONE ? 100 : 0
          }
        });

        created += 1;
      }
    });

    const summary = {
      projectId,
      imported: created,
      created,
      updated: 0,
      warningCount: warnings.length,
      errorCount: 0
    };

    await completeImportJob({
      jobId: importJob.id,
      summary
    });

    await writeAuditLog({
      organizationId: req.organizationId!,
      actorId: req.user!.id,
      projectId,
      action: "JIRA_ISSUES_IMPORTED",
      entity: "INTEGRATION_IMPORT",
      entityId: importJob.id,
      diff: summary
    });

    return res.json({
      message: "Importacao do Jira concluida.",
      ...summary,
      warnings
    });
  } catch (error) {
    logger.error({ err: error, projectId }, "Failed to import Jira export");
    await failImportJob({
      jobId: importJob.id,
      summary: {
        projectId,
        errorCount: 1,
        message: error instanceof Error ? error.message : "Falha ao importar export do Jira."
      }
    });
    return res.status(500).json({ message: "Falha ao importar export do Jira." });
  }
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
