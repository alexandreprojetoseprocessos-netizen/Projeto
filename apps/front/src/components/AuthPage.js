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
    return (_jsxs("div", { className: "auth-page", children: [_jsxs("section", { className: "auth-hero", children: [_jsx("div", { className: "auth-hero__logo", children: "G&P" }), _jsxs("div", { className: "auth-hero__content", children: [_jsx("p", { className: "eyebrow", children: "Gest\u00E3o visual, colaborativa e em tempo real" }), _jsx("h1", { children: "Organize seus projetos, equipe e resultados em um s\u00F3 lugar." }), _jsx("p", { className: "subtext", children: "Dashboards inteligentes, kanban em tempo real e integra\u00E7\u00F5es profundas com Supabase e GitHub." })] }), _jsxs("div", { className: "auth-hero__highlights", children: [_jsxs("div", { children: [_jsx("strong", { children: "+120" }), _jsx("span", { children: "Projetos ativos" })] }), _jsxs("div", { children: [_jsx("strong", { children: "98%" }), _jsx("span", { children: "Equipes engajadas" })] })] })] }), _jsx("section", { className: "auth-panel", children: _jsxs("div", { className: "auth-card", children: [_jsxs("header", { className: "auth-card__header", children: [_jsx("p", { children: mode === "login" ? "Bem-vindo de volta" : "Comece em minutos" }), _jsx("h2", { children: mode === "login" ? "Entrar no G&P" : "Crie sua conta" })] }), mode === "register" && selectedPlanName && (_jsxs("p", { className: "auth-selected-plan", children: ["Voc\u00EA est\u00E1 criando sua conta no plano ", _jsx("strong", { children: selectedPlanName }), ". Depois do cadastro vamos configurar o pagamento e a sua primeira organiza\u00E7\u00E3o."] })), mode === "login" && selectedPlanName && (_jsxs("p", { className: "auth-selected-plan", children: ["Voc\u00EA escolheu o plano ", _jsx("strong", { children: selectedPlanName }), " na p\u00E1gina inicial. Fa\u00E7a login para continuar."] })), _jsxs("form", { className: "auth-form", onSubmit: handleSubmit, children: [mode === "register" && (_jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Nome completo" }), _jsx("input", { type: "text", placeholder: "Como devemos te chamar?", value: name, onChange: (event) => setName(event.target.value), required: true })] })), _jsxs("label", { className: "input-group", children: [_jsx("span", { children: "E-mail corporativo" }), _jsx("input", { type: "email", placeholder: "voce@empresa.com", value: email, onChange: (event) => setEmail(event.target.value), required: true })] }), _jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Senha" }), _jsx("input", { type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: (event) => setPassword(event.target.value), required: true })] }), mode === "register" && (_jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Confirme a senha" }), _jsx("input", { type: "password", placeholder: "Repita sua senha", value: confirmPassword, onChange: (event) => setConfirmPassword(event.target.value), required: true })] })), mode === "login" && (_jsx("div", { className: "helper-links", children: _jsx("button", { type: "button", className: "link-button", children: "Esqueci minha senha" }) })), mode === "register" && (_jsxs("div", { className: "auth-options", children: [_jsx("span", { children: "Como voc\u00EA quer come\u00E7ar?" }), _jsxs("div", { className: "radio-group", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "organization-mode", value: "new", checked: orgMode === "new", onChange: () => setOrgMode("new") }), _jsx("span", { children: "Criar nova organiza\u00E7\u00E3o" })] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "organization-mode", value: "invite", checked: orgMode === "invite", onChange: () => setOrgMode("invite") }), _jsx("span", { children: "Entrar em uma existente (convite)" })] })] })] })), _jsx("button", { className: "primary-button", type: "submit", disabled: submitting, children: submitLabel }), displayedError && _jsx("span", { className: "form-error", children: displayedError })] }), _jsxs("div", { className: "auth-social", children: [_jsx("div", { className: "divider", children: _jsx("span", { children: "ou" }) }), _jsx("button", { type: "button", className: "social-button google", children: "Continuar com Google" }), _jsx("button", { type: "button", className: "social-button microsoft", children: "Continuar com Microsoft" })] }), _jsx("div", { className: "auth-toggle", children: mode === "login" ? (_jsxs(_Fragment, { children: [_jsx("span", { children: "Ainda n\u00E3o tem conta?" }), _jsx("button", { type: "button", onClick: () => setMode("register"), children: "Criar conta" })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { children: "J\u00E1 tem conta?" }), _jsx("button", { type: "button", onClick: () => setMode("login"), children: "Entrar" })] })) })] }) })] }));
};
