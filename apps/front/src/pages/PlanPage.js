import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { canManageBilling } from "../components/permissions";
import { apiUrl } from "../config/api";
import { PLAN_DEFINITIONS, formatBillingPrice, formatMonthlyPrice } from "../config/plans";
const statusLabel = {
    ACTIVE: "Ativa",
    PAST_DUE: "Em atraso",
    CANCELED: "Cancelada"
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
    const { currentOrgRole } = useOutletContext();
    const orgRole = (currentOrgRole ?? "MEMBER");
    const canEditBilling = canManageBilling(orgRole);
    const [subscription, setSubscription] = useState(null);
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
    useEffect(() => {
        loadSubscription();
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
    const price = useMemo(() => formatBillingPrice(product?.priceCents, product?.billingPeriod), [product]);
    const statusText = subscription?.status ? statusLabel[subscription.status] ?? subscription.status : "-";
    return (_jsxs("div", { className: "plan-page", children: [_jsxs("section", { className: "plan-card", children: [_jsx("p", { className: "eyebrow", children: "Minha assinatura" }), _jsx("h2", { children: "Plano atual" }), loading ? (_jsx("p", { className: "muted", children: "Carregando..." })) : error ? (_jsx("p", { className: "error-text", children: error })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "plan-summary", children: [_jsxs("div", { children: [_jsx("p", { className: "muted", children: "Plano" }), _jsx("h3", { children: product?.name ?? product?.code ?? "Nenhum plano ativo" }), _jsx("p", { className: "muted", children: product?.code ?? "-" })] }), _jsxs("div", { children: [_jsx("p", { className: "muted", children: "Pre\u00E7o" }), _jsx("strong", { children: price })] }), _jsx("div", { className: "plan-status", children: _jsx("span", { className: `status-chip status-${(subscription?.status ?? "none").toLowerCase()}`, children: statusText }) })] }), _jsxs("div", { className: "plan-details", children: [_jsxs("p", { children: ["In\u00EDcio: ", subscription?.startedAt ? new Date(subscription.startedAt).toLocaleDateString("pt-BR") : "-"] }), _jsxs("p", { children: ["V\u00E1lida at\u00E9: ", subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString("pt-BR") : "Sem término"] }), _jsxs("p", { children: ["Pagamento: ", subscription?.paymentMethod ?? "Não informado"] })] }), subscription?.status === "CANCELED" && (_jsxs("div", { className: "warning-box", children: ["Sua assinatura est\u00E1 cancelada. Para voltar a usar o sistema, escolha um plano novamente.", _jsx("button", { className: "secondary-button", type: "button", onClick: () => navigate("/checkout"), children: "Reativar assinatura" })] })), actionError && _jsx("p", { className: "error-text", children: actionError }), canEditBilling ? (_jsxs("div", { className: "plan-actions", children: [_jsxs("div", { className: "plan-switcher", children: [_jsx("p", { className: "muted", children: "Trocar plano" }), _jsx("div", { className: "plan-options", children: planCards.map((plan) => (_jsxs("button", { type: "button", className: `secondary-button ${plan.code === product?.code ? "is-active" : ""}`, disabled: changingPlan || plan.code === product?.code, onClick: () => handleChangePlan(plan.code), children: [_jsxs("div", { children: [_jsx("strong", { children: plan.name }), _jsx("p", { className: "muted", children: plan.summary })] }), _jsx("span", { children: plan.price })] }, plan.code))) })] }), _jsxs("div", { className: "plan-cancel", children: [_jsx("p", { className: "muted", children: "Cancelar assinatura" }), _jsx("button", { type: "button", className: "ghost-button", onClick: handleCancel, disabled: canceling || subscription?.status === "CANCELED", children: canceling ? "Cancelando..." : "Cancelar assinatura" })] })] })) : (_jsx("p", { className: "muted", children: "Voc\u00EA pode visualizar o plano, mas apenas o propriet\u00E1rio pode alter\u00E1-lo ou cancelar." }))] }))] }), _jsxs("aside", { className: "plan-sidebar", children: [_jsx("h4", { children: "Resumo r\u00E1pido" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "Plano:" }), " ", product?.name ?? product?.code ?? "-"] }), _jsxs("li", { children: [_jsx("strong", { children: "Status:" }), " ", statusText] }), _jsxs("li", { children: [_jsx("strong", { children: "Pagamento:" }), " ", subscription?.paymentMethod ?? "-"] }), _jsxs("li", { children: [_jsx("strong", { children: "Pr\u00F3ximo passo:" }), " Fale conosco para upgrades personalizados."] })] })] })] }));
};
export default PlanPage;
