import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
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
import { apiRequest, getApiErrorMessage } from "../config/api";
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

export const IntegrationsPage = () => {
  const { token } = useAuth();
  const { selectedOrganizationId, selectedProjectId, selectedProject, currentOrgRole, currentOrgModulePermissions } =
    useOutletContext<DashboardOutletContext>();
  const orgRole = (currentOrgRole ?? "MEMBER") as OrgRole;
  const canManage = canManageOrganizationSettings(orgRole);
  const canImportWbs = canAccessModule(orgRole, currentOrgModulePermissions, "eap", "create");
  const canImportCatalog = canAccessModule(orgRole, currentOrgModulePermissions, "budget", "create");

  const [catalogEvents, setCatalogEvents] = useState<CatalogEvent[]>([]);
  const [tokens, setTokens] = useState<ApiTokenSummary[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookSummary[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);

  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

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
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [wbsImporting, setWbsImporting] = useState(false);
  const [catalogImporting, setCatalogImporting] = useState(false);

  const wbsInputRef = useRef<HTMLInputElement | null>(null);
  const catalogInputRef = useRef<HTMLInputElement | null>(null);

  const headers = useMemo(
    () => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(selectedOrganizationId ? { "X-Organization-Id": selectedOrganizationId } : {})
    }),
    [selectedOrganizationId, token]
  );

  const loadPage = useCallback(async () => {
    if (!token || !selectedOrganizationId || !canManage) {
      setCatalogEvents([]);
      setTokens([]);
      setWebhooks([]);
      setPageError(null);
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setPageError(null);
    try {
      const [catalogBody, tokenBody, webhookBody, slackBody] = await Promise.all([
        apiRequest<{ events?: CatalogEvent[] }>("/integrations/catalog/events", { headers }),
        apiRequest<{ tokens?: ApiTokenSummary[] }>("/integrations/tokens", { headers }),
        apiRequest<{ webhooks?: WebhookSummary[] }>("/integrations/webhooks", { headers }),
        apiRequest<{ slack?: SlackConnectionSummary | null }>("/integrations/slack", { headers })
      ]);

      const nextCatalog = Array.isArray(catalogBody.events) ? catalogBody.events : [];
      const nextTokens = Array.isArray(tokenBody.tokens) ? tokenBody.tokens : [];
      const nextWebhooks = Array.isArray(webhookBody.webhooks) ? webhookBody.webhooks : [];
      const nextSlack = slackBody.slack ?? null;

      setCatalogEvents(nextCatalog);
      setTokens(nextTokens);
      setWebhooks(nextWebhooks);
      setSlackConnection(nextSlack);
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
      setSelectedWebhookId((current) => {
        if (current && nextWebhooks.some((item) => item.id === current)) return current;
        return nextWebhooks[0]?.id ?? null;
      });
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Falha ao carregar a central de integrações."));
      setCatalogEvents([]);
      setTokens([]);
      setWebhooks([]);
      setSlackConnection(null);
    } finally {
      setPageLoading(false);
    }
  }, [canManage, headers, selectedOrganizationId, token]);

  const loadDeliveries = useCallback(
    async (webhookId: string | null) => {
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
          `/integrations/webhooks/${webhookId}/deliveries?limit=10`,
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
    [canManage, headers, selectedOrganizationId, token]
  );

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    void loadDeliveries(selectedWebhookId);
  }, [loadDeliveries, selectedWebhookId]);

  const selectedWebhook = useMemo(
    () => webhooks.find((item) => item.id === selectedWebhookId) ?? null,
    [selectedWebhookId, webhooks]
  );
  const hasProjectContext = Boolean(selectedProjectId && selectedProjectId !== "all");

  const tokenStats = useMemo(
    () => ({
      tokensAtivos: tokens.length,
      webhooksAtivos: webhooks.filter((item) => item.isActive).length,
      entregasOk: deliveries.filter((item) => item.status === "SUCCESS").length,
      entregasFalhas: deliveries.filter((item) => item.status === "FAILED").length
    }),
    [deliveries, tokens.length, webhooks]
  );

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

  const handleCopy = async (value: string | null) => {
    if (!value || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(value);
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

  const runImport = async (kind: "wbs" | "catalog", file: File | null) => {
    if (!token || !selectedOrganizationId || !hasProjectContext || !selectedProjectId || !file) return;

    setImportError(null);
    setImportFeedback(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", selectedProjectId);

    if (kind === "wbs") {
      setWbsImporting(true);
    } else {
      setCatalogImporting(true);
    }

    try {
      const endpoint =
        kind === "wbs" ? `/wbs/import?projectId=${selectedProjectId}` : `/service-catalog/import?projectId=${selectedProjectId}`;
      const body = await apiRequest<Record<string, unknown>>(endpoint, {
        method: "POST",
        headers,
        body: formData
      });

      const imported = typeof body.imported === "number" ? body.imported : typeof body.created === "number" ? body.created : null;
      const updated = typeof body.updated === "number" ? body.updated : 0;
      const warnings = Array.isArray(body.warnings) ? body.warnings.length : 0;
      const kindLabel = kind === "wbs" ? "EAP" : "catálogo";

      setImportFeedback(
        imported !== null
          ? `Importação de ${kindLabel} concluída: ${imported} criados, ${updated} atualizados, ${warnings} avisos.`
          : `Importação de ${kindLabel} concluída com sucesso.`
      );
    } catch (error) {
      setImportError(getApiErrorMessage(error, `Falha ao importar ${kind === "wbs" ? "EAP" : "catálogo"}.`));
    } finally {
      if (kind === "wbs") {
        setWbsImporting(false);
        if (wbsInputRef.current) wbsInputRef.current.value = "";
      } else {
        setCatalogImporting(false);
        if (catalogInputRef.current) catalogInputRef.current.value = "";
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
            helper: selectedWebhook ? `Últimas 10 do webhook ${selectedWebhook.name}` : "Selecione um webhook",
            icon: <CheckCircle2 size={18} />,
            tone: "success"
          },
          {
            label: "Falhas recentes",
            value: tokenStats.entregasFalhas,
            helper: "Use isso para rastrear retries e destinos inválidos",
            icon: <Activity size={18} />,
            tone: tokenStats.entregasFalhas > 0 ? "danger" : "default"
          }
        ]}
      />

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
          <span>Eventos enviados ao Slack</span>
          <div className="integration-checklist">
            {catalogEvents.map((eventItem) => (
              <label key={eventItem.eventName} className="integration-checklist__item">
                <input
                  type="checkbox"
                  checked={slackEvents.includes(eventItem.eventName)}
                  onChange={() => toggleEventSelection(eventItem.eventName, slackEvents, setSlackEvents)}
                />
                <span>{eventItem.eventName}</span>
              </label>
            ))}
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
          {slackFeedback ? <p className="integration-feedback">{slackFeedback}</p> : null}
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
            </div>

            {importFeedback ? <p className="integration-feedback">{importFeedback}</p> : null}
            {importError ? <p className="integration-feedback integration-feedback--error">{importError}</p> : null}
          </>
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
            <span>Escopo de eventos</span>
            <div className="integration-checklist">
              {catalogEvents.map((eventItem) => (
                <label key={eventItem.eventName} className="integration-checklist__item">
                  <input
                    type="checkbox"
                    checked={tokenScopes.includes(eventItem.eventName)}
                    onChange={() => toggleEventSelection(eventItem.eventName, tokenScopes, setTokenScopes)}
                  />
                  <span>{formatScopeLabel(eventItem.eventName)}</span>
                </label>
              ))}
            </div>
            <small>Se nada for marcado, o token nasce sem filtro explícito de escopo.</small>
          </div>

          <div className="integration-card__actions">
            <button type="button" className="btn-primary" onClick={() => void handleCreateToken()} disabled={creatingToken || !tokenName.trim()}>
              <KeyRound size={16} />
              {creatingToken ? "Emitindo..." : "Emitir token"}
            </button>
            {tokenFeedback ? <p className="integration-feedback">{tokenFeedback}</p> : null}
          </div>

          {latestPlainToken ? (
            <div className="integration-secret-card">
              <div>
                <strong>Token emitido</strong>
                <code>{latestPlainToken}</code>
              </div>
              <button type="button" className="btn-secondary" onClick={() => void handleCopy(latestPlainToken)}>
                <Copy size={16} />
                Copiar
              </button>
            </div>
          ) : null}

          <div className="integration-list">
            {pageLoading ? <p className="integration-muted">Carregando tokens...</p> : null}
            {!pageLoading && !tokens.length ? <p className="integration-muted">Nenhum token ativo nesta organização.</p> : null}
            {tokens.map((tokenItem) => (
              <article key={tokenItem.id} className="integration-row-card">
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
                        <span key={scope} className="integration-chip">
                          {scope}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button type="button" className="icon-button danger" onClick={() => void handleRevokeToken(tokenItem.id)}>
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
            </label>
          </div>

          <div className="integration-field">
            <span>Eventos emitidos</span>
            <div className="integration-checklist">
              {catalogEvents.map((eventItem) => (
                <label key={eventItem.eventName} className="integration-checklist__item">
                  <input
                    type="checkbox"
                    checked={webhookEvents.includes(eventItem.eventName)}
                    onChange={() => toggleEventSelection(eventItem.eventName, webhookEvents, setWebhookEvents)}
                  />
                  <span>{eventItem.eventName}</span>
                </label>
              ))}
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
            {webhookFeedback ? <p className="integration-feedback">{webhookFeedback}</p> : null}
          </div>

          <div className="integration-list">
            {pageLoading ? <p className="integration-muted">Carregando webhooks...</p> : null}
            {!pageLoading && !webhooks.length ? <p className="integration-muted">Nenhum webhook cadastrado nesta organização.</p> : null}
            {webhooks.map((webhookItem) => (
              <article
                key={webhookItem.id}
                className={`integration-row-card ${selectedWebhookId === webhookItem.id ? "is-selected" : ""}`}
              >
                <button type="button" className="integration-row-card__body" onClick={() => setSelectedWebhookId(webhookItem.id)}>
                  <strong>{webhookItem.name}</strong>
                  <p>{webhookItem.targetUrl}</p>
                  <small>
                    {PROVIDER_LABELS[webhookItem.provider] ?? webhookItem.provider} · {webhookItem.isActive ? "Ativo" : "Pausado"}
                  </small>
                  <div className="integration-chip-list">
                    {webhookItem.eventNames.map((eventName) => (
                      <span key={eventName} className="integration-chip">
                        {eventName}
                      </span>
                    ))}
                  </div>
                </button>
                <div className="integration-row-card__side">
                  <button type="button" className="icon-button" onClick={() => void handleToggleWebhook(webhookItem)}>
                    {webhookItem.isActive ? <Clock3 size={16} /> : <CheckCircle2 size={16} />}
                  </button>
                  <button type="button" className="icon-button" onClick={() => void handleTestWebhook(webhookItem.id)}>
                    <SendHorizontal size={16} />
                  </button>
                  <button type="button" className="icon-button danger" onClick={() => void handleDeleteWebhook(webhookItem.id)}>
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
            onClick={() => void loadDeliveries(selectedWebhookId)}
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

            {deliveryError ? <AppStateCard title="Falha ao carregar entregas" description={deliveryError} tone="danger" /> : null}
            {deliveryLoading ? <p className="integration-muted">Carregando entregas...</p> : null}
            {!deliveryLoading && !deliveries.length ? (
              <p className="integration-muted">Ainda não há entregas registradas para esse webhook.</p>
            ) : null}
            <div className="integration-delivery-list">
              {deliveries.map((delivery) => (
                <article key={delivery.id} className="integration-delivery-item">
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
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </article>
    </section>
  );
};

export default IntegrationsPage;
