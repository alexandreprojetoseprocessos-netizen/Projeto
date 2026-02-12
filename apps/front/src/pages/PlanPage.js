import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Building2, Calendar, Check, Crown, FolderKanban, HardDrive, Sparkles, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { canManageBilling } from "../components/permissions";
import { apiUrl } from "../config/api";
import { PLAN_DEFINITIONS, formatBillingPrice, formatMonthlyPrice, getPlanDefinition } from "../config/plans";
const statusLabel = {
    ACTIVE: "Ativo",
    PAST_DUE: "Em atraso",
    CANCELED: "Cancelado",
    PENDING: "Processando"
};
const formatLimit = (value) => (value === null ? "Ilimitado" : value.toString());
const calcPercent = (used, max) => {
    if (!max || max <= 0)
        return 0;
    return Math.min(100, Math.round((used / max) * 100));
};
const formatBytes = (value) => {
    if (!value || Number.isNaN(value))
        return "0 MB";
    const mb = value / (1024 * 1024);
    if (mb < 1)
        return "0,1 MB";
    return `${mb.toFixed(1).replace(".", ",")} MB`;
};
const PlanPage = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { currentOrgRole, members, attachments, selectedProject } = useOutletContext();
    const orgRole = (currentOrgRole ?? "MEMBER");
    const canEditBilling = canManageBilling(orgRole);
    const [subscription, setSubscription] = useState(null);
    const [limits, setLimits] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [changingPlan, setChangingPlan] = useState(false);
    const [canceling, setCanceling] = useState(false);
    const loadSubscription = async () => {
        if (!token)
            return;
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao carregar assinatura");
            setSubscription(null);
        }
        finally {
            setLoading(false);
        }
    };
    const loadLimits = async () => {
        if (!token)
            return;
        try {
            const response = await fetch(apiUrl("/me"), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok)
                return;
            setLimits({
                organizationLimits: body?.organizationLimits,
                projectLimits: body?.projectLimits
            });
        }
        catch {
            setLimits(null);
        }
    };
    useEffect(() => {
        loadSubscription();
        loadLimits();
    }, [token]);
    const handleChangePlan = async (planCode) => {
        if (!token)
            return;
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
        }
        catch (err) {
            setActionError(err instanceof Error ? err.message : "Não foi possível alterar o plano");
        }
        finally {
            setChangingPlan(false);
        }
    };
    const handleCancel = async () => {
        if (!token)
            return;
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
        }
        catch (err) {
            setActionError(err instanceof Error ? err.message : "Não foi possível cancelar a assinatura");
        }
        finally {
            setCanceling(false);
        }
    };
    const product = subscription?.product;
    const planDefinition = useMemo(() => getPlanDefinition(product?.code), [product?.code]);
    const price = useMemo(() => formatBillingPrice(product?.priceCents, product?.billingPeriod), [product]);
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
        if (!attachments?.length)
            return 0;
        return attachments.reduce((acc, item) => acc + (item.fileSize ?? 0), 0);
    }, [attachments]);
    const storageLabel = formatBytes(storageBytes);
    const planCards = Object.values(PLAN_DEFINITIONS);
    const selectedProjectName = selectedProject?.projectName ?? selectedProject?.name ?? "Projeto atual";
    return (_jsxs("div", { className: "plan-page-modern", children: [_jsxs("section", { className: "plan-hero-card", children: [_jsxs("div", { className: "plan-hero-left", children: [_jsx("div", { className: "plan-hero-icon", children: _jsx(Crown, { size: 22 }) }), _jsxs("div", { children: [_jsxs("div", { className: "plan-hero-title", children: [_jsx("h2", { children: product?.name ?? planDefinition.name }), _jsx("span", { className: `plan-status-badge status-${(subscription?.status ?? "none").toLowerCase()}`, children: statusText })] }), _jsx("p", { className: "plan-hero-price", children: price })] })] }), _jsxs("div", { className: "plan-hero-actions", children: [_jsxs("div", { className: "plan-hero-meta", children: [_jsx("span", { children: "Pr\u00F3xima cobran\u00E7a" }), _jsx("strong", { children: periodEnd ? new Date(periodEnd).toLocaleDateString("pt-BR") : "-" })] }), _jsxs("button", { type: "button", className: "plan-hero-button", disabled: !canEditBilling, onClick: () => navigate("/checkout"), children: [_jsx(Calendar, { size: 16 }), " Gerenciar pagamento"] })] })] }), _jsxs("section", { className: "plan-usage-grid", children: [_jsxs("article", { className: "plan-usage-card", children: [_jsxs("div", { className: "plan-usage-header", children: [_jsx("span", { className: "plan-usage-icon is-blue", children: _jsx(Building2, { size: 16 }) }), _jsx("span", { children: "Organiza\u00E7\u00F5es" })] }), _jsxs("div", { className: "plan-usage-value", children: [orgUsed, " de ", formatLimit(orgMax)] }), _jsx("div", { className: "plan-usage-progress", children: _jsx("div", { className: "plan-usage-bar", style: { width: `${orgPercent}%` } }) }), _jsxs("div", { className: "plan-usage-percent", children: [orgPercent, "%"] })] }), _jsxs("article", { className: "plan-usage-card", children: [_jsxs("div", { className: "plan-usage-header", children: [_jsx("span", { className: "plan-usage-icon is-green", children: _jsx(FolderKanban, { size: 16 }) }), _jsx("span", { children: "Projetos" })] }), _jsxs("div", { className: "plan-usage-value", children: [projectUsed, " de ", formatLimit(projectMax)] }), _jsx("div", { className: "plan-usage-progress", children: _jsx("div", { className: "plan-usage-bar", style: { width: `${projectPercent}%` } }) }), _jsxs("div", { className: "plan-usage-percent", children: [projectPercent, "%"] })] }), _jsxs("article", { className: "plan-usage-card", children: [_jsxs("div", { className: "plan-usage-header", children: [_jsx("span", { className: "plan-usage-icon is-orange", children: _jsx(Users, { size: 16 }) }), _jsx("span", { children: "Membros" })] }), _jsxs("div", { className: "plan-usage-value", children: [membersCount, " no ", selectedProjectName] }), _jsx("div", { className: "plan-usage-progress is-muted", children: _jsx("div", { className: "plan-usage-bar", style: { width: `${membersPercent}%` } }) }), _jsx("div", { className: "plan-usage-percent", children: "Sem limite" })] }), _jsxs("article", { className: "plan-usage-card", children: [_jsxs("div", { className: "plan-usage-header", children: [_jsx("span", { className: "plan-usage-icon is-purple", children: _jsx(HardDrive, { size: 16 }) }), _jsx("span", { children: "Armazenamento" })] }), _jsx("div", { className: "plan-usage-value", children: storageLabel }), _jsx("div", { className: "plan-usage-progress is-muted", children: _jsx("div", { className: "plan-usage-bar", style: { width: "15%" } }) }), _jsx("div", { className: "plan-usage-percent", children: "Sem limite" })] })] }), _jsxs("section", { className: "plan-compare", children: [_jsx("header", { children: _jsx("h3", { children: "Comparar planos" }) }), _jsx("div", { className: "plan-compare-grid", children: planCards.map((plan) => {
                            const isCurrent = plan.code === product?.code;
                            const isRecommended = plan.code === "BUSINESS";
                            const currentPrice = product?.priceCents ?? planDefinition.priceCents;
                            const isUpgrade = plan.priceCents > currentPrice;
                            const actionLabel = isCurrent
                                ? "Plano atual"
                                : isUpgrade
                                    ? "Fazer upgrade"
                                    : "Fazer downgrade";
                            return (_jsxs("article", { className: `plan-compare-card ${isCurrent ? "is-current" : ""} ${isRecommended ? "is-recommended" : ""}`, children: [isRecommended && _jsx("span", { className: "plan-compare-badge", children: "Recomendado" }), _jsxs("div", { className: "plan-compare-header", children: [_jsx("h4", { children: plan.displayName }), isCurrent && (_jsx("span", { className: "plan-compare-current", children: _jsx(Check, { size: 14 }) }))] }), _jsx("p", { className: "plan-compare-subtext", children: plan.marketing.summary }), _jsx("div", { className: "plan-compare-price", children: formatMonthlyPrice(plan.priceCents) }), _jsx("ul", { className: "plan-compare-features", children: plan.marketing.features.map((feature) => (_jsxs("li", { children: [_jsx(Check, { size: 14 }), _jsx("span", { children: feature })] }, feature))) }), _jsx("button", { type: "button", className: "plan-compare-button", disabled: !canEditBilling || changingPlan || isCurrent, onClick: () => handleChangePlan(plan.code), children: actionLabel })] }, plan.code));
                        }) }), actionError && _jsx("p", { className: "error-text", children: actionError })] }), _jsxs("section", { className: "plan-invoices", children: [_jsxs("header", { className: "plan-invoices-header", children: [_jsx("h3", { children: "Hist\u00F3rico de faturas" }), _jsxs("button", { type: "button", className: "plan-invoices-button", disabled: true, children: [_jsx(Calendar, { size: 16 }), " Ver todas"] })] }), _jsx("div", { className: "plan-invoices-list", children: _jsxs("div", { className: "plan-invoices-empty", children: [_jsx(Sparkles, { size: 20 }), _jsxs("div", { children: [_jsx("strong", { children: "Nenhuma fatura registrada" }), _jsx("p", { children: "Assim que houver cobran\u00E7as, elas aparecer\u00E3o aqui." })] })] }) })] }), loading && _jsx("p", { className: "muted", children: "Carregando informa\u00E7\u00F5es do plano..." }), error && _jsx("p", { className: "error-text", children: error }), subscription?.status === "CANCELED" && (_jsxs("div", { className: "warning-box", children: ["Sua assinatura est\u00E1 cancelada. Para voltar a usar o sistema, escolha um plano novamente.", _jsx("button", { className: "secondary-button", type: "button", onClick: () => navigate("/checkout"), children: "Reativar assinatura" })] })), canEditBilling && subscription?.status !== "CANCELED" && (_jsx("div", { className: "plan-footer-actions", children: _jsx("button", { type: "button", className: "plan-footer-cancel", onClick: handleCancel, disabled: canceling, children: canceling ? "Cancelando..." : "Cancelar assinatura" }) }))] }));
};
export default PlanPage;
