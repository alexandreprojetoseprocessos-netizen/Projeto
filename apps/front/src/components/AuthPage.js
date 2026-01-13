import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
export const AuthPage = ({ onSubmit, onSignUp, error }) => {
    const location = useLocation();
    const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const selectedPlan = params.get("plan");
    const [mode, setMode] = useState("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [orgMode, setOrgMode] = useState("new");
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState(null);
    const planNameMap = {
        START: "Start",
        BUSINESS: "Business",
        ENTERPRISE: "Enterprise"
    };
    const selectedPlanName = selectedPlan ? planNameMap[selectedPlan] ?? selectedPlan : null;
    useEffect(() => {
        if (selectedPlan) {
            window.localStorage.setItem("gp:selectedPlan", selectedPlan);
        }
    }, [selectedPlan]);
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLocalError(null);
        setSubmitting(true);
        try {
            if (mode === "register") {
                if (password !== confirmPassword) {
                    setLocalError("As senhas não coincidem.");
                    return;
                }
                await onSignUp({ email, password });
            }
            else {
                await onSubmit({ email, password });
            }
        }
        catch (submitError) {
            setLocalError(submitError instanceof Error ? submitError.message : "Não foi possível completar a solicitação.");
        }
        finally {
            setSubmitting(false);
        }
    };
    const displayedError = localError ?? error ?? null;
    const submitLabel = submitting ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta";
    return (_jsx("div", { className: "auth-page", children: _jsx("section", { className: "auth-panel", children: _jsxs("div", { className: "auth-card", children: [_jsxs("header", { className: "auth-card__header", children: [_jsxs("div", { className: "auth-brand", children: [_jsx("img", { className: "auth-logo", src: "/logo-gp.svg", alt: "G&P", width: 44, height: 44 }), _jsxs("div", { className: "auth-brand__text", children: [_jsx("span", { className: "auth-brand__name", children: "G&P \u2014 Gest\u00E3o de Projetos" }), _jsx("span", { className: "auth-brand__subtitle", children: "Gest\u00E3o visual, colaborativa e em tempo real" })] })] }), _jsxs("div", { className: "auth-card__intro", children: [_jsx("p", { children: mode === "login" ? "Bem-vindo de volta" : "Comece em minutos" }), _jsx("h2", { children: mode === "login" ? "Entrar no G&P" : "Crie sua conta" })] })] }), mode === "register" && selectedPlanName && (_jsxs("p", { className: "auth-selected-plan", children: ["Voc\u00EA est\u00E1 criando sua conta no plano ", _jsx("strong", { children: selectedPlanName }), ". Depois do cadastro vamos configurar o pagamento e a sua primeira organiza\u00E7\u00E3o."] })), mode === "login" && selectedPlanName && (_jsxs("p", { className: "auth-selected-plan", children: ["Voc\u00EA escolheu o plano ", _jsx("strong", { children: selectedPlanName }), " na p\u00E1gina inicial. Fa\u00E7a login para continuar."] })), _jsxs("form", { className: "auth-form", onSubmit: handleSubmit, children: [mode === "register" && (_jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Nome completo" }), _jsx("input", { type: "text", placeholder: "Como devemos te chamar?", value: name, onChange: (event) => setName(event.target.value), required: true })] })), _jsxs("label", { className: "input-group", children: [_jsx("span", { children: "E-mail corporativo" }), _jsx("input", { type: "email", placeholder: "nome@empresa.com", value: email, onChange: (event) => setEmail(event.target.value), required: true })] }), _jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Senha" }), _jsx("input", { type: "password", placeholder: "Digite sua senha", value: password, onChange: (event) => setPassword(event.target.value), required: true })] }), mode === "register" && (_jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Confirme a senha" }), _jsx("input", { type: "password", placeholder: "Repita sua senha", value: confirmPassword, onChange: (event) => setConfirmPassword(event.target.value), required: true })] })), mode === "login" && (_jsx("div", { className: "helper-links", children: _jsx("button", { type: "button", className: "link-button", children: "Esqueci minha senha" }) })), mode === "register" && (_jsxs("div", { className: "auth-options", children: [_jsx("span", { children: "Como voc\u00EA quer come\u00E7ar?" }), _jsxs("div", { className: "radio-group", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "organization-mode", value: "new", checked: orgMode === "new", onChange: () => setOrgMode("new") }), _jsx("span", { children: "Criar nova organiza\u00E7\u00E3o" })] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "organization-mode", value: "invite", checked: orgMode === "invite", onChange: () => setOrgMode("invite") }), _jsx("span", { children: "Entrar em uma existente (convite)" })] })] })] })), _jsx("button", { className: "primary-button", type: "submit", disabled: submitting, "data-loading": submitting, children: submitLabel }), displayedError && _jsx("span", { className: "form-error", children: displayedError })] }), _jsxs("div", { className: "auth-social", children: [_jsx("div", { className: "divider", children: _jsx("span", { children: "ou" }) }), _jsxs("button", { type: "button", className: "social-button google", children: [_jsx("span", { className: "social-icon", "aria-hidden": "true", children: _jsx("svg", { viewBox: "0 0 24 24", focusable: "false", "aria-hidden": "true", children: _jsx("path", { fill: "currentColor", d: "M21.805 10.023h-9.18v3.96h5.253c-.226 1.216-1.356 3.56-5.253 3.56-3.159 0-5.737-2.616-5.737-5.833 0-3.217 2.578-5.833 5.737-5.833 1.8 0 3 .76 3.69 1.416l2.52-2.43C17.19 2.44 15.18 1.5 12.625 1.5 7.807 1.5 3.875 5.435 3.875 10.25c0 4.816 3.932 8.75 8.75 8.75 5.04 0 8.38-3.54 8.38-8.537 0-.575-.063-1.013-.142-1.44z" }) }) }), _jsx("span", { children: "Continuar com Google" })] }), _jsxs("button", { type: "button", className: "social-button microsoft", children: [_jsx("span", { className: "social-icon", "aria-hidden": "true", children: _jsxs("svg", { viewBox: "0 0 24 24", focusable: "false", "aria-hidden": "true", children: [_jsx("rect", { x: "2", y: "2", width: "9", height: "9", fill: "#f25022" }), _jsx("rect", { x: "13", y: "2", width: "9", height: "9", fill: "#7fba00" }), _jsx("rect", { x: "2", y: "13", width: "9", height: "9", fill: "#00a4ef" }), _jsx("rect", { x: "13", y: "13", width: "9", height: "9", fill: "#ffb900" })] }) }), _jsx("span", { children: "Continuar com Microsoft" })] })] }), _jsx("div", { className: "auth-toggle", children: mode === "login" ? (_jsxs(_Fragment, { children: [_jsx("span", { children: "Ainda n\u00E3o tem conta?" }), _jsx("button", { type: "button", onClick: () => setMode("register"), children: "Criar conta" })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { children: "J\u00E1 tem conta?" }), _jsx("button", { type: "button", onClick: () => setMode("login"), children: "Entrar" })] })) })] }) }) }));
};
