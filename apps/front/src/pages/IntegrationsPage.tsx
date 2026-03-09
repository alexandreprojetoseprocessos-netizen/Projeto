import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  KeyRound,
  Link2,
  Mail,
  RefreshCw,
  SendHorizontal,
  ShieldCheck,
  Trash2,
  Webhook,
  XCircle,
  MessageSquareShare
} from "lucide-react";
import { AppPageHero, AppStateCard, AppStepGuide } from "../components/AppPageHero";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { canAccessModule, canManageOrganizationSettings, type OrgRole } from "../components/permissions";
import { apiRequest, apiUrl, getApiErrorMessage } from "../config/api";
import { useAuth } from "../contexts/AuthContext";

type CatalogEvent = {
  eventName: string;
  description?: string | null;
};

type ApiTokenSummary = {
  id: string;
  name: string;
  tokenPrefix: string;
  tokenLastFour: string;
  createdAt: string;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  createdBy?: {
    id: string;
    fullName?: string | null;
    email?: string | null;
  } | null;
  scopes?: unknown;
  plainText?: string;
};

type WebhookSummary = {
  id: string;
  name: string;
  provider: string;
  targetUrl: string;
  isActive: boolean;
  eventNames: string[];
  createdAt: string;
  lastDeliveredAt?: string | null;
  lastStatus?: "PENDING" | "SUCCESS" | "FAILED" | null;
};

type WebhookDelivery = {
  id: string;
  eventName: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  responseStatus?: number | null;
  responseBody?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
};

type WebhookHealthLevel = "HEALTHY" | "WARNING" | "CRITICAL" | "IDLE" | "INACTIVE";

type WebhookHealthItem = {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  attempts: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  successRate: number;
  failedRate: number;
  lastTriggeredAt?: string | null;
  lastFailureAt?: string | null;
  level: WebhookHealthLevel;
};

type WebhookHealthSummary = {
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

type WebhookHealthAlert = {
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

type WebhookHealthResponse = {
  summary: WebhookHealthSummary;
  webhooks: WebhookHealthItem[];
  alerts: WebhookHealthAlert[];
};

type TokenCreateResponse = {
  token?: ApiTokenSummary | null;
};

type WebhookCreateResponse = {
  webhook?: WebhookSummary | null;
};

type SlackConnectionSummary = {
  id: string;
  provider: string;
  name: string;
  isActive: boolean;
  eventNames: string[];
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string | null;
  lastValidatedAt?: string | null;
  lastValidationStatus?: string | null;
  lastValidationMessage?: string | null;
  webhookConfigured?: boolean;
  webhookPreview?: string | null;
};

type EmailAlertsConnectionSummary = {
  id: string | null;
  provider?: string;
  name: string;
  isActive: boolean;
  recipients: string[];
  smtpConfigured: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastTriggeredAt?: string | null;
  lastValidatedAt?: string | null;
  lastValidationStatus?: string | null;
  lastValidationMessage?: string | null;
};

type GoogleCalendarConnectionSummary = {
  id: string;
  provider: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string | null;
  lastValidatedAt?: string | null;
  lastValidationStatus?: string | null;
  lastValidationMessage?: string | null;
  projectId?: string | null;
  includeTasks?: boolean;
  includeMilestones?: boolean;
  feedPath?: string | null;
};

type ImportJobSummary = {
  id: string;
  source: string;
  entity: string;
  status: string;
  fileName?: string | null;
  summary?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    fullName?: string | null;
    email?: string | null;
  } | null;
};

const PROVIDER_LABELS: Record<string, string> = {
  CUSTOM: "Custom",
  SLACK: "Slack",
  GOOGLE_CALENDAR: "Google Calendar",
  OUTLOOK_CALENDAR: "Outlook Calendar",
  TRELLO: "Trello",
  ASANA: "Asana",
  JIRA: "Jira",
  GITHUB: "GitHub"
};

const DELIVERY_STATUS_LABELS: Record<WebhookDelivery["status"], string> = {
  PENDING: "Pendente",
  SUCCESS: "Sucesso",
  FAILED: "Falha"
};

const WEBHOOK_HEALTH_LABELS: Record<WebhookHealthLevel, string> = {
  HEALTHY: "Saudável",
  WARNING: "Atenção",
  CRITICAL: "Crítico",
  IDLE: "Sem tráfego",
  INACTIVE: "Inativo"
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
};

const formatScopeLabel = (eventName: string) =>
  eventName
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" / ");

const asStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const parseEmailRecipientsText = (value: string) =>
  [...new Set(value.split(",").map((item) => item.trim().toLowerCase()).filter((item) => EMAIL_REGEX.test(item)))];

const feedbackClassName = (message: string | null) => {
  if (!message) return "integration-feedback";
  const normalized = message.toLocaleLowerCase("pt-BR");
  if (normalized.includes("falha") || normalized.includes("erro")) {
    return "integration-feedback integration-feedback--error";
  }
  return "integration-feedback integration-feedback--success";
};

