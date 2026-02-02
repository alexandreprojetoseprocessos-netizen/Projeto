import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Building2, Calendar, Check, Crown, FolderKanban, HardDrive, Sparkles, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { canManageBilling, type OrgRole } from "../components/permissions";
import { apiUrl } from "../config/api";
import { PLAN_DEFINITIONS, formatBillingPrice, formatMonthlyPrice, getPlanDefinition } from "../config/plans";

type Subscription = {
  id: string;
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "PENDING";
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  billingCycle?: string | null;
  currentPeriodEnd?: string | null;
  startedAt?: string | null;
  expiresAt?: string | null;
  product?: {
    code: string;
    name: string;
    priceCents: number;
    billingPeriod: string;
  } | null;
};

type LimitsInfo = {
  organizationLimits?: {
    planCode: string | null;
    max: number | null;
    used: number;
    remaining: number | null;
  };
  projectLimits?: {
    planCode: string | null;
    max: number | null;
    used: number;
    remaining: number | null;
    perOrganization?: number | null;
  };
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Ativo",
  PAST_DUE: "Em atraso",
  CANCELED: "Cancelado",
  PENDING: "Processando"
};

const formatLimit = (value: number | null) => (value === null ? "Ilimitado" : value.toString());

const calcPercent = (used: number, max: number | null) => {
  if (!max || max <= 0) return 0;
  return Math.min(100, Math.round((used / max) * 100));
};

const formatBytes = (value: number) => {
  if (!value || Number.isNaN(value)) return "0 MB";
  const mb = value / (1024 * 1024);
  if (mb < 1) return "0,1 MB";
  return `${mb.toFixed(1).replace(".", ",")} MB`;
};

const PlanPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { currentOrgRole, members, attachments, selectedProject } = useOutletContext<DashboardOutletContext>();
  const orgRole = (currentOrgRole ?? "MEMBER") as OrgRole;
  const canEditBilling = canManageBilling(orgRole);

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [limits, setLimits] = useState<LimitsInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const loadSubscription = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl("/subscriptions/me"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message ?? "Falha ao carregar assinatura");
      }
      setSubscription(body.subscription ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar assinatura");
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const loadLimits = async () => {
    if (!token) return;
    try {
      const response = await fetch(apiUrl("/me"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) return;
      setLimits({
        organizationLimits: body?.organizationLimits,
        projectLimits: body?.projectLimits
      });
    } catch {
      setLimits(null);
    }
  };

  useEffect(() => {
    loadSubscription();
    loadLimits();
  }, [token]);

  const handleChangePlan = async (planCode: string) => {
    if (!token) return;
    setActionError(null);
    setChangingPlan(true);
    try {
      const response = await fetch(apiUrl("/subscriptions/change-plan"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ planCode })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message ?? "Não foi possível alterar o plano");
      }
      setSubscription(body.subscription ?? null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Não foi possível alterar o plano");
    } finally {
      setChangingPlan(false);
    }
  };

  const handleCancel = async () => {
    if (!token) return;
    setActionError(null);
    setCanceling(true);
    try {
      const response = await fetch(apiUrl("/subscriptions/cancel"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message ?? "Não foi possível cancelar a assinatura");
      }
      setSubscription(body.subscription ?? null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Não foi possível cancelar a assinatura");
    } finally {
      setCanceling(false);
    }
  };

  const product = subscription?.product;
  const planDefinition = useMemo(() => getPlanDefinition(product?.code), [product?.code]);
  const price = useMemo(
    () => formatBillingPrice(product?.priceCents, product?.billingPeriod),
    [product]
  );
  const statusText = subscription?.status ? statusLabel[subscription.status] ?? subscription.status : "-";
  const periodEnd = subscription?.currentPeriodEnd ?? subscription?.expiresAt ?? null;

  const orgUsed = limits?.organizationLimits?.used ?? 0;
  const orgMax = limits?.organizationLimits?.max ?? null;
  const orgPercent = calcPercent(orgUsed, orgMax);

  const projectUsed = limits?.projectLimits?.used ?? 0;
  const projectMax = limits?.projectLimits?.max ?? null;
  const projectPercent = calcPercent(projectUsed, projectMax);

  const membersCount = members?.length ?? 0;
  const membersPercent = 0;

  const storageBytes = useMemo(() => {
    if (!attachments?.length) return 0;
    return attachments.reduce((acc, item) => acc + (item.fileSize ?? 0), 0);
  }, [attachments]);

  const storageLabel = formatBytes(storageBytes);

  const planCards = Object.values(PLAN_DEFINITIONS);
  const selectedProjectName = selectedProject?.projectName ?? selectedProject?.name ?? "Projeto atual";

  return (
    <div className="plan-page-modern">
      <section className="plan-hero-card">
        <div className="plan-hero-left">
          <div className="plan-hero-icon">
            <Crown size={22} />
          </div>
          <div>
            <div className="plan-hero-title">
              <h2>{product?.name ?? planDefinition.name}</h2>
              <span className={`plan-status-badge status-${(subscription?.status ?? "none").toLowerCase()}`}>
                {statusText}
              </span>
            </div>
            <p className="plan-hero-price">{price}</p>
          </div>
        </div>
        <div className="plan-hero-actions">
          <div className="plan-hero-meta">
            <span>Próxima cobrança</span>
            <strong>{periodEnd ? new Date(periodEnd).toLocaleDateString("pt-BR") : "-"}</strong>
          </div>
          <button
            type="button"
            className="plan-hero-button"
            disabled={!canEditBilling}
            onClick={() => navigate("/checkout")}
          >
            <Calendar size={16} /> Gerenciar pagamento
          </button>
        </div>
      </section>

      <section className="plan-usage-grid">
        <article className="plan-usage-card">
          <div className="plan-usage-header">
            <span className="plan-usage-icon is-blue">
              <Building2 size={16} />
            </span>
            <span>Organizações</span>
          </div>
          <div className="plan-usage-value">
            {orgUsed} de {formatLimit(orgMax)}
          </div>
          <div className="plan-usage-progress">
            <div className="plan-usage-bar" style={{ width: `${orgPercent}%` }} />
          </div>
          <div className="plan-usage-percent">{orgPercent}%</div>
        </article>

        <article className="plan-usage-card">
          <div className="plan-usage-header">
            <span className="plan-usage-icon is-green">
              <FolderKanban size={16} />
            </span>
            <span>Projetos</span>
          </div>
          <div className="plan-usage-value">
            {projectUsed} de {formatLimit(projectMax)}
          </div>
          <div className="plan-usage-progress">
            <div className="plan-usage-bar" style={{ width: `${projectPercent}%` }} />
          </div>
          <div className="plan-usage-percent">{projectPercent}%</div>
        </article>

        <article className="plan-usage-card">
          <div className="plan-usage-header">
            <span className="plan-usage-icon is-orange">
              <Users size={16} />
            </span>
            <span>Membros</span>
          </div>
          <div className="plan-usage-value">{membersCount} no {selectedProjectName}</div>
          <div className="plan-usage-progress is-muted">
            <div className="plan-usage-bar" style={{ width: `${membersPercent}%` }} />
          </div>
          <div className="plan-usage-percent">Sem limite</div>
        </article>

        <article className="plan-usage-card">
          <div className="plan-usage-header">
            <span className="plan-usage-icon is-purple">
              <HardDrive size={16} />
            </span>
            <span>Armazenamento</span>
          </div>
          <div className="plan-usage-value">{storageLabel}</div>
          <div className="plan-usage-progress is-muted">
            <div className="plan-usage-bar" style={{ width: "15%" }} />
          </div>
          <div className="plan-usage-percent">Sem limite</div>
        </article>
      </section>

      <section className="plan-compare">
        <header>
          <h3>Comparar planos</h3>
        </header>
        <div className="plan-compare-grid">
          {planCards.map((plan) => {
            const isCurrent = plan.code === product?.code;
            const isRecommended = plan.code === "BUSINESS";
            const currentPrice = product?.priceCents ?? planDefinition.priceCents;
            const isUpgrade = plan.priceCents > currentPrice;
            const actionLabel = isCurrent
              ? "Plano atual"
              : isUpgrade
              ? "Fazer upgrade"
              : "Fazer downgrade";
            return (
              <article
                key={plan.code}
                className={`plan-compare-card ${isCurrent ? "is-current" : ""} ${isRecommended ? "is-recommended" : ""}`}
              >
                {isRecommended && <span className="plan-compare-badge">Recomendado</span>}
                <div className="plan-compare-header">
                  <h4>{plan.displayName}</h4>
                  {isCurrent && (
                    <span className="plan-compare-current">
                      <Check size={14} />
                    </span>
                  )}
                </div>
                <p className="plan-compare-subtext">{plan.marketing.summary}</p>
                <div className="plan-compare-price">
                  {formatMonthlyPrice(plan.priceCents)}
                </div>
                <ul className="plan-compare-features">
                  {plan.marketing.features.map((feature) => (
                    <li key={feature}>
                      <Check size={14} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="plan-compare-button"
                  disabled={!canEditBilling || changingPlan || isCurrent}
                  onClick={() => handleChangePlan(plan.code)}
                >
                  {actionLabel}
                </button>
              </article>
            );
          })}
        </div>
        {actionError && <p className="error-text">{actionError}</p>}
      </section>

      <section className="plan-invoices">
        <header className="plan-invoices-header">
          <h3>Histórico de faturas</h3>
          <button type="button" className="plan-invoices-button" disabled>
            <Calendar size={16} /> Ver todas
          </button>
        </header>
        <div className="plan-invoices-list">
          <div className="plan-invoices-empty">
            <Sparkles size={20} />
            <div>
              <strong>Nenhuma fatura registrada</strong>
              <p>Assim que houver cobranças, elas aparecerão aqui.</p>
            </div>
          </div>
        </div>
      </section>

      {loading && <p className="muted">Carregando informações do plano...</p>}
      {error && <p className="error-text">{error}</p>}

      {subscription?.status === "CANCELED" && (
        <div className="warning-box">
          Sua assinatura está cancelada. Para voltar a usar o sistema, escolha um plano novamente.
          <button className="secondary-button" type="button" onClick={() => navigate("/checkout")}> 
            Reativar assinatura
          </button>
        </div>
      )}

      {canEditBilling && subscription?.status !== "CANCELED" && (
        <div className="plan-footer-actions">
          <button
            type="button"
            className="plan-footer-cancel"
            onClick={handleCancel}
            disabled={canceling}
          >
            {canceling ? "Cancelando..." : "Cancelar assinatura"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlanPage;
