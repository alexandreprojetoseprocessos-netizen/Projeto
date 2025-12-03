import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
const plans = [
    {
        code: "START",
        name: "Start",
        price: "R$ 0",
        description: "Para validar processos e criar as primeiras entregas.",
        tag: "Popular",
        features: ["Ate 2 organizacoes", "3 projetos por organizacao", "Usuarios ilimitados"]
    },
    {
        code: "BUSINESS",
        name: "Business",
        price: "R$ 199/mes",
        description: "Portfolio, aprovacoes e automatizacoes para squads multiplas.",
        features: ["Ate 10 organizacoes", "12 projetos por organizacao", "Permissoes avancadas"]
    },
    {
        code: "ENTERPRISE",
        name: "Enterprise",
        price: "Fale com vendas",
        description: "Suporte dedicado, SSO e limites customizados.",
        features: ["Organizacoes ilimitadas", "Projetos ilimitados", "SLAs e onboarding premium"]
    }
];
const highlights = [
    "Kanban avancado com limites WIP",
    "EDT colaborativa e versoes",
    "Cronograma com dependencias",
    "Docs, anexos e aprovacoes",
    "Portfolio e indicadores em tempo real"
];
const steps = [
    {
        title: "Escolha o plano",
        description: "Compare os planos e clique em “Escolher plano”."
    },
    {
        title: "Crie sua conta",
        description: "Cadastre e confirme seu e-mail em segundos."
    },
    {
        title: "Faca o pagamento",
        description: "Cartao, Pix ou boleto (entra no proximo bloco)."
    },
    {
        title: "Crie sua organizacao e projetos",
        description: "Convide o time, crie quadros, cronogramas e relatorios."
    }
];
const LandingPage = () => {
    const navigate = useNavigate();
    const planCards = useMemo(() => plans.map((plan) => (_jsxs("article", { className: "landing-plan-card", "data-plan-code": plan.code, children: [_jsxs("div", { className: "landing-plan-card__header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: plan.code }), _jsx("h3", { children: plan.name }), _jsx("p", { className: "subtext", children: plan.description })] }), plan.tag && _jsx("span", { className: "chip chip-primary", children: plan.tag })] }), _jsx("div", { className: "landing-plan-card__price", children: plan.price }), _jsx("ul", { className: "landing-plan-card__features", children: plan.features.map((feature) => (_jsx("li", { children: feature }, feature))) }), _jsx("button", { type: "button", className: "primary-button", onClick: () => {
                    navigate(`/auth?plan=${plan.code}`);
                }, children: "Escolher plano" })] }, plan.code))), [navigate]);
    return (_jsxs("div", { className: "landing-shell", children: [_jsxs("section", { className: "landing-hero", children: [_jsxs("div", { className: "landing-hero__content", children: [_jsxs("div", { className: "landing-hero__tagline", children: [_jsx("span", { className: "chip chip-soft", children: "G&P \u2022 Gestao de Projetos" }), _jsx("span", { className: "chip chip-outline", children: "Times e PMOs" })] }), _jsx("h1", { children: "Planeje, execute e meca cada projeto em um so lugar." }), _jsx("p", { className: "subtext", children: "Multi-organizacoes, EDT colaborativa, quadros Kanban, cronograma Gantt, relatorios avancados e portfolio em tempo real. Tudo pensado para PMOs, squads e consultorias." }), _jsxs("div", { className: "landing-hero__actions", children: [_jsx("button", { type: "button", className: "primary-button", onClick: () => navigate("/auth?plan=START"), children: "Comecar agora" }), _jsx("button", { type: "button", className: "ghost-button", onClick: () => navigate("/dashboard"), children: "Ver demo rapida" })] }), _jsx("div", { className: "landing-hero__highlights", children: highlights.map((item) => (_jsx("span", { className: "chip chip-soft", children: item }, item))) })] }), _jsxs("div", { className: "landing-hero__visual", "aria-hidden": true, children: [_jsxs("div", { className: "landing-hero__glass", children: [_jsx("p", { className: "eyebrow", children: "Status semanal" }), _jsx("h4", { children: "Portfolio ativo" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("span", { children: "Board" }), _jsx("strong", { children: "45 cards" })] }), _jsxs("li", { children: [_jsx("span", { children: "Cronograma" }), _jsx("strong", { children: "12 marcos" })] }), _jsxs("li", { children: [_jsx("span", { children: "Riscos" }), _jsx("strong", { children: "3 abertos" })] })] }), _jsxs("div", { className: "landing-hero__progress", children: [_jsx("span", { children: "Execucao" }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-bar__fill", style: { width: "68%" } }) }), _jsx("small", { children: "68% concluido" })] })] }), _jsx("div", { className: "landing-hero__glow" })] })] }), _jsxs("section", { className: "landing-plans", children: [_jsxs("header", { className: "landing-plans__header", children: [_jsx("p", { className: "eyebrow", children: "Planos" }), _jsx("h2", { children: "Escolha o plano ideal para sua operacao" }), _jsx("p", { className: "subtext", children: "Migracao rapida entre planos. Sem limite de usuarios." })] }), _jsx("div", { className: "landing-plans__grid", children: planCards })] }), _jsxs("section", { className: "landing-steps", children: [_jsxs("header", { className: "landing-steps__header", children: [_jsx("p", { className: "eyebrow", children: "Como funciona" }), _jsx("h2", { children: "Da escolha do plano ao primeiro projeto" }), _jsx("p", { className: "subtext", children: "Fluxo simples em 4 passos para colocar sua equipe em producao." })] }), _jsx("div", { className: "landing-steps__grid", children: steps.map((step, index) => (_jsxs("article", { className: "landing-step-card", children: [_jsx("span", { className: "landing-step-card__badge", children: index + 1 }), _jsx("h3", { children: step.title }), _jsx("p", { children: step.description })] }, step.title))) })] })] }));
};
export default LandingPage;
