import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiUrl, getNetworkErrorMessage } from "../config/api";
import { AlertTriangle, CalendarClock, CheckCircle2, CreditCard, FileText, RefreshCw } from "lucide-react";
import { ANNUAL_DISCOUNT_LABEL, PLAN_DEFINITIONS, formatBillingPrice, formatMonthlyPrice, getPlanPriceCents } from "../config/plans";
import { getMercadoPago } from "../lib/mercadopago";
import { ApiRequestError, createCardPayment, createPixPayment, fetchIdentificationTypes, fetchInstallments, fetchPaymentMethods } from "../services/billingClient";
const baseBenefits = [
    "Usuarios ilimitados",
    "Kanban, EAP e cronograma",
    "Documentos, anexos e aprovacoes",
    "Relatorios e portfolio em tempo real"
];
const digitsOnly = (value) => (value || "").replace(/\D/g, "");
const normalizeCPF = (value) => (value || "").replace(/\D/g, "");
const resolvePaymentMethodId = (methods, bin) => {
    for (const method of methods) {
        const settings = method?.settings ?? [];
        for (const setting of settings) {
            const pattern = setting?.bin?.pattern;
            if (!pattern)
                continue;
            try {
                if (new RegExp(pattern).test(bin)) {
                    return method.id;
                }
            }
            catch {
                // Ignore invalid regex patterns from upstream.
            }
        }
    }
    return null;
};
const resolveFallbackPaymentMethodId = (bin) => {
    if (bin.startsWith("4"))
        return "visa";
    if (bin.startsWith("5"))
        return "master";
    if (bin.startsWith("3"))
        return "amex";
    return null;
};
const formatCardNumber = (value) => {
    const digits = digitsOnly(value).slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
};
const formatMonth = (value) => digitsOnly(value).slice(0, 2);
const formatYear = (value) => digitsOnly(value).slice(0, 4);
const formatCvv = (value) => digitsOnly(value).slice(0, 4);
const formatIdentificationNumber = (value) => digitsOnly(value).slice(0, 14);
const formatDatePtBr = (value) => {
    if (!value)
        return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return "-";
    return date.toLocaleDateString("pt-BR");
};
const billingCycleLabels = {
    MONTHLY: "Mensal",
    ANNUAL: "Anual"
};
const subscriptionStatusLabels = {
    ACTIVE: "Ativa",
    PENDING: "Pendente",
    PAST_DUE: "Em atraso",
    CANCELED: "Cancelada"
};
const paymentMethodLabels = {
    card: "Cartao de credito",
    pix: "Pix",
    boleto: "Boleto"
};
export const CheckoutPage = ({ subscription, subscriptionError, onSubscriptionActivated }) => {
    const navigate = useNavigate();
    const { token, user, signOut } = useAuth();
    const [error, setError] = useState(subscriptionError ?? null);
    const [info, setInfo] = useState(null);
    const [billingCycle, setBillingCycle] = useState("MONTHLY");
    const [selectedPlanCode] = useState(() => {
        if (typeof window === "undefined")
            return "START";
        return window.localStorage.getItem("gp:selectedPlan") ?? "START";
    });
    const [activeTab, setActiveTab] = useState("pix");
    const [pixLoading, setPixLoading] = useState(false);
    const [pixError, setPixError] = useState(null);
    const [pixData, setPixData] = useState(null);
    const [cardLoading, setCardLoading] = useState(false);
    const [cardError, setCardError] = useState(null);
    const [cardResult, setCardResult] = useState(null);
    const [cardNumber, setCardNumber] = useState("");
    const [expirationMonth, setExpirationMonth] = useState("");
    const [expirationYear, setExpirationYear] = useState("");
    const [securityCode, setSecurityCode] = useState("");
    const [cardholderName, setCardholderName] = useState("");
    const [identificationTypes, setIdentificationTypes] = useState([]);
    const [identificationType, setIdentificationType] = useState("");
    const [identificationNumber, setIdentificationNumber] = useState("");
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentMethodId, setPaymentMethodId] = useState(null);
    const [issuerId, setIssuerId] = useState(null);
    const [issuerOptions, setIssuerOptions] = useState([]);
    const [installments, setInstallments] = useState(1);
    const [installmentOptions, setInstallmentOptions] = useState([]);
    const mpRef = useRef(null);
    const [mpReady, setMpReady] = useState(false);
    const [mpError, setMpError] = useState(null);
    const [manageLoading, setManageLoading] = useState(false);
    const [manageError, setManageError] = useState(null);
    const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
    useEffect(() => {
        if (!publicKey) {
            setMpError("VITE_MP_PUBLIC_KEY nao configurada.");
            return;
        }
        let mounted = true;
        getMercadoPago(publicKey)
            .then((mp) => {
            if (!mounted)
                return;
            mpRef.current = mp;
            setMpReady(true);
        })
            .catch((err) => {
            if (!mounted)
                return;
            setMpError(err instanceof Error ? err.message : "Falha ao carregar MercadoPago.js.");
        });
        return () => {
            mounted = false;
        };
    }, [publicKey]);
    useEffect(() => {
        setError(subscriptionError ?? null);
    }, [subscriptionError]);
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        const key = "gp:checkout_reopen_after_cancel";
        const shouldShowInfo = window.sessionStorage.getItem(key);
        if (shouldShowInfo === "1") {
            setInfo("Assinatura cancelada. Escolha abaixo a nova forma de pagamento para reativar seu acesso.");
            window.sessionStorage.removeItem(key);
        }
    }, []);
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
    const amount = Number(((priceCents ?? 0) / 100).toFixed(2));
    const description = `Plano ${plan.name}`;
    const payerEmail = user?.email ?? "";
    const currentPlanName = subscription?.product?.name ?? subscription?.product?.code ?? selectedPlanCode;
    const currentStatus = String(subscription?.status ?? "PENDING").toUpperCase();
    const currentStatusLabel = subscriptionStatusLabels[currentStatus] ?? currentStatus;
    const currentPaymentMethod = String(subscription?.paymentMethod ?? "").toLowerCase();
    const currentPaymentMethodLabel = paymentMethodLabels[currentPaymentMethod] ?? "Nao informado";
    const currentBillingCycleLabel = billingCycleLabels[String(subscription?.billingCycle ?? "").toUpperCase()] ??
        String(subscription?.billingCycle ?? "Nao informado");
    const nextBillingDate = formatDatePtBr(subscription?.currentPeriodEnd ?? subscription?.expiresAt ?? null);
    const startedAtLabel = formatDatePtBr(subscription?.startedAt ?? null);
    const resolveCheckoutErrorMessage = useCallback((error) => {
        if (error instanceof DOMException || error instanceof TypeError) {
            return getNetworkErrorMessage(error);
        }
        if (error instanceof Error)
            return error.message;
        return "Falha ao iniciar pagamento.";
    }, []);
    const handleCancelAndReopenCheckout = async () => {
        if (!token) {
            setManageError("Sessao expirada. Faca login novamente.");
            return;
        }
        const confirmed = window.confirm("Para trocar cartao ou forma de pagamento, a assinatura atual sera cancelada agora. Deseja continuar?");
        if (!confirmed)
            return;
        setManageLoading(true);
        setManageError(null);
        try {
            const response = await fetch(apiUrl("/subscriptions/cancel"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(body?.message ?? "Nao foi possivel cancelar a assinatura atual.");
            }
            if (typeof window !== "undefined") {
                window.sessionStorage.setItem("gp:checkout_reopen_after_cancel", "1");
            }
            await onSubscriptionActivated?.();
        }
        catch (cancelError) {
            setManageError(resolveCheckoutErrorMessage(cancelError));
        }
        finally {
            setManageLoading(false);
        }
    };
    useEffect(() => {
        if (!token)
            return;
        let active = true;
        Promise.all([fetchIdentificationTypes(token), fetchPaymentMethods(token)])
            .then(([types, methods]) => {
            if (!active)
                return;
            const normalizedTypes = (types ?? []).map((type) => ({
                id: String(type.id),
                name: type.name
            }));
            setIdentificationTypes(normalizedTypes);
            if (normalizedTypes.length) {
                setIdentificationType((current) => current || normalizedTypes[0].id);
            }
            setPaymentMethods(Array.isArray(methods) ? methods : []);
        })
            .catch((fetchError) => {
            if (!active)
                return;
            setCardError(resolveCheckoutErrorMessage(fetchError));
        });
        return () => {
            active = false;
        };
    }, [token, resolveCheckoutErrorMessage]);
    useEffect(() => {
        const cardDigits = digitsOnly(cardNumber);
        const bin = cardDigits.slice(0, 6);
        if (bin.length < 6) {
            setPaymentMethodId(null);
            setIssuerId(null);
            setIssuerOptions([]);
            setInstallmentOptions([]);
            setInstallments(1);
            return;
        }
        const pmFromApi = resolvePaymentMethodId(paymentMethods, bin);
        const fallbackMethodId = resolveFallbackPaymentMethodId(bin);
        const resolvedMethodId = pmFromApi || fallbackMethodId;
        if (!resolvedMethodId) {
            setPaymentMethodId(null);
            setIssuerId(null);
            setIssuerOptions([]);
            setInstallmentOptions([]);
            setInstallments(1);
            setCardError("Payment method nao identificado.");
            return;
        }
        setCardError(null);
        setPaymentMethodId(resolvedMethodId);
    }, [cardNumber, paymentMethods]);
    useEffect(() => {
        if (!token || !paymentMethodId || !amount) {
            setIssuerId(null);
            setIssuerOptions([]);
            setInstallmentOptions([]);
            setInstallments(1);
            return;
        }
        let active = true;
        const loadInstallments = async () => {
            setCardError(null);
            const installmentsResponse = await fetchInstallments(token, {
                amount,
                paymentMethodId,
                issuerId
            });
            if (!active)
                return;
            const normalizedResponse = Array.isArray(installmentsResponse) ? installmentsResponse : [];
            const issuerMap = new Map();
            normalizedResponse.forEach((entry) => {
                const issuer = entry?.issuer;
                if (!issuer?.id)
                    return;
                const issuerKey = String(issuer.id);
                if (issuerMap.has(issuerKey))
                    return;
                issuerMap.set(issuerKey, { id: issuerKey, name: issuer.name ?? issuerKey });
            });
            const issuerList = Array.from(issuerMap.values());
            setIssuerOptions(issuerList);
            if (issuerId && !issuerMap.has(issuerId)) {
                setIssuerId(null);
            }
            if (!issuerId && issuerList.length === 1) {
                setIssuerId(issuerList[0].id);
            }
            const selectedIssuerId = issuerId ?? issuerList[0]?.id ?? null;
            const selectedEntry = (selectedIssuerId &&
                normalizedResponse.find((entry) => String(entry?.issuer?.id) === selectedIssuerId)) ||
                normalizedResponse[0];
            const payerCosts = selectedEntry?.payer_costs ?? [];
            const options = payerCosts.map((cost) => ({
                value: cost.installments,
                label: cost.recommended_message ?? `${cost.installments}x`
            }));
            setInstallmentOptions(options);
            if (options.length) {
                setInstallments(options[0].value);
            }
            else {
                setInstallments(1);
            }
        };
        loadInstallments().catch((err) => {
            if (!active)
                return;
            setCardError(err instanceof Error ? err.message : "Erro ao calcular parcelas.");
        });
        return () => {
            active = false;
        };
    }, [amount, issuerId, paymentMethodId, token]);
    const handlePixPayment = async () => {
        if (!token) {
            setPixError("Sessao expirada. Faca login novamente.");
            return;
        }
        if (!payerEmail) {
            setPixError("E-mail do pagador obrigatorio.");
            return;
        }
        const identificationDigits = digitsOnly(identificationNumber);
        if (!identificationType || !identificationDigits) {
            setPixError("Documento do pagador obrigatorio.");
            return;
        }
        if (!amount) {
            setPixError("Valor do plano invalido.");
            return;
        }
        setPixLoading(true);
        setPixError(null);
        setPixData(null);
        try {
            const response = await createPixPayment(token, {
                transaction_amount: amount,
                description,
                payer: {
                    email: payerEmail,
                    identification: {
                        type: identificationType,
                        number: identificationDigits
                    }
                },
                planCode: plan.code,
                billingCycle
            });
            setPixData({
                paymentId: response.payment_id,
                status: response.status,
                qrCode: response.qr_code,
                qrCodeBase64: response.qr_code_base64
            });
            if (response.status === "approved") {
                await onSubscriptionActivated?.();
            }
        }
        catch (pixError) {
            setPixError(resolveCheckoutErrorMessage(pixError));
        }
        finally {
            setPixLoading(false);
        }
    };
    const handleCopyPix = async () => {
        if (!pixData?.qrCode)
            return;
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(pixData.qrCode);
        }
    };
    const handleCardPayment = async () => {
        if (!token) {
            setCardError("Sessao expirada. Faca login novamente.");
            return;
        }
        if (!payerEmail) {
            setCardError("E-mail do pagador obrigatorio.");
            return;
        }
        if (!mpRef.current) {
            setCardError("MercadoPago.js nao carregou.");
            return;
        }
        if (!amount) {
            setCardError("Valor do plano invalido.");
            return;
        }
        const cardDigits = digitsOnly(cardNumber);
        const cpf = normalizeCPF(identificationNumber);
        if (!cardDigits || cardDigits.length < 13) {
            setCardError("Numero do cartao invalido.");
            return;
        }
        if (!cardholderName.trim()) {
            setCardError("Nome do titular obrigatorio.");
            return;
        }
        if (!expirationMonth || !expirationYear) {
            setCardError("Validade do cartao obrigatoria.");
            return;
        }
        if (!securityCode) {
            setCardError("CVV obrigatorio.");
            return;
        }
        if (!identificationType) {
            setCardError("Tipo de documento obrigatorio.");
            return;
        }
        const normalizedDocType = identificationType.trim().toUpperCase();
        if (normalizedDocType !== "CPF") {
            setCardError("Tipo de documento deve ser CPF.");
            return;
        }
        if (cpf.length !== 11) {
            setCardError("CPF deve conter 11 digitos.");
            return;
        }
        const resolvedInstallments = Number(installments);
        if (!Number.isFinite(resolvedInstallments) || resolvedInstallments < 1) {
            setCardError("Parcelas obrigatorias.");
            return;
        }
        const bin = cardDigits.slice(0, 6);
        const pmFromApi = resolvePaymentMethodId(paymentMethods, bin);
        const fallbackMethodId = resolveFallbackPaymentMethodId(bin);
        const resolvedMethodId = pmFromApi || fallbackMethodId;
        if (!resolvedMethodId) {
            setCardError("Payment method nao identificado.");
            return;
        }
        setCardLoading(true);
        setCardError(null);
        setCardResult(null);
        try {
            console.log("BIN", bin);
            console.log("payment_method_id", resolvedMethodId);
            console.log("installments", installments);
            const cardTokenResponse = await mpRef.current.createCardToken({
                cardNumber: cardDigits,
                cardholderName: cardholderName.trim(),
                cardExpirationMonth: expirationMonth,
                cardExpirationYear: expirationYear,
                securityCode: securityCode.trim(),
                identificationType: normalizedDocType,
                identificationNumber: cpf
            });
            const cardToken = cardTokenResponse?.id;
            console.log("token created ok?", Boolean(cardToken));
            if (!cardToken || typeof cardToken !== "string" || !cardToken.trim()) {
                const message = cardTokenResponse?.error?.message ?? "Falha ao tokenizar cartao.";
                throw new Error(message);
            }
            if (!payerEmail) {
                setCardError("E-mail do pagador obrigatorio.");
                return;
            }
            if (!amount) {
                setCardError("Valor do plano invalido.");
                return;
            }
            if (!identificationType) {
                setCardError("Tipo de documento obrigatorio.");
                return;
            }
            if (normalizedDocType !== "CPF") {
                setCardError("Tipo de documento deve ser CPF.");
                return;
            }
            if (cpf.length !== 11) {
                setCardError("CPF deve conter 11 digitos.");
                return;
            }
            if (!resolvedMethodId) {
                setCardError("Payment method nao identificado.");
                return;
            }
            if (!Number.isFinite(resolvedInstallments) || resolvedInstallments < 1) {
                setCardError("Parcelas obrigatorias.");
                return;
            }
            const response = await createCardPayment(token, {
                transaction_amount: amount,
                description,
                token: cardToken,
                payment_method_id: resolvedMethodId,
                installments: resolvedInstallments,
                issuer_id: issuerId ?? undefined,
                payer: {
                    email: payerEmail,
                    identification: {
                        type: normalizedDocType,
                        number: cpf
                    }
                },
                planCode: plan.code,
                billingCycle
            });
            setCardResult({
                id: response.id,
                status: response.status,
                statusDetail: response.status_detail ?? null
            });
            if (response.status === "approved") {
                await onSubscriptionActivated?.();
            }
        }
        catch (cardPaymentError) {
            if (cardPaymentError instanceof ApiRequestError) {
                console.error("[checkout] card payment error", {
                    status: cardPaymentError.status,
                    body: cardPaymentError.body
                });
            }
            else {
                console.error("[checkout] card payment error", cardPaymentError);
            }
            setCardError(resolveCheckoutErrorMessage(cardPaymentError));
        }
        finally {
            setCardLoading(false);
        }
    };
    if (subscription?.status === "ACTIVE") {
        return (_jsxs("div", { className: "checkout-page", children: [_jsxs("section", { className: "checkout-card checkout-manage", children: [_jsxs("header", { className: "checkout-manage-hero", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Gestao de pagamento" }), _jsx("h2", { children: "Assinatura ativa e pronta para uso" }), _jsx("p", { className: "subtext", children: "Aqui voce acompanha plano, ciclo e metodo atual, alem de executar troca de pagamento quando precisar." })] }), _jsx("span", { className: "checkout-manage-status", children: currentStatusLabel })] }), _jsxs("div", { className: "checkout-manage-grid", children: [_jsxs("article", { className: "checkout-manage-card", children: [_jsxs("div", { className: "checkout-manage-card__title", children: [_jsx(CreditCard, { size: 16 }), _jsx("h3", { children: "Plano e cobranca" })] }), _jsxs("dl", { className: "checkout-manage-metrics", children: [_jsxs("div", { children: [_jsx("dt", { children: "Plano atual" }), _jsx("dd", { children: currentPlanName })] }), _jsxs("div", { children: [_jsx("dt", { children: "Ciclo" }), _jsx("dd", { children: currentBillingCycleLabel })] }), _jsxs("div", { children: [_jsx("dt", { children: "Metodo atual" }), _jsx("dd", { children: currentPaymentMethodLabel })] }), _jsxs("div", { children: [_jsx("dt", { children: "Inicio" }), _jsx("dd", { children: startedAtLabel })] }), _jsxs("div", { children: [_jsx("dt", { children: "Proxima cobranca" }), _jsx("dd", { children: nextBillingDate })] })] })] }), _jsxs("article", { className: "checkout-manage-card", children: [_jsxs("div", { className: "checkout-manage-card__title", children: [_jsx(CalendarClock, { size: 16 }), _jsx("h3", { children: "Gerenciar assinatura" })] }), _jsxs("div", { className: "checkout-manage-steps", children: [_jsx("p", { children: "Para trocar cartao ou forma de pagamento, o sistema precisa encerrar a assinatura atual e iniciar novo checkout." }), _jsxs("div", { className: "checkout-manage-warning", children: [_jsx(AlertTriangle, { size: 15 }), _jsx("span", { children: "A troca de pagamento cancela a assinatura atual antes da nova cobranca." })] })] }), _jsxs("div", { className: "checkout-manage-actions", children: [_jsx("button", { type: "button", className: "primary-button", onClick: handleCancelAndReopenCheckout, disabled: manageLoading, children: manageLoading ? "Preparando checkout..." : "Trocar forma de pagamento" }), _jsx("button", { type: "button", className: "secondary-button", onClick: () => navigate("/plano"), children: "Ver detalhes do plano" })] }), manageError ? _jsx("p", { className: "error-text", children: manageError }) : null] })] }), _jsxs("div", { className: "checkout-manage-footer", children: [_jsxs("button", { type: "button", className: "ghost-button", onClick: () => navigate("/dashboard"), children: [_jsx(CheckCircle2, { size: 16 }), "Ir para dashboard"] }), _jsxs("button", { type: "button", className: "ghost-button", onClick: () => navigate("/organizacao"), children: [_jsx(FileText, { size: 16 }), "Criar/selecionar organizacao"] }), _jsxs("button", { type: "button", className: "ghost-button", onClick: onSubscriptionActivated, children: [_jsx(RefreshCw, { size: 16 }), "Atualizar status"] })] })] }), _jsxs("aside", { className: "checkout-sidebar checkout-manage-sidebar", children: [_jsx("h4", { children: "Resumo rapido" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "Plano:" }), " ", currentPlanName] }), _jsxs("li", { children: [_jsx("strong", { children: "Metodo:" }), " ", currentPaymentMethodLabel] }), _jsxs("li", { children: [_jsx("strong", { children: "Ciclo:" }), " ", currentBillingCycleLabel] }), _jsxs("li", { children: [_jsx("strong", { children: "Proxima cobranca:" }), " ", nextBillingDate] })] }), _jsx("p", { className: "muted", children: "Pagamento processado via provedor seguro e com atualizacao automatica da assinatura." })] })] }));
    }
    return (_jsxs("div", { className: "checkout-page", children: [_jsx("div", { className: "checkout-page-header", children: _jsx("button", { type: "button", className: "ghost-button", onClick: signOut, children: "Sair" }) }), _jsxs("section", { className: "checkout-card", children: [_jsx("p", { className: "eyebrow", children: "Checkout seguro" }), _jsx("h2", { children: "Finalize o pagamento do seu plano" }), _jsxs("div", { className: "checkout-plan", children: [_jsxs("div", { children: [_jsx("p", { className: "muted", children: "Plano selecionado" }), _jsx("h3", { children: plan.name }), _jsx("p", { className: "checkout-price", children: priceLabel }), _jsxs("div", { className: "checkout-billing-toggle", children: [_jsx("button", { type: "button", className: `chip chip-outline ${billingCycle === "MONTHLY" ? "is-active" : ""}`, onClick: () => setBillingCycle("MONTHLY"), children: "Mensal" }), _jsx("button", { type: "button", className: `chip chip-soft ${billingCycle === "ANNUAL" ? "is-active" : ""}`, onClick: () => setBillingCycle("ANNUAL"), children: "Anual" })] }), _jsx("p", { className: "muted", children: ANNUAL_DISCOUNT_LABEL })] }), _jsx("div", { className: "plan-benefits", children: [...planBenefits, ...baseBenefits].map((benefit) => (_jsx("span", { children: benefit }, benefit))) })] }), _jsxs("div", { className: "checkout-info-row", children: [_jsx("p", { className: "subtext", children: "Escolha Pix ou cartao de credito. A assinatura e ativada automaticamente apos a confirmacao do pagamento." }), _jsx("button", { type: "button", className: "ghost-button logout-button", onClick: signOut, children: "Sair" })] }), info && _jsx("p", { className: "warning-text", children: info }), error && _jsx("p", { className: "error-text", children: error }), _jsxs("div", { className: "payment-tabs", children: [_jsx("button", { type: "button", className: `payment-tab ${activeTab === "pix" ? "is-active" : ""}`, onClick: () => setActiveTab("pix"), children: "Pix" }), _jsx("button", { type: "button", className: `payment-tab ${activeTab === "card" ? "is-active" : ""}`, onClick: () => setActiveTab("card"), children: "Cartao de credito" })] }), activeTab === "pix" && (_jsxs("div", { className: "payment-panel", children: [_jsx("p", { className: "muted", children: "Gere o QR Code Pix e finalize o pagamento no seu banco." }), _jsxs("div", { className: "payment-row", children: [_jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Tipo de documento" }), _jsx("select", { value: identificationType, onChange: (event) => setIdentificationType(event.target.value), disabled: !identificationTypes.length, children: identificationTypes.map((type) => (_jsx("option", { value: type.id, children: type.name }, type.id))) })] }), _jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Numero do documento" }), _jsx("input", { type: "text", inputMode: "numeric", placeholder: "CPF/CNPJ", value: identificationNumber, onChange: (event) => setIdentificationNumber(formatIdentificationNumber(event.target.value)) })] })] }), pixData ? (_jsxs("div", { className: "pix-result", children: [_jsx("img", { className: "pix-qr", src: `data:image/png;base64,${pixData.qrCodeBase64}`, alt: "QR Code Pix" }), _jsxs("div", { className: "pix-code", children: [_jsx("textarea", { readOnly: true, value: pixData.qrCode }), _jsx("button", { type: "button", className: "secondary-button", onClick: handleCopyPix, children: "Copiar codigo Pix" }), _jsxs("span", { className: "muted", children: ["Status: ", pixData.status] })] })] })) : (_jsx("button", { type: "button", className: "primary-button", disabled: pixLoading, onClick: handlePixPayment, children: pixLoading ? "Gerando QR Code..." : "Gerar QR Code Pix" })), pixError && _jsx("p", { className: "error-text", children: pixError })] })), activeTab === "card" && (_jsxs("div", { className: "payment-panel", children: [mpError && _jsx("p", { className: "error-text", children: mpError }), _jsxs("div", { className: "payment-grid", children: [_jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Numero do cartao" }), _jsx("input", { type: "text", inputMode: "numeric", placeholder: "0000 0000 0000 0000", value: cardNumber, onChange: (event) => setCardNumber(formatCardNumber(event.target.value)) })] }), _jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Nome no cartao" }), _jsx("input", { type: "text", placeholder: "Como no cartao", value: cardholderName, onChange: (event) => setCardholderName(event.target.value) })] }), _jsxs("div", { className: "payment-row", children: [_jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Tipo de documento" }), _jsx("select", { value: identificationType, onChange: (event) => setIdentificationType(event.target.value), disabled: !identificationTypes.length, children: identificationTypes.map((type) => (_jsx("option", { value: type.id, children: type.name }, type.id))) })] }), _jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Numero do documento" }), _jsx("input", { type: "text", inputMode: "numeric", placeholder: "CPF/CNPJ", value: identificationNumber, onChange: (event) => setIdentificationNumber(formatIdentificationNumber(event.target.value)) })] })] }), _jsxs("div", { className: "payment-row", children: [_jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Mes" }), _jsx("input", { type: "text", inputMode: "numeric", placeholder: "MM", value: expirationMonth, onChange: (event) => setExpirationMonth(formatMonth(event.target.value)) })] }), _jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Ano" }), _jsx("input", { type: "text", inputMode: "numeric", placeholder: "AAAA", value: expirationYear, onChange: (event) => setExpirationYear(formatYear(event.target.value)) })] }), _jsxs("label", { className: "input-group", children: [_jsx("span", { children: "CVV" }), _jsx("input", { type: "password", inputMode: "numeric", placeholder: "000", value: securityCode, onChange: (event) => setSecurityCode(formatCvv(event.target.value)) })] })] }), issuerOptions.length > 1 && (_jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Banco emissor" }), _jsx("select", { value: issuerId ?? "", onChange: (event) => setIssuerId(event.target.value || null), children: issuerOptions.map((issuer) => (_jsx("option", { value: issuer.id, children: issuer.name }, issuer.id))) })] })), _jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Parcelas" }), _jsx("select", { value: installments, onChange: (event) => setInstallments(Number(event.target.value)), disabled: !installmentOptions.length, children: installmentOptions.length ? (installmentOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value)))) : (_jsx("option", { value: 1, children: "1x" })) })] })] }), _jsxs("div", { className: "payment-actions", children: [_jsx("button", { type: "button", className: "primary-button", disabled: cardLoading || !mpReady, onClick: handleCardPayment, children: cardLoading ? "Processando..." : "Pagar com cartao" }), cardResult && (_jsxs("span", { className: "muted", children: ["Status: ", cardResult.status, cardResult.statusDetail ? ` (${cardResult.statusDetail})` : ""] }))] }), cardError && _jsx("p", { className: "error-text", children: cardError })] }))] }), _jsxs("aside", { className: "checkout-sidebar", children: [_jsx("h4", { children: "Resumo rapido" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "Passo 1:" }), " confirme o plano e a forma de pagamento."] }), _jsxs("li", { children: [_jsx("strong", { children: "Passo 2:" }), " finalize Pix ou cartao."] }), _jsxs("li", { children: [_jsx("strong", { children: "Passo 3:" }), " acesse o painel e crie sua organizacao."] })] }), _jsx("p", { className: "muted", children: "Duvidas? Fale com nosso time durante o onboarding." })] })] }));
};
