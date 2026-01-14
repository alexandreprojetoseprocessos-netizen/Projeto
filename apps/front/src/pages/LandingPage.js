import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ANNUAL_DISCOUNT_LABEL, PLAN_DEFINITIONS, formatMonthlyPrice } from "../config/plans";
const plans = [
    PLAN_DEFINITIONS.START,
    PLAN_DEFINITIONS.BUSINESS,
    PLAN_DEFINITIONS.ENTERPRISE
].map((plan) => ({
    code: plan.code,
    name: plan.displayName,
    price: formatMonthlyPrice(plan.priceCents),
    description: plan.marketing.description,
    tag: plan.marketing.badge,
    features: plan.marketing.features
}));
const features = [
    {
        title: "Kanban",
        description: "Avançado com limites WIP.",
        icon: (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("rect", { x: "3", y: "4", width: "6", height: "16", rx: "2" }), _jsx("rect", { x: "10", y: "4", width: "6", height: "10", rx: "2" }), _jsx("rect", { x: "17", y: "4", width: "4", height: "14", rx: "2" })] }))
    },
    {
        title: "EAP",
        description: "EDT colaborativa e versões.",
        icon: (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { cx: "6", cy: "6", r: "2" }), _jsx("circle", { cx: "18", cy: "6", r: "2" }), _jsx("circle", { cx: "12", cy: "18", r: "2" }), _jsx("path", { d: "M8 6h8M12 8v8" })] }))
    },
    {
        title: "Cronograma",
        description: "Dependências e marcos críticos.",
        icon: (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("rect", { x: "3", y: "5", width: "18", height: "16", rx: "2" }), _jsx("path", { d: "M8 3v4M16 3v4M3 9h18" }), _jsx("path", { d: "M10.5 14.5l1.5 1.5 3-3" })] }))
    },
    {
        title: "Documentos",
        description: "Docs, anexos e aprovações.",
        icon: (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" }), _jsx("path", { d: "M14 3v5h5" }), _jsx("path", { d: "M9 13h6M9 17h6" })] }))
    },
    {
        title: "Portfólio",
        description: "Indicadores em tempo real.",
        icon: (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("rect", { x: "4", y: "5", width: "16", height: "6", rx: "2" }), _jsx("rect", { x: "4", y: "13", width: "10", height: "6", rx: "2" }), _jsx("rect", { x: "15", y: "13", width: "5", height: "6", rx: "2" })] }))
    }
];
const portfolioMetrics = [
    { label: "Board", value: "45 cards" },
    { label: "Cronograma", value: "12 marcos" },
    { label: "Riscos", value: "3 abertos" }
];
const statusItems = [
    { label: "Projetos em dia", tone: "ok" },
    { label: "Projetos em atenção", tone: "warn" },
    { label: "Projetos críticos", tone: "risk" }
];
const executionProgress = 58;
const steps = [
    {
        title: "Escolha o plano",
        description: "Compare os planos e clique em \"Escolher plano\"."
    },
    {
        title: "Crie sua conta",
        description: "Cadastre e confirme seu e-mail em segundos."
    },
    {
        title: "Faça o pagamento",
        description: "Cartão de crédito via Mercado Pago."
    },
    {
        title: "Crie sua organização e projetos",
        description: "Convide o time, crie quadros, cronogramas e relatórios."
    }
];
const LandingPage = () => {
    const navigate = useNavigate();
    const planCards = useMemo(() => plans.map((plan) => {
        const isRecommended = plan.code === "BUSINESS";
        return (_jsxs("article", { className: `landing-plan-card${isRecommended ? " is-recommended" : ""}`, "data-plan-code": plan.code, children: [_jsxs("div", { className: "landing-plan-card__header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: plan.code }), _jsx("h3", { children: plan.name }), _jsx("p", { className: "subtext", children: plan.description })] }), _jsxs("div", { className: "landing-plan-card__badges", children: [plan.tag && _jsx("span", { className: "chip chip-soft", children: plan.tag }), isRecommended && _jsx("span", { className: "chip chip-primary", children: "Recomendado" })] })] }), _jsx("div", { className: "landing-plan-card__price", children: plan.price }), _jsx("p", { className: "subtext", children: ANNUAL_DISCOUNT_LABEL }), _jsx("ul", { className: "landing-plan-card__features", children: plan.features.map((feature) => (_jsx("li", { children: feature }, feature))) }), _jsx("button", { type: "button", className: "primary-button", onClick: () => {
                        navigate(`/auth?plan=${plan.code}`);
                    }, children: "Escolher plano" })] }, plan.code));
    }), [navigate]);
    const featureCards = useMemo(() => features.map((feature) => (_jsxs("article", { className: "feature-card", children: [_jsx("span", { className: "feature-card__icon", "aria-hidden": "true", children: feature.icon }), _jsx("h3", { children: feature.title }), _jsx("p", { children: feature.description })] }, feature.title))), []);
    return (_jsxs("div", { className: "landing-shell", children: [_jsx("section", { className: "landing-hero", children: _jsxs("div", { className: "landing-container landing-hero__grid", children: [_jsxs("div", { className: "landing-hero__content", children: [_jsxs("div", { className: "landing-hero__tagline", children: [_jsx("span", { className: "chip chip-soft", children: "G&P \u2014 Gest\u00E3o de Projetos" }), _jsx("span", { className: "chip chip-outline", children: "Times e PMOs" })] }), _jsx("h1", { children: "Planeje, execute e me\u00E7a cada projeto em um s\u00F3 lugar." }), _jsx("p", { className: "subtext", children: "Multi-organiza\u00E7\u00F5es, EDT colaborativa, quadros Kanban, cronograma Gantt, relat\u00F3rios avan\u00E7ados e portf\u00F3lio em tempo real. Tudo pensado para PMOs, squads e consultorias." }), _jsxs("div", { className: "landing-hero__actions", children: [_jsx("button", { type: "button", className: "primary-button", onClick: () => navigate("/auth?plan=START"), children: "Come\u00E7ar agora" }), _jsx("button", { type: "button", className: "ghost-button", onClick: () => navigate("/dashboard"), children: "Ver demo r\u00E1pida" })] })] }), _jsxs("div", { className: "landing-hero__visual", "aria-hidden": "true", children: [_jsxs("div", { className: "landing-hero__card", children: [_jsxs("div", { className: "landing-hero__card-header", children: [_jsx("p", { className: "eyebrow", children: "Status semanal" }), _jsx("span", { className: "landing-hero__pill", children: "Atualizado hoje" })] }), _jsx("h4", { children: "Portf\u00F3lio ativo" }), _jsx("div", { className: "landing-hero__metrics", children: portfolioMetrics.map((item) => (_jsxs("div", { children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value })] }, item.label))) }), _jsxs("div", { className: "landing-hero__progress", children: [_jsx("span", { children: "Execu\u00E7\u00E3o" }), _jsxs("div", { className: "landing-progress", children: [_jsx("div", { className: "landing-progress__bar", children: _jsx("div", { className: "landing-progress__fill", style: { width: `${executionProgress}%` } }) }), _jsxs("small", { children: [executionProgress, "% conclu\u00EDdo"] })] })] })] }), _jsx("div", { className: "landing-hero__glow" })] })] }) }), _jsx("section", { className: "landing-features", children: _jsxs("div", { className: "landing-container", children: [_jsxs("header", { className: "landing-section__header", children: [_jsx("p", { className: "eyebrow", children: "Benef\u00EDcios" }), _jsx("h2", { children: "Recursos que d\u00E3o clareza ao portf\u00F3lio" }), _jsx("p", { className: "subtext", children: "Organize ponta a ponta com vis\u00F5es claras para times e PMOs." })] }), _jsx("div", { className: "landing-features__grid", children: featureCards })] }) }), _jsx("section", { className: "landing-dashboard", children: _jsxs("div", { className: "landing-container", children: [_jsxs("header", { className: "landing-section__header", children: [_jsx("p", { className: "eyebrow", children: "Dashboard preview" }), _jsx("h2", { children: "Status semanal com leitura instant\u00E2nea" }), _jsx("p", { className: "subtext", children: "Do overview ao detalhe, tudo em um fluxo visual e colaborativo." })] }), _jsxs("div", { className: "landing-dashboard__grid", children: [_jsxs("article", { className: "landing-dashboard__card", children: [_jsx("p", { className: "eyebrow", children: "Status semanal" }), _jsx("h3", { children: "Vis\u00E3o geral" }), _jsx("ul", { className: "landing-status-list", children: statusItems.map((item) => (_jsxs("li", { children: [_jsx("span", { className: `status-dot ${item.tone}` }), _jsx("span", { children: item.label })] }, item.label))) })] }), _jsxs("article", { className: "landing-dashboard__card", children: [_jsx("p", { className: "eyebrow", children: "Portf\u00F3lio ativo" }), _jsx("h3", { children: "Indicadores do dia" }), _jsx("ul", { className: "landing-metrics-list", children: portfolioMetrics.map((item) => (_jsxs("li", { children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value })] }, item.label))) })] }), _jsxs("article", { className: "landing-dashboard__card", children: [_jsx("p", { className: "eyebrow", children: "Execu\u00E7\u00E3o" }), _jsx("h3", { children: "Progresso do portf\u00F3lio" }), _jsxs("div", { className: "landing-progress is-large", children: [_jsx("div", { className: "landing-progress__bar", children: _jsx("div", { className: "landing-progress__fill", style: { width: `${executionProgress}%` } }) }), _jsxs("small", { children: [executionProgress, "% conclu\u00EDdo"] })] }), _jsx("p", { className: "landing-dashboard__note", children: "Sprints e marcos sincronizados com o time." })] })] })] }) }), _jsx("section", { className: "landing-plans", children: _jsxs("div", { className: "landing-container", children: [_jsxs("header", { className: "landing-section__header", children: [_jsx("p", { className: "eyebrow", children: "Planos" }), _jsx("h2", { children: "Escolha o plano ideal para sua opera\u00E7\u00E3o" }), _jsx("p", { className: "subtext", children: "Migra\u00E7\u00E3o r\u00E1pida entre planos. Sem limite de usu\u00E1rios." })] }), _jsx("div", { className: "landing-plans__grid", children: planCards })] }) }), _jsx("section", { className: "landing-steps", children: _jsxs("div", { className: "landing-container", children: [_jsxs("header", { className: "landing-section__header", children: [_jsx("p", { className: "eyebrow", children: "Como funciona" }), _jsx("h2", { children: "Da escolha do plano ao primeiro projeto" }), _jsx("p", { className: "subtext", children: "Fluxo simples em 4 passos para colocar sua equipe em produ\u00E7\u00E3o." })] }), _jsx("div", { className: "landing-steps__grid", children: steps.map((step, index) => (_jsxs("article", { className: "landing-step-card", children: [_jsx("span", { className: "landing-step-card__badge", children: index + 1 }), _jsx("h3", { children: step.title }), _jsx("p", { children: step.description })] }, step.title))) })] }) })] }));
};
export default LandingPage;
