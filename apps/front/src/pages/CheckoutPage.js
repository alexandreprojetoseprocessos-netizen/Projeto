import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch, getNetworkErrorMessage } from "../config/api";
import { ANNUAL_DISCOUNT_LABEL, PLAN_DEFINITIONS, formatBillingPrice, formatMonthlyPrice, getPlanPriceCents } from "../config/plans";
const baseBenefits = [
    "Usuários ilimitados",
    "Kanban, EAP e cronograma",
    "Documentos, anexos e aprovações",
    "Relatórios e portfólio em tempo real"
];
export const CheckoutPage = ({ subscription, subscriptionError }) => {
    const navigate = useNavigate();
    const { token, signOut } = useAuth();
    const [error, setError] = useState(subscriptionError ?? null);
    const [isLoading, setIsLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState("MONTHLY");
    const [selectedPlanCode] = useState(() => {
        if (typeof window === "undefined")
            return "START";
        return window.localStorage.getItem("gp:selectedPlan") ?? "START";
    });
    useEffect(() => {
        if (typeof window !== "undefined" && selectedPlanCode) {
            window.localStorage.setItem("gp:selectedPlan", selectedPlanCode);
        }
    }, [selectedPlanCode]);
    const plan = selectedPlanCode && PLAN_DEFINITIONS[selectedPlanCode]
        ? PLAN_DEFINITIONS[selectedPlanCode]
        : PLAN_DEFINITIONS.START;
    const planBenefits = plan.marketing.features.filter((feature) => feature !== ANNUAL_DISCOUNT_LABEL);
    const priceCents = getPlanPriceCents(plan.code, billingCycle);
    const priceLabel = useMemo(() => {
        if (billingCycle === "MONTHLY") {
            return formatMonthlyPrice(priceCents, false);
        }
        return formatBillingPrice(priceCents, "annual");
    }, [billingCycle, priceCents]);
    const resolveCheckoutErrorMessage = (error) => {
        if (error instanceof DOMException || error instanceof TypeError) {
            return getNetworkErrorMessage(error);
        }
        if (error instanceof Error)
            return error.message;
        return "Falha ao iniciar pagamento.";
    };
    const handleCheckout = async () => {
        if (!token) {
            setError("Sessão expirada. Faça login novamente.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiFetch("/billing/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    planId: plan.code,
                    billingCycle
                }),
                retry: 0
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                const message = body.message ??
                    (response.status >= 500 ? "Servidor indisponível. Tente novamente." : "Falha ao iniciar pagamento.");
                throw new Error(message);
            }
            if (body?.init_point) {
                window.location.href = body.init_point;
                return;
            }
            throw new Error("Link de pagamento não disponível.");
        }
        catch (checkoutError) {
            setError(resolveCheckoutErrorMessage(checkoutError));
        }
        finally {
            setIsLoading(false);
        }
    };
    if (subscription?.status === "ACTIVE") {
        return (_jsx("div", { className: "checkout-page", children: _jsxs("section", { className: "checkout-card", children: [_jsx("p", { className: "eyebrow", children: "Assinatura ativa" }), _jsx("h2", { children: "Voc\u00EA j\u00E1 tem acesso liberado" }), _jsxs("p", { className: "subtext", children: ["Plano ", subscription.product?.name ?? subscription.product?.code ?? selectedPlanCode, " ativo. Voc\u00EA pode criar sua organiza\u00E7\u00E3o e acessar os projetos normalmente."] }), _jsxs("div", { className: "payment-actions", children: [_jsx("button", { type: "button", className: "primary-button", onClick: () => navigate("/organizacao"), children: "Ir para cria\u00E7\u00E3o da organiza\u00E7\u00E3o" }), _jsx("button", { type: "button", className: "secondary-button", onClick: () => navigate("/dashboard"), children: "Ver dashboard" })] })] }) }));
    }
    return (_jsxs("div", { className: "checkout-page", children: [_jsx("div", { className: "checkout-page-header", children: _jsx("button", { type: "button", className: "ghost-button", onClick: signOut, children: "Sair" }) }), _jsxs("section", { className: "checkout-card", children: [_jsx("p", { className: "eyebrow", children: "Checkout seguro" }), _jsx("h2", { children: "Confirme o pagamento do seu plano" }), _jsxs("div", { className: "checkout-plan", children: [_jsxs("div", { children: [_jsx("p", { className: "muted", children: "Plano selecionado" }), _jsx("h3", { children: plan.name }), _jsx("p", { className: "checkout-price", children: priceLabel }), _jsxs("div", { className: "checkout-billing-toggle", children: [_jsx("button", { type: "button", className: `chip chip-outline ${billingCycle === "MONTHLY" ? "is-active" : ""}`, onClick: () => setBillingCycle("MONTHLY"), children: "Mensal" }), _jsx("button", { type: "button", className: `chip chip-soft ${billingCycle === "ANNUAL" ? "is-active" : ""}`, onClick: () => setBillingCycle("ANNUAL"), children: "Anual" })] }), _jsx("p", { className: "muted", children: ANNUAL_DISCOUNT_LABEL })] }), _jsx("div", { className: "plan-benefits", children: [...planBenefits, ...baseBenefits].map((benefit) => (_jsx("span", { children: benefit }, benefit))) })] }), _jsxs("div", { className: "checkout-info-row", children: [_jsx("p", { className: "subtext", children: "Pagamento com cart\u00E3o via Mercado Pago. Ap\u00F3s a confirma\u00E7\u00E3o, sua assinatura \u00E9 ativada automaticamente." }), _jsx("button", { type: "button", className: "ghost-button logout-button", onClick: signOut, children: "Sair" })] }), error && _jsx("p", { className: "error-text", children: error }), _jsx("div", { className: "payment-actions", children: _jsx("button", { type: "button", className: "primary-button", disabled: isLoading, onClick: handleCheckout, children: isLoading ? "Redirecionando..." : "Pagar com cartão" }) })] }), _jsxs("aside", { className: "checkout-sidebar", children: [_jsx("h4", { children: "Resumo r\u00E1pido" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "Passo 1:" }), " confirme o plano e a forma de pagamento."] }), _jsxs("li", { children: [_jsx("strong", { children: "Passo 2:" }), " finalize o checkout no Mercado Pago."] }), _jsxs("li", { children: [_jsx("strong", { children: "Passo 3:" }), " acesse o painel e crie sua organiza\u00E7\u00E3o."] })] }), _jsx("p", { className: "muted", children: "D\u00FAvidas? Fale com nosso time durante o onboarding." })] })] }));
};
