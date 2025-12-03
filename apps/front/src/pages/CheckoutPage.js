import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const plans = {
    START: { name: "Plano Start", price: "R$ 49/mês" },
    BUSINESS: { name: "Plano Business", price: "R$ 97/mês" },
    ENTERPRISE: { name: "Plano Enterprise", price: "R$ 197/mês" }
};
const baseBenefits = [
    "Organizações e usuários ilimitados",
    "Kanban avançado, EDT e cronograma",
    "Documentos, anexos e aprovações",
    "Relatórios e portfólio em tempo real"
];
export const CheckoutPage = ({ subscription, subscriptionError, onSubscriptionActivated }) => {
    const navigate = useNavigate();
    const { token, signOut } = useAuth();
    const [error, setError] = useState(subscriptionError ?? null);
    const [isLoading, setIsLoading] = useState(false);
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
    const selectedPlan = selectedPlanCode && plans[selectedPlanCode]
        ? plans[selectedPlanCode]
        : plans.START;
    const handleCheckout = async (method) => {
        if (!token) {
            setError("Sessão expirada. Faça login novamente.");
            return;
        }
        if (!selectedPlanCode) {
            setError("Nenhum plano selecionado. Volte e escolha um plano para continuar.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiBaseUrl}/subscriptions/checkout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    planCode: selectedPlanCode,
                    paymentMethod: method
                })
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                const message = body.message ?? "Falha ao processar pagamento.";
                throw new Error(message);
            }
            if (onSubscriptionActivated) {
                await onSubscriptionActivated();
            }
            navigate("/organizacao", { replace: true });
        }
        catch (checkoutError) {
            setError(checkoutError instanceof Error ? checkoutError.message : "Falha ao processar pagamento.");
        }
        finally {
            setIsLoading(false);
        }
    };
    if (subscription?.status === "ACTIVE") {
        return (_jsx("div", { className: "checkout-page", children: _jsxs("section", { className: "checkout-card", children: [_jsx("p", { className: "eyebrow", children: "Assinatura ativa" }), _jsx("h2", { children: "Voc\u00EA j\u00E1 tem acesso liberado" }), _jsxs("p", { className: "subtext", children: ["Plano ", subscription.product?.name ?? subscription.product?.code ?? selectedPlanCode, " ativo. Voc\u00EA pode criar sua organiza\u00E7\u00E3o e acessar os projetos normalmente."] }), _jsxs("div", { className: "payment-actions", children: [_jsx("button", { type: "button", className: "primary-button", onClick: () => navigate("/organizacao"), children: "Ir para cria\u00E7\u00E3o da organiza\u00E7\u00E3o" }), _jsx("button", { type: "button", className: "secondary-button", onClick: () => navigate("/dashboard"), children: "Ver dashboard" })] })] }) }));
    }
    return (_jsxs("div", { className: "checkout-page", children: [_jsx("div", { className: "checkout-page-header", children: _jsx("button", { type: "button", className: "ghost-button", onClick: signOut, children: "Sair" }) }), _jsxs("section", { className: "checkout-card", children: [_jsx("p", { className: "eyebrow", children: "Checkout seguro" }), _jsx("h2", { children: "Confirme o pagamento do seu plano" }), _jsxs("div", { className: "checkout-plan", children: [_jsxs("div", { children: [_jsx("p", { className: "muted", children: "Plano selecionado" }), _jsx("h3", { children: selectedPlan.name }), _jsx("p", { className: "checkout-price", children: selectedPlan.price })] }), _jsx("div", { className: "plan-benefits", children: baseBenefits.map((benefit) => (_jsx("span", { children: benefit }, benefit))) })] }), _jsxs("div", { className: "checkout-info-row", children: [_jsx("p", { className: "subtext", children: "Voc\u00EA poder\u00E1 pagar com cart\u00E3o, Pix ou boleto. Nesta vers\u00E3o de teste, o pagamento ser\u00E1 simulado e a assinatura ser\u00E1 ativada automaticamente." }), _jsx("button", { type: "button", className: "ghost-button logout-button", onClick: signOut, children: "Sair" })] }), error && _jsx("p", { className: "error-text", children: error }), _jsxs("div", { className: "payment-actions", children: [_jsx("button", { type: "button", className: "primary-button", disabled: isLoading, onClick: () => handleCheckout("card"), children: isLoading ? "Processando..." : "Pagar com Cartão" }), _jsx("button", { type: "button", className: "secondary-button", disabled: isLoading, onClick: () => handleCheckout("pix"), children: "Pagar com Pix" }), _jsx("button", { type: "button", className: "ghost-button", disabled: isLoading, onClick: () => handleCheckout("boleto"), children: "Pagar com Boleto" })] })] }), _jsxs("aside", { className: "checkout-sidebar", children: [_jsx("h4", { children: "Resumo r\u00E1pido" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "Passo 1:" }), " confirme o plano e o m\u00E9todo de pagamento."] }), _jsxs("li", { children: [_jsx("strong", { children: "Passo 2:" }), " assinatura fica ativa imediatamente."] }), _jsxs("li", { children: [_jsx("strong", { children: "Passo 3:" }), " crie sua organiza\u00E7\u00E3o e projetos."] })] }), _jsx("p", { className: "muted", children: "D\u00FAvidas? Fale com nosso time e ajuda no onboarding." })] })] }));
};
