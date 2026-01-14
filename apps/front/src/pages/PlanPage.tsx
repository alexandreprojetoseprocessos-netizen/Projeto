import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { canManageBilling, type OrgRole } from "../components/permissions";
import { apiUrl } from "../config/api";
import { PLAN_DEFINITIONS, formatBillingPrice, formatMonthlyPrice } from "../config/plans";

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
  ACTIVE: "Ativa",
  PAST_DUE: "Em atraso",
  CANCELED: "Cancelada",
  PENDING: "Processando"
};

const planCards = [
  PLAN_DEFINITIONS.START,
  PLAN_DEFINITIONS.BUSINESS,
  PLAN_DEFINITIONS.ENTERPRISE
].map((plan) => ({
  code: plan.code,
  name: plan.name,
  price: formatMonthlyPrice(plan.priceCents, false),
  summary: plan.marketing.summary
}));

const PlanPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { currentOrgRole } = useOutletContext<DashboardOutletContext>();
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
  const price = useMemo(
    () => formatBillingPrice(product?.priceCents, product?.billingPeriod),
    [product]
  );
  const cycleLabel =
    subscription?.billingCycle === "ANNUAL"
      ? "Anual"
      : subscription?.billingCycle === "MONTHLY"
      ? "Mensal"
      : "-";
  const statusText = subscription?.status ? statusLabel[subscription.status] ?? subscription.status : "-";
  const periodEnd = subscription?.currentPeriodEnd ?? subscription?.expiresAt ?? null;

  return (
    <div className="plan-page">
      <section className="plan-card">
        <p className="eyebrow">Minha assinatura</p>
        <h2>Plano atual</h2>

        {loading ? (
          <p className="muted">Carregando...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : (
          <>
            <div className="plan-summary">
              <div>
                <p className="muted">Plano</p>
                <h3>{product?.name ?? product?.code ?? "Nenhum plano ativo"}</h3>
                <p className="muted">{product?.code ?? "-"}</p>
              </div>
              <div>
                <p className="muted">Preço</p>
                <strong>{price}</strong>
                <p className="muted">Ciclo: {cycleLabel}</p>
              </div>
              <div className="plan-status">
                <span className={`status-chip status-${(subscription?.status ?? "none").toLowerCase()}`}>
                  {statusText}
                </span>
              </div>
            </div>

            <div className="plan-details">
              <p>Início: {subscription?.startedAt ? new Date(subscription.startedAt).toLocaleDateString("pt-BR") : "-"}</p>
              <p>
                Válida até: {periodEnd ? new Date(periodEnd).toLocaleDateString("pt-BR") : "Sem término"}
              </p>
              <p>Pagamento: {subscription?.paymentMethod ?? "Não informado"}</p>
            </div>

            {limits?.organizationLimits && (
              <div className="plan-usage">
                <h4>Limites do plano</h4>
                <div className="plan-usage-grid">
                  <div>
                    <p className="muted">Organizações</p>
                    <strong>
                      {limits.organizationLimits.used} / {limits.organizationLimits.max ?? "Ilimitado"}
                    </strong>
                  </div>
                  <div>
                    <p className="muted">Projetos (total)</p>
                    <strong>
                      {limits.projectLimits?.used ?? 0} / {limits.projectLimits?.max ?? "Ilimitado"}
                    </strong>
                  </div>
                  <div>
                    <p className="muted">Projetos por organização</p>
                    <strong>{limits.projectLimits?.perOrganization ?? "Ilimitado"}</strong>
                  </div>
                </div>
              </div>
            )}

            {subscription?.status === "CANCELED" && (
              <div className="warning-box">
                Sua assinatura está cancelada. Para voltar a usar o sistema, escolha um plano novamente.
                <button className="secondary-button" type="button" onClick={() => navigate("/checkout")}>
                  Reativar assinatura
                </button>
              </div>
            )}

            {actionError && <p className="error-text">{actionError}</p>}

            {canEditBilling ? (
              <div className="plan-actions">
                <div className="plan-switcher">
                  <p className="muted">Trocar plano</p>
                  <div className="plan-options">
                    {planCards.map((plan) => (
                      <button
                        key={plan.code}
                        type="button"
                        className={`secondary-button ${plan.code === product?.code ? "is-active" : ""}`}
                        disabled={changingPlan || plan.code === product?.code}
                        onClick={() => handleChangePlan(plan.code)}
                      >
                        <div>
                          <strong>{plan.name}</strong>
                          <p className="muted">{plan.summary}</p>
                        </div>
                        <span>{plan.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="plan-cancel">
                  <p className="muted">Cancelar assinatura</p>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={handleCancel}
                    disabled={canceling || subscription?.status === "CANCELED"}
                  >
                    {canceling ? "Cancelando..." : "Cancelar assinatura"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="muted">Você pode visualizar o plano, mas apenas o proprietário pode alterá-lo ou cancelar.</p>
            )}
          </>
        )}
      </section>

      <aside className="plan-sidebar">
        <h4>Resumo rápido</h4>
        <ul>
          <li>
            <strong>Plano:</strong> {product?.name ?? product?.code ?? "-"}
          </li>
          <li>
            <strong>Status:</strong> {statusText}
          </li>
          <li>
            <strong>Pagamento:</strong> {subscription?.paymentMethod ?? "-"}
          </li>
          <li>
            <strong>Próximo passo:</strong> Fale conosco para upgrades personalizados.
          </li>
        </ul>
      </aside>
    </div>
  );
};

export default PlanPage;
