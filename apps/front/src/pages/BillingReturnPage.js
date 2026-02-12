import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch, getNetworkErrorMessage } from "../config/api";
export const BillingReturnPage = ({ onSubscriptionActivated }) => {
    const { token, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const statusParam = useMemo(() => new URLSearchParams(location.search).get("status"), [location.search]);
    const maxAttempts = 3;
    const resolveStatusErrorMessage = (error) => {
        if (error instanceof DOMException || error instanceof TypeError) {
            return getNetworkErrorMessage(error);
        }
        if (error instanceof Error)
            return error.message;
        return "Falha ao carregar status do pagamento.";
    };
    useEffect(() => {
        if (!token)
            return;
        let timeoutId = null;
        const fetchStatus = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiFetch("/me/subscription", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const body = await response.json().catch(() => ({}));
                if (!response.ok) {
                    const message = body?.message ??
                        (response.status >= 500 ? "Servidor indisponível. Tente novamente." : "Falha ao carregar status do pagamento.");
                    throw new Error(message);
                }
                const current = body?.subscription ?? null;
                setSubscription(current);
                if (current?.status === "ACTIVE") {
                    await onSubscriptionActivated?.();
                }
                else if (attempt < maxAttempts) {
                    timeoutId = setTimeout(() => setAttempt((value) => value + 1), 4000);
                }
            }
            catch (err) {
                setError(resolveStatusErrorMessage(err));
            }
            finally {
                setLoading(false);
            }
        };
        fetchStatus();
        return () => {
            if (timeoutId)
                clearTimeout(timeoutId);
        };
    }, [token, attempt, maxAttempts, onSubscriptionActivated]);
    const statusLabel = subscription?.status ?? statusParam ?? "pending";
    const isActive = subscription?.status === "ACTIVE";
    const isPending = subscription?.status === "PENDING" || statusParam === "pending";
    const isFailure = statusParam === "failure" || subscription?.status === "PAST_DUE";
    return (_jsxs("div", { className: "checkout-page", children: [_jsx("div", { className: "checkout-page-header", children: _jsx("button", { type: "button", className: "ghost-button", onClick: signOut, children: "Sair" }) }), _jsxs("section", { className: "checkout-card", children: [_jsx("p", { className: "eyebrow", children: "Retorno do pagamento" }), _jsx("h2", { children: isActive ? "Pagamento confirmado" : isFailure ? "Pagamento não aprovado" : "Processando pagamento" }), _jsx("p", { className: "subtext", children: isActive
                            ? "Sua assinatura foi ativada. Você já pode criar sua organização e acessar os projetos."
                            : isFailure
                                ? "Não foi possível confirmar o pagamento. Verifique com o emissor do cartão ou tente novamente."
                                : "Estamos confirmando a transação. Isso pode levar alguns segundos." }), _jsxs("div", { className: "checkout-info-row", children: [_jsxs("p", { className: "muted", children: ["Status atual: ", statusLabel] }), _jsx("button", { type: "button", className: "ghost-button", onClick: () => setAttempt((value) => value + 1), disabled: loading, children: loading ? "Atualizando..." : "Atualizar status" })] }), error && _jsx("p", { className: "error-text", children: error }), _jsx("div", { className: "payment-actions", children: isActive ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "primary-button", onClick: () => navigate("/plano"), children: "Ver meu plano" }), _jsx("button", { type: "button", className: "secondary-button", onClick: () => navigate("/organizacao"), children: "Criar organiza\u00E7\u00E3o" })] })) : (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "primary-button", onClick: () => navigate("/checkout"), children: "Voltar ao checkout" }), _jsx("button", { type: "button", className: "ghost-button", onClick: () => navigate("/"), children: "Voltar ao site" })] })) })] })] }));
};