export const IntegrationsPage = () => {
  const { token } = useAuth();
  const {
    selectedOrganizationId,
    selectedProjectId,
    selectedProject,
    currentOrgRole,
    currentOrgModulePermissions,
    projects
  } =
    useOutletContext<DashboardOutletContext>();
  const orgRole = (currentOrgRole ?? "MEMBER") as OrgRole;
  const canManage = canManageOrganizationSettings(orgRole);
  const canImportWbs = canAccessModule(orgRole, currentOrgModulePermissions, "eap", "create");
  const canImportCatalog = canAccessModule(orgRole, currentOrgModulePermissions, "budget", "create");
  const canImportKanban = canAccessModule(orgRole, currentOrgModulePermissions, "kanban", "create");

  const [catalogEvents, setCatalogEvents] = useState<CatalogEvent[]>([]);
  const [tokens, setTokens] = useState<ApiTokenSummary[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookSummary[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);

  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<"all" | WebhookDelivery["status"]>("all");
  const [deliveryEventFilter, setDeliveryEventFilter] = useState("");
  const [deliverySort, setDeliverySort] = useState<"newest" | "oldest">("newest");
  const [deliveryLimit, setDeliveryLimit] = useState(10);
  const [retryingDeliveryId, setRetryingDeliveryId] = useState<string | null>(null);
  const [retryingBatch, setRetryingBatch] = useState(false);
  const [healthWindowHours, setHealthWindowHours] = useState(24);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [webhookHealth, setWebhookHealth] = useState<WebhookHealthResponse | null>(null);

  const [tokenName, setTokenName] = useState("");
  const [tokenExpiresAt, setTokenExpiresAt] = useState("");
  const [tokenScopes, setTokenScopes] = useState<string[]>([]);
  const [creatingToken, setCreatingToken] = useState(false);
  const [latestPlainToken, setLatestPlainToken] = useState<string | null>(null);
  const [tokenFeedback, setTokenFeedback] = useState<string | null>(null);

  const [webhookName, setWebhookName] = useState("");
  const [webhookTargetUrl, setWebhookTargetUrl] = useState("");
  const [webhookProvider, setWebhookProvider] = useState("CUSTOM");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [webhookFeedback, setWebhookFeedback] = useState<string | null>(null);
  const [slackConnection, setSlackConnection] = useState<SlackConnectionSummary | null>(null);
  const [slackName, setSlackName] = useState("Slack");
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [slackEvents, setSlackEvents] = useState<string[]>([]);
  const [slackIsActive, setSlackIsActive] = useState(true);
  const [slackLoading, setSlackLoading] = useState(false);
  const [slackTesting, setSlackTesting] = useState(false);
  const [slackFeedback, setSlackFeedback] = useState<string | null>(null);
  const [emailAlertsConnection, setEmailAlertsConnection] = useState<EmailAlertsConnectionSummary | null>(null);
  const [emailAlertsName, setEmailAlertsName] = useState("Alertas por e-mail");
  const [emailAlertsRecipientsText, setEmailAlertsRecipientsText] = useState("");
  const [emailAlertsIsActive, setEmailAlertsIsActive] = useState(true);
  const [emailAlertsLoading, setEmailAlertsLoading] = useState(false);
  const [emailAlertsTesting, setEmailAlertsTesting] = useState(false);
  const [emailAlertsFeedback, setEmailAlertsFeedback] = useState<string | null>(null);
  const [calendarConnection, setCalendarConnection] = useState<GoogleCalendarConnectionSummary | null>(null);
  const [calendarName, setCalendarName] = useState("Google Calendar");
  const [calendarProjectId, setCalendarProjectId] = useState("");
  const [calendarIncludeTasks, setCalendarIncludeTasks] = useState(true);
  const [calendarIncludeMilestones, setCalendarIncludeMilestones] = useState(true);
  const [calendarIsActive, setCalendarIsActive] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarFeedback, setCalendarFeedback] = useState<string | null>(null);
  const [importJobs, setImportJobs] = useState<ImportJobSummary[]>([]);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [wbsImporting, setWbsImporting] = useState(false);
  const [catalogImporting, setCatalogImporting] = useState(false);
  const [trelloImporting, setTrelloImporting] = useState(false);
  const [jiraImporting, setJiraImporting] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  const wbsInputRef = useRef<HTMLInputElement | null>(null);
  const catalogInputRef = useRef<HTMLInputElement | null>(null);
  const trelloInputRef = useRef<HTMLInputElement | null>(null);
  const jiraInputRef = useRef<HTMLInputElement | null>(null);

  const headers = useMemo(
    () => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(selectedOrganizationId ? { "X-Organization-Id": selectedOrganizationId } : {})
    }),
    [selectedOrganizationId, token]
  );

  const loadWebhookHealth = useCallback(
    async (windowHours = healthWindowHours) => {
      if (!token || !selectedOrganizationId || !canManage) {
        setWebhookHealth(null);
        setHealthError(null);
        setHealthLoading(false);
        return;
      }

      setHealthLoading(true);
      setHealthError(null);
      try {
        const body = await apiRequest<WebhookHealthResponse>(`/integrations/webhooks/health?windowHours=${windowHours}`, {
          headers
        });
        setWebhookHealth({
          summary: body.summary,
          webhooks: Array.isArray(body.webhooks) ? body.webhooks : [],
          alerts: Array.isArray(body.alerts) ? body.alerts : []
        });
      } catch (error) {
        setWebhookHealth(null);
        setHealthError(getApiErrorMessage(error, "Falha ao carregar a saúde dos webhooks."));
      } finally {
        setHealthLoading(false);
      }
    },
    [canManage, headers, healthWindowHours, selectedOrganizationId, token]
  );

  const loadPage = useCallback(async () => {
    if (!token || !selectedOrganizationId || !canManage) {
      setCatalogEvents([]);
      setTokens([]);
      setWebhooks([]);
      setWebhookHealth(null);
      setHealthError(null);
      setSlackConnection(null);
      setEmailAlertsConnection(null);
      setCalendarConnection(null);
      setImportJobs([]);
      setPageError(null);
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setPageError(null);
    try {
      const [catalogBody, tokenBody, webhookBody, slackBody, emailAlertsBody, calendarBody, jobsBody] = await Promise.all([
        apiRequest<{ events?: CatalogEvent[] }>("/integrations/catalog/events", { headers }),
        apiRequest<{ tokens?: ApiTokenSummary[] }>("/integrations/tokens", { headers }),
        apiRequest<{ webhooks?: WebhookSummary[] }>("/integrations/webhooks", { headers }),
        apiRequest<{ slack?: SlackConnectionSummary | null }>("/integrations/slack", { headers }),
        apiRequest<{ emailAlerts?: EmailAlertsConnectionSummary | null }>("/integrations/email-alerts", { headers }),
        apiRequest<{ calendar?: GoogleCalendarConnectionSummary | null }>("/integrations/google-calendar", { headers }),
        apiRequest<{ jobs?: ImportJobSummary[] }>("/integrations/import-jobs?limit=12", { headers })
      ]);

      const nextCatalog = Array.isArray(catalogBody.events) ? catalogBody.events : [];
      const nextTokens = Array.isArray(tokenBody.tokens) ? tokenBody.tokens : [];
      const nextWebhooks = Array.isArray(webhookBody.webhooks) ? webhookBody.webhooks : [];
      const nextSlack = slackBody.slack ?? null;
      const nextEmailAlerts = emailAlertsBody.emailAlerts ?? null;
      const nextCalendar = calendarBody.calendar ?? null;
      const nextJobs = Array.isArray(jobsBody.jobs) ? jobsBody.jobs : [];

      setCatalogEvents(nextCatalog);
      setTokens(nextTokens);
      setWebhooks(nextWebhooks);
      setSlackConnection(nextSlack);
      setEmailAlertsConnection(nextEmailAlerts);
      setCalendarConnection(nextCalendar);
      setImportJobs(nextJobs);
      setTokenScopes((current) => current.filter((scope) => nextCatalog.some((eventItem) => eventItem.eventName === scope)));
      setWebhookEvents((current) =>
        current.filter((scope) => nextCatalog.some((eventItem) => eventItem.eventName === scope))
      );
      setSlackEvents((current) => {
        if (nextSlack?.eventNames?.length) {
          return nextSlack.eventNames.filter((scope) => nextCatalog.some((eventItem) => eventItem.eventName === scope));
        }
        return current.filter((scope) => nextCatalog.some((eventItem) => eventItem.eventName === scope));
      });
      setSlackName(nextSlack?.name ?? "Slack");
      setSlackIsActive(nextSlack?.isActive ?? true);
      setSlackWebhookUrl("");
      setEmailAlertsName(nextEmailAlerts?.name ?? "Alertas por e-mail");
      setEmailAlertsIsActive(nextEmailAlerts?.isActive ?? true);
      setEmailAlertsRecipientsText((nextEmailAlerts?.recipients ?? []).join(", "));
      setCalendarName(nextCalendar?.name ?? "Google Calendar");
      setCalendarProjectId(nextCalendar?.projectId ?? (selectedProjectId && selectedProjectId !== "all" ? selectedProjectId : ""));
      setCalendarIncludeTasks(nextCalendar?.includeTasks !== false);
      setCalendarIncludeMilestones(nextCalendar?.includeMilestones !== false);
      setCalendarIsActive(nextCalendar?.isActive ?? true);
      setSelectedWebhookId((current) => {
        if (current && nextWebhooks.some((item) => item.id === current)) return current;
        return nextWebhooks[0]?.id ?? null;
      });
      void loadWebhookHealth();
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Falha ao carregar a central de integrações."));
      setCatalogEvents([]);
      setTokens([]);
      setWebhooks([]);
      setWebhookHealth(null);
      setSlackConnection(null);
      setEmailAlertsConnection(null);
      setCalendarConnection(null);
      setImportJobs([]);
    } finally {
      setPageLoading(false);
    }
  }, [canManage, headers, loadWebhookHealth, selectedOrganizationId, selectedProjectId, token]);

  const loadDeliveries = useCallback(
    async (webhookId: string | null, limit = deliveryLimit) => {
      if (!token || !selectedOrganizationId || !canManage || !webhookId) {
        setDeliveries([]);
        setDeliveryError(null);
        setDeliveryLoading(false);
        return;
      }

      setDeliveryLoading(true);
        setDeliveryError(null);
        try {
          const body = await apiRequest<{ deliveries?: WebhookDelivery[] }>(
          `/integrations/webhooks/${webhookId}/deliveries?limit=${limit}`,
            {
              headers
            }
          );
        setDeliveries(Array.isArray(body.deliveries) ? body.deliveries : []);
      } catch (error) {
        setDeliveries([]);
        setDeliveryError(getApiErrorMessage(error, "Falha ao carregar entregas do webhook."));
      } finally {
        setDeliveryLoading(false);
      }
    },
    [canManage, deliveryLimit, headers, selectedOrganizationId, token]
  );

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    void loadDeliveries(selectedWebhookId);
  }, [loadDeliveries, selectedWebhookId]);

  useEffect(() => {
    setDeliveryLimit(10);
  }, [selectedWebhookId]);

  const selectedWebhook = useMemo(
    () => webhooks.find((item) => item.id === selectedWebhookId) ?? null,
    [selectedWebhookId, webhooks]
  );
  const catalogEventNames = useMemo(() => catalogEvents.map((item) => item.eventName), [catalogEvents]);
  const hasProjectContext = Boolean(selectedProjectId && selectedProjectId !== "all");
  const calendarFeedUrl = calendarConnection?.feedPath ? apiUrl(calendarConnection.feedPath) : null;
  const inboundKanbanUrl = apiUrl("/integrations/inbound/kanban/task-upsert");
  const inboundSamplePayload = useMemo(
    () => `{
  "projectId": "${selectedProjectId && selectedProjectId !== "all" ? selectedProjectId : "PROJECT_ID"}",
  "externalKey": "EXT-123",
  "source": "ERP",
  "title": "Atualizar contrato",
  "description": "Gerado por sistema externo",
  "status": "Em andamento",
  "priority": "Alta",
  "startDate": "2026-03-04",
  "dueDate": "2026-03-07",
  "estimateHours": 8,
  "externalUrl": "https://sistema.externo/item/EXT-123"
}`,
    [selectedProjectId]
  );

  const tokenStats = useMemo(
    () => ({
      tokensAtivos: tokens.length,
      webhooksAtivos: webhooks.filter((item) => item.isActive).length,
      entregasOk:
        webhookHealth?.summary?.successCount ??
        deliveries.filter((item) => item.status === "SUCCESS").length,
      entregasFalhas:
        webhookHealth?.summary?.failedCount ??
        deliveries.filter((item) => item.status === "FAILED").length
    }),
    [deliveries, tokens.length, webhookHealth, webhooks]
  );
  const filteredDeliveries = useMemo(() => {
    const eventTerm = deliveryEventFilter.trim().toLocaleLowerCase("pt-BR");
    const filtered = deliveries.filter((delivery) => {
      const matchesStatus = deliveryStatusFilter === "all" ? true : delivery.status === deliveryStatusFilter;
      const matchesEvent = !eventTerm ? true : delivery.eventName.toLocaleLowerCase("pt-BR").includes(eventTerm);
      return matchesStatus && matchesEvent;
    });
    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      if (deliverySort === "oldest") return aTime - bTime;
      return bTime - aTime;
    });
  }, [deliveries, deliveryEventFilter, deliverySort, deliveryStatusFilter]);

  const toggleEventSelection = (value: string, current: string[], setter: (items: string[]) => void) => {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const handleCreateToken = async () => {
    if (!token || !selectedOrganizationId || !canManage || !tokenName.trim()) return;

    setCreatingToken(true);
    setTokenFeedback(null);
    try {
      const body = await apiRequest<TokenCreateResponse>("/integrations/tokens", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: tokenName.trim(),
          expiresAt: tokenExpiresAt || undefined,
          scopes: tokenScopes
        })
      });
      const createdToken = body.token ?? null;
      if (createdToken) {
        setLatestPlainToken(createdToken.plainText ?? null);
        setTokenFeedback("Token emitido. Copie agora: o valor completo não volta a aparecer.");
      }
      setTokenName("");
      setTokenExpiresAt("");
      setTokenScopes([]);
      await loadPage();
    } catch (error) {
      setTokenFeedback(getApiErrorMessage(error, "Falha ao criar token."));
      setLatestPlainToken(null);
    } finally {
      setCreatingToken(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (!token || !selectedOrganizationId || !canManage) return;
    try {
      await apiRequest(`/integrations/tokens/${tokenId}`, {
        method: "DELETE",
        headers
      });
      await loadPage();
    } catch (error) {
      setTokenFeedback(getApiErrorMessage(error, "Falha ao revogar token."));
    }
  };

  const handleCreateWebhook = async () => {
    if (!token || !selectedOrganizationId || !canManage || !webhookName.trim() || !webhookTargetUrl.trim()) return;

    setCreatingWebhook(true);
    setWebhookFeedback(null);
    try {
      const body = await apiRequest<WebhookCreateResponse>("/integrations/webhooks", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: webhookName.trim(),
          provider: webhookProvider,
          targetUrl: webhookTargetUrl.trim(),
          secret: webhookSecret.trim() || undefined,
          eventNames: webhookEvents
        })
      });
      const createdWebhook = body.webhook ?? null;
      setWebhookName("");
      setWebhookTargetUrl("");
      setWebhookSecret("");
      setWebhookProvider("CUSTOM");
      setWebhookEvents([]);
      setWebhookFeedback(createdWebhook ? "Webhook criado com sucesso." : "Webhook registrado.");
      await loadPage();
      if (createdWebhook?.id) {
        setSelectedWebhookId(createdWebhook.id);
      }
    } catch (error) {
      setWebhookFeedback(getApiErrorMessage(error, "Falha ao criar webhook."));
    } finally {
      setCreatingWebhook(false);
    }
  };

  const handleToggleWebhook = async (webhookItem: WebhookSummary) => {
    if (!token || !selectedOrganizationId || !canManage) return;
    try {
      await apiRequest(`/integrations/webhooks/${webhookItem.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          isActive: !webhookItem.isActive
        })
      });
      await loadPage();
    } catch (error) {
      setWebhookFeedback(getApiErrorMessage(error, "Falha ao atualizar webhook."));
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!token || !selectedOrganizationId || !canManage) return;
    try {
      await apiRequest(`/integrations/webhooks/${webhookId}`, {
        method: "DELETE",
        headers
      });
      if (selectedWebhookId === webhookId) {
        setSelectedWebhookId(null);
      }
      await loadPage();
    } catch (error) {
      setWebhookFeedback(getApiErrorMessage(error, "Falha ao remover webhook."));
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    if (!token || !selectedOrganizationId || !canManage) return;
    try {
      await apiRequest(`/integrations/webhooks/${webhookId}/test`, {
        method: "POST",
        headers
      });
      setWebhookFeedback("Evento de teste enfileirado.");
      await loadDeliveries(webhookId);
    } catch (error) {
      setWebhookFeedback(getApiErrorMessage(error, "Falha ao testar webhook."));
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    if (!token || !selectedOrganizationId || !canManage || !selectedWebhookId) return;

    setRetryingDeliveryId(deliveryId);
    setDeliveryError(null);
    try {
      await apiRequest(`/integrations/webhooks/${selectedWebhookId}/deliveries/${deliveryId}/retry`, {
        method: "POST",
        headers
      });
      setWebhookFeedback("Entrega reenfileirada para novo envio.");
      await loadDeliveries(selectedWebhookId, deliveryLimit);
      await loadPage();
    } catch (error) {
      setDeliveryError(getApiErrorMessage(error, "Falha ao reenviar entrega."));
    } finally {
      setRetryingDeliveryId(null);
    }
  };

  const handleRetryFilteredFailures = async () => {
    if (!token || !selectedOrganizationId || !canManage || !selectedWebhookId) return;
    const failures = filteredDeliveries.filter((delivery) => delivery.status === "FAILED");
    if (!failures.length) {
      setWebhookFeedback("Nenhuma entrega com falha nos filtros atuais.");
      return;
    }

    setRetryingBatch(true);
    setDeliveryError(null);
    try {
      const body = await apiRequest<{
        queued?: number;
        failed?: number;
      }>(`/integrations/webhooks/${selectedWebhookId}/deliveries/retry`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          deliveryIds: failures.map((delivery) => delivery.id)
        })
      });
      const successCount = Number(body.queued ?? 0);
      const failCount = Number(body.failed ?? 0);
      setWebhookFeedback(
        failCount
          ? `${successCount} entrega(s) reenfileiradas e ${failCount} com falha no reenvio.`
          : `${successCount} entrega(s) reenfileiradas com sucesso.`
      );
      await loadDeliveries(selectedWebhookId, deliveryLimit);
      await loadPage();
    } catch (error) {
      setDeliveryError(getApiErrorMessage(error, "Falha ao reenviar lote de entregas."));
    } finally {
      setRetryingBatch(false);
    }
  };

  const handleExportDeliveriesCsv = () => {
    if (!filteredDeliveries.length) {
      setWebhookFeedback("Nenhuma entrega para exportar com os filtros atuais.");
      return;
    }
    const escapeCsv = (value: unknown) => {
      const text = String(value ?? "");
      const normalized = text.replace(/"/g, "\"\"");
      return /[;"\n\r]/.test(normalized) ? `"${normalized}"` : normalized;
    };
    const header = [
      "evento",
      "status",
      "criado_em_iso",
      "entregue_em_iso",
      "response_status",
      "response_body"
    ];
    const lines = filteredDeliveries.map((delivery) =>
      [
        delivery.eventName,
        delivery.status,
        delivery.createdAt ?? "",
        delivery.deliveredAt ?? "",
        delivery.responseStatus ?? "",
        delivery.responseBody ?? ""
      ]
        .map(escapeCsv)
        .join(";")
    );
    const csv = [header.join(";"), ...lines].join("\n");
    const fileSafeWebhook = (selectedWebhook?.name ?? "webhook").replace(/[^a-zA-Z0-9-_]+/g, "_");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `entregas_${fileSafeWebhook}_${timestamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setWebhookFeedback(`${filteredDeliveries.length} entrega(s) exportadas em CSV.`);
  };

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopy = async (value: string | null, label = "Conteúdo") => {
    if (!value) return;
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyFeedback(`Não foi possível copiar ${label.toLocaleLowerCase("pt-BR")} automaticamente.`);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback(`${label} copiado com sucesso.`);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => setCopyFeedback(null), 2800);
    } catch {
      setCopyFeedback(`Falha ao copiar ${label.toLocaleLowerCase("pt-BR")}.`);
    }
  };

  const handleSaveSlack = async () => {
    if (!token || !selectedOrganizationId || !canManage) return;

    setSlackLoading(true);
    setSlackFeedback(null);
    try {
      const body = await apiRequest<{ slack?: SlackConnectionSummary | null }>("/integrations/slack", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: slackName.trim() || "Slack",
          webhookUrl: slackWebhookUrl.trim() || undefined,
          eventNames: slackEvents,
          isActive: slackIsActive
        })
      });
      setSlackConnection(body.slack ?? null);
      setSlackWebhookUrl("");
      setSlackFeedback("Integração Slack salva com sucesso.");
      await loadPage();
    } catch (error) {
      setSlackFeedback(getApiErrorMessage(error, "Falha ao salvar integração Slack."));
    } finally {
      setSlackLoading(false);
    }
  };

  const handleTestSlack = async () => {
    if (!token || !selectedOrganizationId || !canManage) return;

    setSlackTesting(true);
    setSlackFeedback(null);
    try {
      const body = await apiRequest<{ message?: string }>("/integrations/slack/test", {
        method: "POST",
        headers
      });
      setSlackFeedback(body.message ?? "Teste enviado ao Slack.");
      await loadPage();
    } catch (error) {
      setSlackFeedback(getApiErrorMessage(error, "Falha ao testar Slack."));
    } finally {
      setSlackTesting(false);
    }
  };

  const handleSaveEmailAlerts = async () => {
    if (!token || !selectedOrganizationId || !canManage) return;

    const recipients = parseEmailRecipientsText(emailAlertsRecipientsText);
    if (emailAlertsRecipientsText.trim().length > 0 && recipients.length === 0) {
      setEmailAlertsFeedback("Informe e-mails válidos separados por vírgula.");
      return;
    }

    setEmailAlertsLoading(true);
    setEmailAlertsFeedback(null);
    try {
      const body = await apiRequest<{ emailAlerts?: EmailAlertsConnectionSummary | null }>("/integrations/email-alerts", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: emailAlertsName.trim() || "Alertas por e-mail",
          isActive: emailAlertsIsActive,
          recipients
        })
      });
      const next = body.emailAlerts ?? null;
      setEmailAlertsConnection(next);
      if (next) {
        setEmailAlertsName(next.name);
        setEmailAlertsIsActive(next.isActive);
        setEmailAlertsRecipientsText((next.recipients ?? []).join(", "));
      }
      setEmailAlertsFeedback("Alertas por e-mail salvos com sucesso.");
      await loadPage();
    } catch (error) {
      setEmailAlertsFeedback(getApiErrorMessage(error, "Falha ao salvar alertas por e-mail."));
    } finally {
      setEmailAlertsLoading(false);
    }
  };

  const handleTestEmailAlerts = async () => {
    if (!token || !selectedOrganizationId || !canManage) return;

    const recipients = parseEmailRecipientsText(emailAlertsRecipientsText);
    if (emailAlertsRecipientsText.trim().length > 0 && recipients.length === 0) {
      setEmailAlertsFeedback("Informe e-mails válidos para teste.");
      return;
    }

    setEmailAlertsTesting(true);
    setEmailAlertsFeedback(null);
    try {
      const body = await apiRequest<{ message?: string }>("/integrations/email-alerts/test", {
        method: "POST",
        headers,
        body: JSON.stringify({
          recipients
        })
      });
      setEmailAlertsFeedback(body.message ?? "Teste de e-mail enviado.");
      await loadPage();
    } catch (error) {
      setEmailAlertsFeedback(getApiErrorMessage(error, "Falha ao enviar teste de e-mail."));
    } finally {
      setEmailAlertsTesting(false);
    }
  };

  const handleSaveCalendar = async (regenerateToken = false) => {
    if (!token || !selectedOrganizationId || !canManage) return;

    setCalendarLoading(true);
    setCalendarFeedback(null);
    try {
      const body = await apiRequest<{ calendar?: GoogleCalendarConnectionSummary | null }>("/integrations/google-calendar", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: calendarName.trim() || "Google Calendar",
          projectId: calendarProjectId || undefined,
          includeTasks: calendarIncludeTasks,
          includeMilestones: calendarIncludeMilestones,
          isActive: calendarIsActive,
          regenerateToken
        })
      });
      setCalendarConnection(body.calendar ?? null);
      setCalendarFeedback(
        regenerateToken ? "Feed do Google Calendar atualizado com novo token." : "Integração Google Calendar salva com sucesso."
      );
      await loadPage();
    } catch (error) {
      setCalendarFeedback(getApiErrorMessage(error, "Falha ao salvar integração Google Calendar."));
    } finally {
      setCalendarLoading(false);
    }
  };

  const runImport = async (kind: "wbs" | "catalog" | "trello" | "jira", file: File | null) => {
    if (!token || !selectedOrganizationId || !hasProjectContext || !selectedProjectId || !file) return;

    setImportError(null);
    setImportFeedback(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", selectedProjectId);

    if (kind === "wbs") {
      setWbsImporting(true);
    } else if (kind === "catalog") {
      setCatalogImporting(true);
    } else if (kind === "trello") {
      setTrelloImporting(true);
    } else {
      setJiraImporting(true);
    }

    try {
      const endpoint =
        kind === "wbs"
          ? `/wbs/import?projectId=${selectedProjectId}`
          : kind === "catalog"
          ? `/service-catalog/import?projectId=${selectedProjectId}`
          : kind === "trello"
          ? `/integrations/imports/trello?projectId=${selectedProjectId}`
          : `/integrations/imports/jira?projectId=${selectedProjectId}`;
      const body = await apiRequest<Record<string, unknown>>(endpoint, {
        method: "POST",
        headers,
        body: formData
      });

      const imported = typeof body.imported === "number" ? body.imported : typeof body.created === "number" ? body.created : null;
      const updated = typeof body.updated === "number" ? body.updated : 0;
      const warnings = Array.isArray(body.warnings) ? body.warnings.length : 0;
      const kindLabel =
        kind === "wbs" ? "EAP" : kind === "catalog" ? "catálogo" : kind === "trello" ? "Trello" : "Jira";

      setImportFeedback(
        imported !== null
          ? `Importação de ${kindLabel} concluída: ${imported} criados, ${updated} atualizados, ${warnings} avisos.`
          : `Importação de ${kindLabel} concluída com sucesso.`
      );
      await loadPage();
    } catch (error) {
      setImportError(
        getApiErrorMessage(
          error,
          `Falha ao importar ${kind === "wbs" ? "EAP" : kind === "catalog" ? "catálogo" : kind === "trello" ? "Trello" : "Jira"}.`
        )
      );
    } finally {
      if (kind === "wbs") {
        setWbsImporting(false);
        if (wbsInputRef.current) wbsInputRef.current.value = "";
      } else if (kind === "catalog") {
        setCatalogImporting(false);
        if (catalogInputRef.current) catalogInputRef.current.value = "";
      } else if (kind === "trello") {
        setTrelloImporting(false);
        if (trelloInputRef.current) trelloInputRef.current.value = "";
      } else {
        setJiraImporting(false);
        if (jiraInputRef.current) jiraInputRef.current.value = "";
      }
    }
  };

  if (!selectedOrganizationId) {
    return (
      <section className="integrations-page">
        <AppStateCard
          title="Selecione uma organização"
          description="Tokens, webhooks e importações sempre pertencem a uma organização específica."
          tone="info"
        />
      </section>
    );
  }

  if (!canManage) {
    return (
      <section className="integrations-page">
        <AppStateCard
          title="Acesso restrito"
          description="A central de integrações fica disponível apenas para owner e admin da organização ativa."
          tone="warning"
        />
      </section>
    );
  }

  return (
    <section className="integrations-page">
      <AppPageHero
        kicker="Ecossistema"
        title="Integrações e webhooks"
        subtitle="Gerencie tokens de API, destinos de webhook e a trilha das entregas da organização."
        actions={
          <button type="button" className="btn-secondary integrations-page__refresh" onClick={() => void loadPage()}>
            <RefreshCw size={16} />
            Recarregar
          </button>
        }
        stats={[
          {
            label: "Tokens ativos",
            value: tokenStats.tokensAtivos,
            helper: "Acesso programático por organização",
            icon: <KeyRound size={18} />,
            tone: "info"
          },
          {
            label: "Webhooks ativos",
            value: tokenStats.webhooksAtivos,
            helper: "Destinos habilitados para eventos",
            icon: <Webhook size={18} />,
            tone: "success"
          },
          {
            label: "Entregas OK",
            value: tokenStats.entregasOk,
            helper: `Últimas ${webhookHealth?.summary?.windowHours ?? healthWindowHours}h em todos os webhooks`,
            icon: <CheckCircle2 size={18} />,
            tone: "success"
          },
          {
            label: "Falhas recentes",
            value: tokenStats.entregasFalhas,
            helper: "Monitore para agir antes de impacto no cliente final",
            icon: <Activity size={18} />,
            tone: tokenStats.entregasFalhas > 0 ? "danger" : "default"
          }
        ]}
      />
      {copyFeedback ? <p className={feedbackClassName(copyFeedback)}>{copyFeedback}</p> : null}

      <AppStepGuide
        title="Base técnica da Fase 1"
        description="Este primeiro corte habilita ecossistema externo. O próximo passo será central de importação e integrações nativas em cima desses eventos."
        items={[
          {
            key: "token",
            label: "Passo 1",
            title: "Emitir token de API",
            description: "Use um token por integração externa. Prefira expiração e menor escopo possível.",
            actionLabel: "Configurar abaixo"
          },
          {
            key: "webhook",
            label: "Passo 2",
            title: "Registrar webhook",
            description: "Cadastre a URL de destino e selecione apenas os eventos necessários.",
            actionLabel: "Cadastrar abaixo"
          },
          {
            key: "test",
            label: "Passo 3",
            title: "Testar a entrega",
            description: "Dispare um evento de teste e verifique status, payload e resposta do destino.",
            actionLabel: "Validar abaixo"
          }
        ]}
      />

      <article className="integration-card">
        <div className="integration-card__header">
          <div>
            <p className="integration-card__kicker">Saúde</p>
            <h2>Saúde dos webhooks</h2>
          </div>
          <div className="integration-card__actions">
            <label className="integration-field integration-field--compact">
              <span>Janela</span>
              <select
                value={String(healthWindowHours)}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setHealthWindowHours(next);
                  void loadWebhookHealth(next);
                }}
              >
                <option value="24">24h</option>
                <option value="72">72h</option>
                <option value="168">7 dias</option>
              </select>
            </label>
            <button type="button" className="btn-secondary" onClick={() => void loadWebhookHealth()} disabled={healthLoading}>
              <RefreshCw size={16} />
              {healthLoading ? "Atualizando..." : "Atualizar saúde"}
            </button>
          </div>
        </div>

        <div className="integrations-grid integrations-grid--health">
          <article className="integration-health-metric">
            <small>Taxa de sucesso</small>
            <strong>{Math.round((webhookHealth?.summary?.successRate ?? 0) * 100)}%</strong>
            <span>{webhookHealth?.summary?.totalAttempts ?? 0} tentativas no período</span>
          </article>
          <article className="integration-health-metric">
            <small>Webhooks críticos</small>
            <strong>{webhookHealth?.summary?.criticalCount ?? 0}</strong>
            <span>Falha alta e recorrente</span>
          </article>
          <article className="integration-health-metric">
            <small>Webhooks em atenção</small>
            <strong>{webhookHealth?.summary?.warningCount ?? 0}</strong>
            <span>Falhas pontuais no período</span>
          </article>
          <article className="integration-health-metric">
            <small>Webhooks ativos</small>
            <strong>{webhookHealth?.summary?.activeWebhooks ?? webhooks.filter((item) => item.isActive).length}</strong>
            <span>{webhookHealth?.summary?.totalWebhooks ?? webhooks.length} cadastrados</span>
          </article>
        </div>

        {!healthError && !healthLoading && (webhookHealth?.alerts?.length ?? 0) > 0 ? (
          <div className="integration-health-alerts">
            {(webhookHealth?.alerts ?? []).slice(0, 3).map((alertItem) => (
              <article key={alertItem.id} className={`integration-health-alert is-${alertItem.level.toLowerCase()}`}>
                <div>
                  <strong>{alertItem.title}</strong>
                  <p>{alertItem.message}</p>
                  <small>{alertItem.recommendedAction}</small>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSelectedWebhookId(alertItem.webhookId);
                    void loadDeliveries(alertItem.webhookId, 10);
                  }}
                >
                  Ver entregas
                </button>
              </article>
            ))}
          </div>
        ) : null}

        {healthError ? <AppStateCard title="Falha ao carregar saúde dos webhooks" description={healthError} tone="danger" /> : null}
        {!healthError && healthLoading ? <p className="integration-muted">Carregando saúde dos webhooks...</p> : null}
        {!healthError && !healthLoading && webhookHealth && !webhookHealth.webhooks.length ? (
          <p className="integration-muted">Ainda não há webhooks para consolidar saúde.</p>
        ) : null}

        {!healthError && !healthLoading && webhookHealth?.webhooks?.length ? (
          <div className="integration-list">
            {webhookHealth.webhooks.slice(0, 8).map((item) => (
              <article key={item.id} className="integration-row-card">
                <div className="integration-row-card__main">
                  <strong>{item.name}</strong>
                  <p>
                    {PROVIDER_LABELS[item.provider] ?? item.provider} · {item.attempts} tentativas · {item.failedCount} falhas
                  </p>
                  <small>
                    Última falha: {formatDateTime(item.lastFailureAt)} · Último disparo: {formatDateTime(item.lastTriggeredAt)}
                  </small>
                </div>
                <div className="integration-row-card__side integration-row-card__side--stack">
                  <span className={`integration-health-pill is-${item.level.toLowerCase()}`}>{WEBHOOK_HEALTH_LABELS[item.level]}</span>
                  <small>{Math.round(item.successRate * 100)}% sucesso</small>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </article>

      <article className="integration-card">
        <div className="integration-card__header">
          <div>
            <p className="integration-card__kicker">Inbound</p>
            <h2>Webhook estruturado para Kanban</h2>
          </div>
          <Webhook size={18} />
        </div>

        <div className="integration-secret-card">
          <div>
            <strong>Endpoint de upsert</strong>
            <small>Use um token de API em `Authorization: Bearer ...` para criar ou atualizar cards externos por `externalKey`.</small>
            <code>{inboundKanbanUrl}</code>
          </div>
          <button type="button" className="btn-secondary" onClick={() => void handleCopy(inboundKanbanUrl, "URL do endpoint")}>
            <Copy size={16} />
            Copiar URL
          </button>
        </div>

        <div className="integration-field">
          <span>Payload base</span>
          <code className="integration-code-block">{inboundSamplePayload}</code>
        </div>
        <div className="integration-card__actions">
          <button type="button" className="btn-secondary" onClick={() => void handleCopy(inboundSamplePayload, "Payload base")}>
            <Copy size={16} />
            Copiar payload
          </button>
        </div>
      </article>

      {pageError ? <AppStateCard title="Falha ao carregar integrações" description={pageError} tone="danger" /> : null}

      <article className="integration-card">
        <div className="integration-card__header">
          <div>
            <p className="integration-card__kicker">Nativo</p>
            <h2>Slack</h2>
          </div>
          <MessageSquareShare size={18} />
        </div>

        <div className="integration-form-grid">
          <label className="integration-field">
            <span>Nome da conexão</span>
            <input value={slackName} onChange={(event) => setSlackName(event.target.value)} placeholder="Slack do PMO" />
          </label>
          <label className="integration-field">
            <span>Status</span>
            <select value={slackIsActive ? "active" : "paused"} onChange={(event) => setSlackIsActive(event.target.value === "active")}>
              <option value="active">Ativo</option>
              <option value="paused">Pausado</option>
            </select>
          </label>
        </div>

        <label className="integration-field">
          <span>Webhook do Slack</span>
          <input
            value={slackWebhookUrl}
            onChange={(event) => setSlackWebhookUrl(event.target.value)}
            placeholder={slackConnection?.webhookPreview ?? "https://hooks.slack.com/services/..."}
          />
          <small>Se já existe uma conexão salva, deixe vazio para manter o webhook atual.</small>
        </label>

        <div className="integration-field">
          <div className="integration-field__header">
            <span>Eventos enviados ao Slack</span>
            <div className="integration-field__tools">
              <button
                type="button"
                className="integration-tool-button"
                onClick={() => setSlackEvents([...catalogEventNames])}
                disabled={!catalogEventNames.length || slackEvents.length >= catalogEventNames.length}
              >
                Selecionar todos
              </button>
              <button
                type="button"
                className="integration-tool-button"
                onClick={() => setSlackEvents([])}
                disabled={!slackEvents.length}
              >
                Limpar
              </button>
            </div>
          </div>
          <div className="integration-checklist">
            {catalogEvents.map((eventItem) => {
              const isSelected = slackEvents.includes(eventItem.eventName);
              return (
                <label key={eventItem.eventName} className={`integration-checklist__item ${isSelected ? "is-checked" : ""}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleEventSelection(eventItem.eventName, slackEvents, setSlackEvents)}
                  />
                  <div className="integration-checklist__content">
                    <span>{formatScopeLabel(eventItem.eventName)}</span>
                    <small>{eventItem.description?.trim() || eventItem.eventName}</small>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="integration-card__actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => void handleSaveSlack()}
            disabled={slackLoading || !slackEvents.length || (!slackConnection && !slackWebhookUrl.trim())}
          >
            {slackLoading ? "Salvando..." : "Salvar Slack"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void handleTestSlack()}
            disabled={slackTesting || !slackConnection}
          >
            <SendHorizontal size={16} />
            {slackTesting ? "Testando..." : "Testar"}
          </button>
          {slackFeedback ? <p className={feedbackClassName(slackFeedback)}>{slackFeedback}</p> : null}
        </div>

        {slackConnection ? (
          <div className="integration-secret-card">
            <div>
              <strong>Conexão atual</strong>
              <small>
                Último teste: {formatDateTime(slackConnection.lastValidatedAt)} · Último disparo:{" "}
                {formatDateTime(slackConnection.lastTriggeredAt)}
              </small>
              <code>{slackConnection.webhookPreview ?? "Webhook configurado"}</code>
            </div>
            <span
              className={`integration-status-badge is-${
                slackConnection.lastValidationStatus === "FAILED"
                  ? "failed"
                  : slackConnection.lastValidationStatus === "SUCCESS"
                  ? "success"
                  : "pending"
              }`}
            >
              {slackConnection.lastValidationStatus === "FAILED" ? <XCircle size={14} /> : null}
              {slackConnection.lastValidationStatus === "SUCCESS" ? <CheckCircle2 size={14} /> : null}
              {slackConnection.lastValidationStatus === "FAILED"
                ? "Falha"
                : slackConnection.lastValidationStatus === "SUCCESS"
                ? "Saudável"
                : "Sem teste"}
            </span>
          </div>
        ) : (
          <p className="integration-muted">Nenhuma conexão Slack salva nesta organização.</p>
        )}
      </article>

      <article className="integration-card">
        <div className="integration-card__header">
          <div>
            <p className="integration-card__kicker">Interno</p>
            <h2>Alertas por e-mail</h2>
          </div>
          <Mail size={18} />
        </div>

        <div className="integration-form-grid">
          <label className="integration-field">
            <span>Nome da conexão</span>
            <input
              value={emailAlertsName}
              onChange={(event) => setEmailAlertsName(event.target.value)}
              placeholder="Alertas operacionais"
            />
          </label>
          <label className="integration-field">
            <span>Status</span>
            <select
              value={emailAlertsIsActive ? "active" : "paused"}
              onChange={(event) => setEmailAlertsIsActive(event.target.value === "active")}
            >
              <option value="active">Ativo</option>
              <option value="paused">Pausado</option>
            </select>
          </label>
        </div>

        <label className="integration-field">
          <span>Destinatários</span>
          <input
            value={emailAlertsRecipientsText}
            onChange={(event) => setEmailAlertsRecipientsText(event.target.value)}
            placeholder="ops@empresa.com, pmo@empresa.com"
          />
          <small>
            Separe e-mails por vírgula. Se ficar vazio, usa admins/owners da organização. Se existir
            `SMTP_ALERT_RECIPIENTS`, ele tem prioridade.
          </small>
        </label>

        <div className="integration-card__actions">
          <button type="button" className="btn-primary" onClick={() => void handleSaveEmailAlerts()} disabled={emailAlertsLoading}>
            {emailAlertsLoading ? "Salvando..." : "Salvar alertas"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void handleTestEmailAlerts()}
            disabled={emailAlertsTesting || !(emailAlertsConnection?.smtpConfigured ?? false)}
          >
            <SendHorizontal size={16} />
            {emailAlertsTesting ? "Testando..." : "Testar e-mail"}
          </button>
          {emailAlertsFeedback ? <p className={feedbackClassName(emailAlertsFeedback)}>{emailAlertsFeedback}</p> : null}
        </div>

        <div className="integration-secret-card">
          <div>
            <strong>Canal de notificação</strong>
            <small>
              SMTP: {(emailAlertsConnection?.smtpConfigured ?? false) ? "configurado" : "não configurado"} · Última validação:{" "}
              {formatDateTime(emailAlertsConnection?.lastValidatedAt)} · Último disparo crítico:{" "}
              {formatDateTime(emailAlertsConnection?.lastTriggeredAt)}
            </small>
            <code>
              {parseEmailRecipientsText(emailAlertsRecipientsText).join(", ") ||
                "Sem destinatário explícito (fallback para admins/owners)."}
            </code>
          </div>
          <span
            className={`integration-status-badge is-${
              !(emailAlertsConnection?.smtpConfigured ?? false)
                ? "pending"
                : emailAlertsConnection?.lastValidationStatus === "FAILED"
                ? "failed"
                : emailAlertsConnection?.lastValidationStatus === "SUCCESS"
                ? "success"
                : "pending"
            }`}
          >
            {emailAlertsConnection?.lastValidationStatus === "FAILED" ? <XCircle size={14} /> : null}
            {emailAlertsConnection?.lastValidationStatus === "SUCCESS" ? <CheckCircle2 size={14} /> : null}
            {!(emailAlertsConnection?.smtpConfigured ?? false)
              ? "SMTP pendente"
              : emailAlertsConnection?.lastValidationStatus === "FAILED"
              ? "Falha"
              : emailAlertsConnection?.lastValidationStatus === "SUCCESS"
              ? "Saudável"
              : "Sem teste"}
          </span>
        </div>
      </article>

      <article className="integration-card">
        <div className="integration-card__header">
          <div>
            <p className="integration-card__kicker">Nativo</p>
            <h2>Google Calendar</h2>
          </div>
          <ExternalLink size={18} />
        </div>

        <div className="integration-form-grid">
          <label className="integration-field">
            <span>Nome da conexão</span>
            <input
              value={calendarName}
              onChange={(event) => setCalendarName(event.target.value)}
              placeholder="Calendário executivo"
            />
          </label>
          <label className="integration-field">
            <span>Status</span>
            <select
              value={calendarIsActive ? "active" : "paused"}
              onChange={(event) => setCalendarIsActive(event.target.value === "active")}
            >
              <option value="active">Ativo</option>
              <option value="paused">Pausado</option>
            </select>
          </label>
        </div>

        <div className="integration-form-grid">
          <label className="integration-field">
            <span>Projeto sincronizado</span>
            <select value={calendarProjectId} onChange={(event) => setCalendarProjectId(event.target.value)}>
              <option value="">Selecione um projeto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <div className="integration-field">
            <span>Itens publicados</span>
            <div className="integration-checklist">
              <label className={`integration-checklist__item ${calendarIncludeMilestones ? "is-checked" : ""}`}>
                <input
                  type="checkbox"
                  checked={calendarIncludeMilestones}
                  onChange={() => setCalendarIncludeMilestones((current) => !current)}
                />
                <span>Marcos</span>
              </label>
              <label className={`integration-checklist__item ${calendarIncludeTasks ? "is-checked" : ""}`}>
                <input
                  type="checkbox"
                  checked={calendarIncludeTasks}
                  onChange={() => setCalendarIncludeTasks((current) => !current)}
                />
                <span>Tarefas</span>
              </label>
            </div>
          </div>
        </div>

        <div className="integration-card__actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => void handleSaveCalendar(false)}
            disabled={calendarLoading || !calendarProjectId || (!calendarIncludeTasks && !calendarIncludeMilestones)}
          >
            {calendarLoading ? "Salvando..." : "Salvar Google Calendar"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void handleSaveCalendar(true)}
            disabled={calendarLoading || !calendarConnection}
          >
            <RefreshCw size={16} />
            Regenerar feed
          </button>
          {calendarFeedback ? <p className={feedbackClassName(calendarFeedback)}>{calendarFeedback}</p> : null}
        </div>

        {calendarConnection ? (
          <div className="integration-secret-card">
            <div>
              <strong>Feed ICS</strong>
              <small>
                Projeto:{" "}
                {projects.find((project) => project.id === (calendarConnection.projectId ?? ""))?.name ?? "Projeto configurado"} ·
                Atualizado em {formatDateTime(calendarConnection.updatedAt)}
              </small>
              <code>{calendarFeedUrl ?? "Feed indisponível"}</code>
            </div>
            <button type="button" className="btn-secondary" onClick={() => void handleCopy(calendarFeedUrl, "URL do feed")}>
              <Copy size={16} />
              Copiar URL
            </button>
          </div>
        ) : (
          <p className="integration-muted">Nenhum feed Google Calendar configurado nesta organização.</p>
        )}
      </article>

      <article className="integration-card">
        <div className="integration-card__header">
          <div>
            <p className="integration-card__kicker">Importações</p>
            <h2>Central rápida de importação</h2>
          </div>
          <Activity size={18} />
        </div>

        {!hasProjectContext ? (
          <AppStateCard
            title="Selecione um projeto"
            description="Escolha um projeto específico no cabeçalho para importar EAP ou catálogo de serviços."
            tone="info"
          />
        ) : (
          <>
            <div className="integration-delivery-meta">
              <div>
                <strong>{selectedProject?.name ?? "Projeto selecionado"}</strong>
                <p>As importações desta central são aplicadas diretamente no projeto ativo.</p>
              </div>
            </div>

            <div className="integrations-grid integrations-grid--imports">
              <article className="integration-row-card">
                <div className="integration-row-card__main">
                  <strong>Importar EAP</strong>
                  <p>Planilha `.xlsx` com código, título, datas, dependências e serviços.</p>
                  <small>Usa o mesmo fluxo já validado na tela de EAP.</small>
                </div>
                <div className="integration-row-card__side integration-row-card__side--stack">
                  <input
                    ref={wbsInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    hidden
                    onChange={(event) => void runImport("wbs", event.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => wbsInputRef.current?.click()}
                    disabled={!canImportWbs || wbsImporting}
                  >
                    {wbsImporting ? "Importando..." : "Escolher planilha"}
                  </button>
                  <a className="btn-secondary" href={encodeURI("/Modelo EAP.xlsx")} download="Modelo EAP.xlsx">
                    Baixar modelo
                  </a>
                </div>
              </article>

              <article className="integration-row-card">
                <div className="integration-row-card__main">
                  <strong>Importar catálogo de serviços</strong>
                  <p>Planilha com nome, descrição e horas base para acelerar composição da EAP.</p>
                  <small>Usa o importador operacional do módulo de orçamento.</small>
                </div>
                <div className="integration-row-card__side integration-row-card__side--stack">
                  <input
                    ref={catalogInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    hidden
                    onChange={(event) => void runImport("catalog", event.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => catalogInputRef.current?.click()}
                    disabled={!canImportCatalog || catalogImporting}
                  >
                    {catalogImporting ? "Importando..." : "Escolher planilha"}
                  </button>
                </div>
              </article>

              <article className="integration-row-card">
                <div className="integration-row-card__main">
                  <strong>Importar board do Trello</strong>
                  <p>Arquivo `.json` exportado do board para criar cards diretamente no Kanban do projeto ativo.</p>
                  <small>Mapeia listas para colunas e preserva descrição, prazo e prioridade sugerida.</small>
                </div>
                <div className="integration-row-card__side integration-row-card__side--stack">
                  <input
                    ref={trelloInputRef}
                    type="file"
                    accept=".json,application/json"
                    hidden
                    onChange={(event) => void runImport("trello", event.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => trelloInputRef.current?.click()}
                    disabled={!canImportKanban || trelloImporting}
                  >
                    {trelloImporting ? "Importando..." : "Escolher JSON"}
                  </button>
                </div>
              </article>

              <article className="integration-row-card">
                <div className="integration-row-card__main">
                  <strong>Importar issues do Jira</strong>
                  <p>Arquivo `.csv` ou `.xlsx` exportado do Jira para criar cards diretamente no Kanban do projeto ativo.</p>
                  <small>Usa colunas como Summary, Status, Priority, Description, Due Date e Issue Key.</small>
                </div>
                <div className="integration-row-card__side integration-row-card__side--stack">
                  <input
                    ref={jiraInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    hidden
                    onChange={(event) => void runImport("jira", event.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => jiraInputRef.current?.click()}
                    disabled={!canImportKanban || jiraImporting}
                  >
                    {jiraImporting ? "Importando..." : "Escolher arquivo"}
                  </button>
                </div>
              </article>
            </div>

            {importFeedback ? <p className={feedbackClassName(importFeedback)}>{importFeedback}</p> : null}
            {importError ? <p className="integration-feedback integration-feedback--error">{importError}</p> : null}
          </>
        )}
      </article>

      <article className="integration-card">
        <div className="integration-card__header">
          <div>
            <p className="integration-card__kicker">Histórico</p>
            <h2>Jobs de importação</h2>
          </div>
          <button type="button" className="btn-secondary" onClick={() => void loadPage()} disabled={pageLoading}>
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        {!importJobs.length ? (
          <p className="integration-muted">Nenhuma importação registrada ainda nesta organização.</p>
        ) : (
          <div className="integration-delivery-list">
            {importJobs.map((job) => {
              const summary = job.summary ?? {};
              const created =
                typeof summary.created === "number"
                  ? summary.created
                  : typeof summary.imported === "number"
                  ? summary.imported
                  : 0;
              const updated = typeof summary.updated === "number" ? summary.updated : 0;
              const warningCount = typeof summary.warningCount === "number" ? summary.warningCount : 0;
              const errorCount = typeof summary.errorCount === "number" ? summary.errorCount : 0;
              const jobLabel =
                job.entity === "WBS"
                  ? "Importação de EAP"
                  : job.entity === "SERVICE_CATALOG"
                  ? "Importação de catálogo"
                  : job.entity === "TRELLO_BOARD"
                  ? "Importação do Trello"
                  : job.entity === "JIRA_ISSUES"
                  ? "Importação do Jira"
                  : job.entity;

              return (
                <article key={job.id} className="integration-delivery-item">
                  <div className="integration-delivery-item__main">
                    <strong>{jobLabel}</strong>
                    <small>{job.fileName ?? "Arquivo sem nome"}</small>
                    <small>
                      Criado em {formatDateTime(job.createdAt)} · por{" "}
                      {job.createdBy?.fullName ?? job.createdBy?.email ?? "usuário"}
                    </small>
                  </div>
                  <div className="integration-delivery-item__status">
                    <span className={`integration-status-badge is-${job.status === "SUCCESS" ? "success" : job.status === "FAILED" ? "failed" : "pending"}`}>
                      {job.status === "SUCCESS" ? <CheckCircle2 size={14} /> : null}
                      {job.status === "FAILED" ? <XCircle size={14} /> : null}
                      {job.status === "PROCESSING" ? <Clock3 size={14} /> : null}
                      {job.status === "SUCCESS" ? "Sucesso" : job.status === "FAILED" ? "Falha" : "Processando"}
                    </span>
                    <code>
                      {created} criados · {updated} atualizados · {warningCount} avisos · {errorCount} erros
                    </code>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </article>

      <div className="integrations-grid">
        <article className="integration-card">
          <div className="integration-card__header">
            <div>
              <p className="integration-card__kicker">Tokens</p>
              <h2>Tokens de API</h2>
            </div>
            <ShieldCheck size={18} />
          </div>

          <div className="integration-form-grid">
            <label className="integration-field">
              <span>Nome técnico</span>
              <input value={tokenName} onChange={(event) => setTokenName(event.target.value)} placeholder="ERP, ETL, BI, parceiro..." />
            </label>
            <label className="integration-field">
              <span>Expira em</span>
              <input type="datetime-local" value={tokenExpiresAt} onChange={(event) => setTokenExpiresAt(event.target.value)} />
            </label>
          </div>

          <div className="integration-field">
            <div className="integration-field__header">
              <span>Escopo de eventos</span>
              <div className="integration-field__tools">
                <button
                  type="button"
                  className="integration-tool-button"
                  onClick={() => setTokenScopes([...catalogEventNames])}
                  disabled={!catalogEventNames.length || tokenScopes.length >= catalogEventNames.length}
                >
                  Selecionar todos
                </button>
                <button
                  type="button"
                  className="integration-tool-button"
                  onClick={() => setTokenScopes([])}
                  disabled={!tokenScopes.length}
                >
                  Limpar
                </button>
              </div>
            </div>
            <div className="integration-checklist">
              {catalogEvents.map((eventItem) => {
                const isSelected = tokenScopes.includes(eventItem.eventName);
                return (
                  <label key={eventItem.eventName} className={`integration-checklist__item ${isSelected ? "is-checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleEventSelection(eventItem.eventName, tokenScopes, setTokenScopes)}
                    />
                    <div className="integration-checklist__content">
                      <span>{formatScopeLabel(eventItem.eventName)}</span>
                      <small>{eventItem.description?.trim() || eventItem.eventName}</small>
                    </div>
                  </label>
                );
              })}
            </div>
            <small>Se nada for marcado, o token nasce sem filtro explícito de escopo.</small>
          </div>

          <div className="integration-card__actions">
            <button type="button" className="btn-primary" onClick={() => void handleCreateToken()} disabled={creatingToken || !tokenName.trim()}>
              <KeyRound size={16} />
              {creatingToken ? "Emitindo..." : "Emitir token"}
            </button>
            {tokenFeedback ? <p className={feedbackClassName(tokenFeedback)}>{tokenFeedback}</p> : null}
          </div>

          {latestPlainToken ? (
            <div className="integration-secret-card">
              <div>
                <strong>Token emitido</strong>
                <code>{latestPlainToken}</code>
              </div>
              <button type="button" className="btn-secondary" onClick={() => void handleCopy(latestPlainToken, "Token")}>
                <Copy size={16} />
                Copiar
              </button>
            </div>
          ) : null}

          <div className="integration-list">
            {pageLoading ? <p className="integration-muted">Carregando tokens...</p> : null}
            {!pageLoading && !tokens.length ? <p className="integration-muted">Nenhum token ativo nesta organização.</p> : null}
            {tokens.map((tokenItem) => (
              <article key={tokenItem.id} className="integration-row-card integration-row-card--token">
                <div className="integration-row-card__main">
                  <strong>{tokenItem.name}</strong>
                  <p>
                    {tokenItem.tokenPrefix}...{tokenItem.tokenLastFour}
                  </p>
                  <small>
                    Criado em {formatDateTime(tokenItem.createdAt)} · Último uso {formatDateTime(tokenItem.lastUsedAt)}
                  </small>
                  {asStringArray(tokenItem.scopes).length ? (
                    <div className="integration-chip-list">
                      {asStringArray(tokenItem.scopes).map((scope) => (
                        <span key={scope} className="integration-chip" title={scope}>
                          {formatScopeLabel(scope)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() => void handleRevokeToken(tokenItem.id)}
                  title="Revogar token"
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        </article>

        <article className="integration-card">
          <div className="integration-card__header">
            <div>
              <p className="integration-card__kicker">Webhooks</p>
              <h2>Saída de eventos</h2>
            </div>
            <Link2 size={18} />
          </div>

          <div className="integration-form-grid">
            <label className="integration-field">
              <span>Nome</span>
              <input value={webhookName} onChange={(event) => setWebhookName(event.target.value)} placeholder="ERP, automação, middleware..." />
            </label>
            <label className="integration-field">
              <span>Provedor</span>
              <select value={webhookProvider} onChange={(event) => setWebhookProvider(event.target.value)}>
                {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="integration-form-grid">
            <label className="integration-field">
              <span>URL de destino</span>
              <input
                value={webhookTargetUrl}
                onChange={(event) => setWebhookTargetUrl(event.target.value)}
                placeholder="https://sistema.externo.com/webhooks/gp"
              />
            </label>
            <label className="integration-field">
              <span>Segredo opcional</span>
              <input value={webhookSecret} onChange={(event) => setWebhookSecret(event.target.value)} placeholder="Se vazio, o sistema gera um segredo." />
              <small>
                O destino recebe assinatura HMAC nos headers `X-Webhook-Signature-V1` + timestamp e também `X-Webhook-Signature` (legado).
              </small>
            </label>
          </div>

          <div className="integration-field">
            <div className="integration-field__header">
              <span>Eventos emitidos</span>
              <div className="integration-field__tools">
                <button
                  type="button"
                  className="integration-tool-button"
                  onClick={() => setWebhookEvents([...catalogEventNames])}
                  disabled={!catalogEventNames.length || webhookEvents.length >= catalogEventNames.length}
                >
                  Selecionar todos
                </button>
                <button
                  type="button"
                  className="integration-tool-button"
                  onClick={() => setWebhookEvents([])}
                  disabled={!webhookEvents.length}
                >
                  Limpar
                </button>
              </div>
            </div>
            <div className="integration-checklist">
              {catalogEvents.map((eventItem) => {
                const isSelected = webhookEvents.includes(eventItem.eventName);
                return (
                  <label key={eventItem.eventName} className={`integration-checklist__item ${isSelected ? "is-checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleEventSelection(eventItem.eventName, webhookEvents, setWebhookEvents)}
                    />
                    <div className="integration-checklist__content">
                      <span>{formatScopeLabel(eventItem.eventName)}</span>
                      <small>{eventItem.description?.trim() || eventItem.eventName}</small>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="integration-card__actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => void handleCreateWebhook()}
              disabled={creatingWebhook || !webhookName.trim() || !webhookTargetUrl.trim() || !webhookEvents.length}
            >
              <Webhook size={16} />
              {creatingWebhook ? "Salvando..." : "Cadastrar webhook"}
            </button>
            {webhookFeedback ? <p className={feedbackClassName(webhookFeedback)}>{webhookFeedback}</p> : null}
          </div>

          <div className="integration-list">
            {pageLoading ? <p className="integration-muted">Carregando webhooks...</p> : null}
            {!pageLoading && !webhooks.length ? <p className="integration-muted">Nenhum webhook cadastrado nesta organização.</p> : null}
            {webhooks.map((webhookItem) => (
              <article
                key={webhookItem.id}
                className={`integration-row-card ${selectedWebhookId === webhookItem.id ? "is-selected" : ""} ${
                  webhookItem.isActive ? "" : "is-inactive"
                }`}
              >
                <button type="button" className="integration-row-card__body" onClick={() => setSelectedWebhookId(webhookItem.id)}>
                  <strong>{webhookItem.name}</strong>
                  <p>{webhookItem.targetUrl}</p>
                  <small>
                    {PROVIDER_LABELS[webhookItem.provider] ?? webhookItem.provider} · {webhookItem.isActive ? "Ativo" : "Pausado"}
                  </small>
                  <div className="integration-chip-list">
                    {webhookItem.eventNames.map((eventName) => (
                      <span key={eventName} className="integration-chip" title={eventName}>
                        {formatScopeLabel(eventName)}
                      </span>
                    ))}
                  </div>
                </button>
                <div className="integration-row-card__side">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => void handleToggleWebhook(webhookItem)}
                    title={webhookItem.isActive ? "Pausar webhook" : "Ativar webhook"}
                  >
                    {webhookItem.isActive ? <Clock3 size={16} /> : <CheckCircle2 size={16} />}
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => void handleTestWebhook(webhookItem.id)}
                    title="Disparar teste"
                  >
                    <SendHorizontal size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button danger"
                    onClick={() => void handleDeleteWebhook(webhookItem.id)}
                    title="Excluir webhook"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>
      </div>

      <article className="integration-card integration-card--deliveries">
        <div className="integration-card__header">
          <div>
            <p className="integration-card__kicker">Trazabilidade</p>
            <h2>Entregas do webhook</h2>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void loadDeliveries(selectedWebhookId, deliveryLimit)}
            disabled={!selectedWebhookId || deliveryLoading}
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        {!selectedWebhook ? (
          <AppStateCard
            title="Selecione um webhook"
            description="Ao escolher um destino acima, a trilha das últimas entregas aparece aqui com status e resposta."
            tone="info"
          />
        ) : (
          <>
            <div className="integration-delivery-meta">
              <div>
                <strong>{selectedWebhook.name}</strong>
                <p>{selectedWebhook.targetUrl}</p>
              </div>
              <a href={selectedWebhook.targetUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                <ExternalLink size={16} />
                Abrir URL
              </a>
            </div>
            <div className="integration-delivery-filters">
              <label className="integration-field">
                <span>Ordem</span>
                <select value={deliverySort} onChange={(event) => setDeliverySort(event.target.value as "newest" | "oldest")}>
                  <option value="newest">Mais recentes primeiro</option>
                  <option value="oldest">Mais antigas primeiro</option>
                </select>
              </label>
              <label className="integration-field">
                <span>Status</span>
                <select
                  value={deliveryStatusFilter}
                  onChange={(event) => setDeliveryStatusFilter(event.target.value as "all" | WebhookDelivery["status"])}
                >
                  <option value="all">Todos</option>
                  <option value="SUCCESS">Sucesso</option>
                  <option value="FAILED">Falha</option>
                  <option value="PENDING">Pendente</option>
                </select>
              </label>
              <label className="integration-field">
                <span>Evento</span>
                <input
                  value={deliveryEventFilter}
                  onChange={(event) => setDeliveryEventFilter(event.target.value)}
                  placeholder="Filtrar por nome do evento"
                />
              </label>
            </div>
            <div className="integration-card__actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleExportDeliveriesCsv}
                disabled={!filteredDeliveries.length}
              >
                <Download size={16} />
                Exportar CSV
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void handleRetryFilteredFailures()}
                disabled={retryingBatch || !filteredDeliveries.some((delivery) => delivery.status === "FAILED")}
              >
                <RefreshCw size={16} />
                {retryingBatch ? "Reenviando falhas..." : "Reenviar falhas filtradas"}
              </button>
            </div>

            {deliveryError ? <AppStateCard title="Falha ao carregar entregas" description={deliveryError} tone="danger" /> : null}
            {deliveryLoading ? <p className="integration-muted">Carregando entregas...</p> : null}
            {!deliveryLoading && !filteredDeliveries.length ? (
              <p className="integration-muted">
                {deliveries.length
                  ? "Nenhuma entrega corresponde aos filtros atuais."
                  : "Ainda não há entregas registradas para esse webhook."}
              </p>
            ) : null}
            <div className="integration-delivery-list">
              {filteredDeliveries.map((delivery) => (
                <article key={delivery.id} className={`integration-delivery-item is-${delivery.status.toLowerCase()}`}>
                  <div className="integration-delivery-item__main">
                    <strong>{delivery.eventName}</strong>
                    <small>Criado em {formatDateTime(delivery.createdAt)}</small>
                    <small>Entregue em {formatDateTime(delivery.deliveredAt)}</small>
                  </div>
                  <div className="integration-delivery-item__status">
                    <span className={`integration-status-badge is-${delivery.status.toLowerCase()}`}>
                      {delivery.status === "SUCCESS" ? <CheckCircle2 size={14} /> : null}
                      {delivery.status === "FAILED" ? <XCircle size={14} /> : null}
                      {delivery.status === "PENDING" ? <Clock3 size={14} /> : null}
                      {DELIVERY_STATUS_LABELS[delivery.status]}
                    </span>
                    <code>{delivery.responseStatus ? `HTTP ${delivery.responseStatus}` : "Sem resposta"}</code>
                    {delivery.status === "FAILED" ? (
                      <button
                        type="button"
                        className="btn-secondary integration-delivery-retry"
                        onClick={() => void handleRetryDelivery(delivery.id)}
                        disabled={retryingDeliveryId === delivery.id}
                      >
                        <RefreshCw size={14} />
                        {retryingDeliveryId === delivery.id ? "Reenviando..." : "Reenviar"}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
            {selectedWebhook && deliveries.length >= deliveryLimit && deliveryLimit < 100 ? (
              <div className="integration-card__actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const nextLimit = Math.min(deliveryLimit + 10, 100);
                    setDeliveryLimit(nextLimit);
                    void loadDeliveries(selectedWebhook.id, nextLimit);
                  }}
                  disabled={deliveryLoading}
                >
                  {deliveryLoading ? "Carregando..." : "Carregar mais entregas"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </article>
    </section>
  );
};

export default IntegrationsPage;
