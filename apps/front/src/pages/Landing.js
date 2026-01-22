import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, BarChart3, Building2, CheckCircle2, FolderKanban, LayoutDashboard, ListTree, Rocket, Shield, Sparkles, Star, Users, Zap, } from "lucide-react";
const Landing = () => {
    const navigate = useNavigate();
    const { status, token } = useAuth();
    const buildStamp = import.meta.env.VITE_BUILD_ID ?? `dev-${new Date().toISOString()}`;
    const [billingPeriod, setBillingPeriod] = useState("monthly");
    const plans = [
        {
            id: "start",
            name: "Start",
            badge: "START",
            description: "Ideal para validação e projetos iniciais",
            price: billingPeriod === "monthly" ? 49 : 44.10,
            icon: Rocket,
            features: [
                "1 organização",
                "Até 3 projetos por organização",
                "Controle essencial de tarefas",
                "Economize 10% no plano anual",
            ],
            recommended: false,
        },
        {
            id: "business",
            name: "Business",
            badge: "BUSINESS",
            description: "Para PMOs, consultorias e times em crescimento",
            price: billingPeriod === "monthly" ? 97 : 87.30,
            icon: Building2,
            features: [
                "Até 3 organizações",
                "Até 3 projetos por organização",
                "Relatórios e visão de portfólio",
                "Economize 10% no plano anual",
            ],
            recommended: true,
        },
        {
            id: "enterprise",
            name: "Enterprise",
            badge: "ENTERPRISE",
            description: "Para operações maduras e grandes equipes",
            price: billingPeriod === "monthly" ? 199 : 179.10,
            icon: Zap,
            features: [
                "Organizações ilimitadas",
                "Projetos ilimitados",
                "Suporte prioritário",
                "Economize 10% no plano anual",
            ],
            recommended: false,
        },
    ];
    const features = [
        {
            icon: LayoutDashboard,
            title: "Dashboard Inteligente",
            description: "Visualize KPIs, progresso e métricas em tempo real com gráficos interativos.",
        },
        {
            icon: FolderKanban,
            title: "Kanban Visual",
            description: "Gerencie tarefas de forma visual com quadros personalizáveis e drag-and-drop.",
        },
        {
            icon: ListTree,
            title: "EAP Completa",
            description: "Estruture seus projetos com a Estrutura Analítica do Projeto hierárquica.",
        },
        {
            icon: Users,
            title: "Gestão de Equipes",
            description: "Atribua responsáveis, acompanhe performance e colabore em tempo real.",
        },
        {
            icon: BarChart3,
            title: "Relatórios Avançados",
            description: "Gere relatórios detalhados de progresso, custos e prazos automaticamente.",
        },
        {
            icon: Shield,
            title: "Segurança Total",
            description: "Seus dados protegidos com criptografia e backups automáticos diários.",
        },
    ];
    const metrics = [
        {
            icon: BarChart3,
            label: "Projetos monitorados",
            value: "1.240+",
        },
        {
            icon: Users,
            label: "Times ativos",
            value: "320+",
        },
        {
            icon: LayoutDashboard,
            label: "Relatórios gerados",
            value: "12k",
        },
        {
            icon: Shield,
            label: "SLA de uptime",
            value: "99,9%",
        },
    ];
    const testimonials = [
        {
            name: "Marina Costa",
            role: "PMO, Grupo Atlas",
            initials: "MC",
            quote: "Em 3 semanas já tínhamos visibilidade total do portfólio. O time ganhou ritmo e o board virou referência diária.",
        },
        {
            name: "Renato Silva",
            role: "Head de Operações, Nexa",
            initials: "RS",
            quote: "A plataforma simplificou nossa governança. Conseguimos reduzir atrasos e ganhar previsibilidade nos marcos.",
        },
        {
            name: "Juliana Freitas",
            role: "Consultoria PMO, Elevare",
            initials: "JF",
            quote: "Clientes enxergam o progresso em tempo real. Os relatórios saem prontos e o acompanhamento ficou muito mais leve.",
        },
    ];
    const faqs = [
        {
            question: "Posso testar antes de assinar",
            answer: "Sim! Oferecemos 14 dias de teste grátis em todos os planos, sem necessidade de cartão de crédito. Você pode explorar todas as funcionalidades antes de decidir.",
        },
        {
            question: "Como funciona a migração entre planos",
            answer: "A migração é instantânea e pode ser feita a qualquer momento. Ao fazer upgrade, você terá acesso imediato às novas funcionalidades. Em caso de downgrade, as mudanças entram em vigor no próximo ciclo de faturamento.",
        },
        {
            question: "Existe limite de usuários",
            answer: "Não! Todos os planos permitem usuários ilimitados. Você paga apenas pelo plano escolhido, independente do tamanho da sua equipe.",
        },
        {
            question: "Meus dados estão seguros",
            answer: "Absolutamente. Utilizamos criptografia, servidores seguros e realizamos backups automáticos diários. Seus dados são sua propriedade e você pode exportá-los a qualquer momento.",
        },
        {
            question: "Vocês oferecem suporte",
            answer: "Sim! Todos os planos incluem suporte por email. O plano Enterprise oferece suporte prioritário com tempo de resposta garantido e atendimento via chat.",
        },
        {
            question: "Posso cancelar a qualquer momento",
            answer: "Sim, você pode cancelar sua assinatura a qualquer momento. Não há multas. Você mantém o acesso até o fim do período pago.",
        },
    ];
    const goLogin = () => navigate("/auth");
    const handlePlanSelect = (planCode) => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem("gp:selectedPlan", planCode);
        }
        if (status === "authenticated" && token) {
            navigate("/checkout");
            return;
        }
        navigate(`/auth?plan=${planCode}`);
    };
    const goStart = () => navigate("/auth?plan=START");
    const goDemo = () => navigate("/dashboard");
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsxs("div", { style: {
                    position: "fixed",
                    top: 8,
                    left: 8,
                    zIndex: 9999,
                    background: "#000",
                    color: "#fff",
                    padding: "4px 8px",
                    borderRadius: 8,
                    fontSize: 12
                }, children: ["LANDING_NEW_OK ", import.meta.env.VITE_BUILD_ID || "dev"] }), _jsx("header", { className: "border-b border-border/60 bg-white sticky top-0 z-50 shadow-sm", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex items-center justify-between h-16", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-primary flex items-center justify-center", children: _jsx("span", { className: "text-primary-foreground font-bold text-sm", children: "G&P" }) }), _jsx("span", { className: "font-semibold text-foreground", children: "Gest\u00E3o de Projetos" })] }), _jsxs("nav", { className: "hidden md:flex items-center gap-6 text-sm font-medium text-slate-500", children: [_jsx("a", { href: "#features", className: "hover:text-slate-900 transition-colors", children: "Recursos" }), _jsx("a", { href: "#pricing", className: "hover:text-slate-900 transition-colors", children: "Pre\u00E7os" }), _jsx("a", { href: "#faq", className: "hover:text-slate-900 transition-colors", children: "FAQ" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Button, { variant: "outline", onClick: goLogin, className: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50", children: "Entrar" }), _jsx(Button, { onClick: goStart, className: "bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-full px-5", children: "Come\u00E7ar Gr\u00E1tis" })] })] }) }) }), _jsxs("section", { className: "py-20 lg:py-32 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.28),_transparent_60%)] relative overflow-hidden", children: [_jsx("div", { className: "absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative", children: [_jsxs(Badge, { className: "mb-4 rounded-full bg-blue-100 text-blue-700 border border-blue-200 px-4 py-1 shadow-sm inline-flex items-center gap-2", children: [_jsx(Sparkles, { className: "w-4 h-4" }), "Nova vers\u00E3o"] }), _jsxs("h1", { className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight", children: [_jsx("span", { className: "text-slate-800", children: "Gest\u00E3o de Projetos" }), _jsx("br", {}), _jsx("span", { className: "text-blue-600", children: "Simplificada e Poderosa" })] }), _jsx("p", { className: "text-xl text-muted-foreground max-w-2xl mx-auto mb-8", children: "Planeje, execute e monitore seus projetos com uma plataforma completa. Dashboard, Kanban, EAP e muito mais em um s\u00F3 lugar." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsxs(Button, { size: "lg", onClick: goStart, className: "h-12 rounded-full px-6 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md", children: ["Come\u00E7ar Gr\u00E1tis ", _jsx(ArrowRight, { className: "w-4 h-4" })] }), _jsx(Button, { size: "lg", variant: "outline", onClick: goDemo, className: "h-12 rounded-full px-6 bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50", children: "Ver Demonstra\u00E7\u00E3o" })] }), _jsx("p", { className: "text-sm text-slate-500 mt-4", children: "14 dias gr\u00E1tis \u2022 Sem cart\u00E3o de cr\u00E9dito \u2022 Cancele quando quiser" })] })] }), _jsx("section", { className: "py-12", children: _jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-4 gap-6", children: metrics.map((metric, index) => (_jsxs("div", { className: "flex items-center gap-4 rounded-2xl border border-border/60 bg-white px-5 py-4 shadow-sm", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-slate-100 text-blue-600 flex items-center justify-center", children: _jsx(metric.icon, { className: "w-6 h-6" }) }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "text-sm text-slate-500", children: metric.label }), _jsx("p", { className: "text-2xl font-bold text-slate-900", children: metric.value })] })] }, index))) }) }) }), _jsx("section", { className: "py-20 bg-muted/30", id: "features", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-3xl md:text-4xl font-bold text-foreground mb-4", children: "Tudo que voc\u00EA precisa para gerenciar projetos" }), _jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: "Ferramentas profissionais para equipes de todos os tamanhos" })] }), _jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-8", children: features.map((feature, index) => (_jsx(Card, { className: "border-border/50 bg-card/50 backdrop-blur rounded-2xl shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all", children: _jsxs(CardContent, { className: "pt-8 text-center", children: [_jsx("div", { className: "w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4 mx-auto", children: _jsx(feature.icon, { className: "w-7 h-7 text-blue-600" }) }), _jsx("h3", { className: "text-lg font-semibold text-foreground mb-2", children: feature.title }), _jsx("p", { className: "text-muted-foreground", children: feature.description })] }) }, index))) })] }) }), _jsx("section", { className: "py-20", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h2", { className: "text-3xl md:text-4xl font-bold text-foreground mb-4", children: "Times que confiam na plataforma" }), _jsx("p", { className: "text-lg text-muted-foreground", children: "Hist\u00F3rias reais de equipes que elevaram a execu\u00E7\u00E3o." })] }), _jsx("div", { className: "grid md:grid-cols-3 gap-6", children: testimonials.map((testimonial, index) => (_jsx(Card, { className: "border-border/60 bg-card/80 rounded-2xl shadow-lg shadow-black/5", children: _jsxs(CardContent, { className: "pt-6 flex flex-col gap-4", children: [_jsx("div", { className: "flex items-center gap-1", children: Array.from({ length: 5 }).map((_, starIndex) => (_jsx(Star, { className: "w-4 h-4 text-amber-400 fill-amber-400" }, starIndex))) }), _jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: testimonial.quote }), _jsxs("div", { className: "flex items-center gap-3 pt-2", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm", children: testimonial.initials }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-foreground", children: testimonial.name }), _jsx("p", { className: "text-xs text-muted-foreground", children: testimonial.role })] })] })] }) }, index))) })] }) }), _jsx("section", { className: "py-20", id: "pricing", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h2", { className: "text-3xl md:text-4xl font-bold text-foreground mb-4", children: "Escolha o plano ideal para sua opera\u00E7\u00E3o" }), _jsx("p", { className: "text-lg text-muted-foreground mb-8", children: "Migra\u00E7\u00E3o r\u00E1pida entre planos. Sem limite de usu\u00E1rios." }), _jsxs("div", { className: "inline-flex items-center gap-4 p-1 bg-slate-100 border border-slate-200 rounded-xl shadow-sm", children: [_jsx("button", { onClick: () => setBillingPeriod("monthly"), className: `px-5 py-2 rounded-md text-sm font-semibold transition-all border border-slate-200 ${billingPeriod === "monthly"
                                                ? "bg-blue-600 text-white shadow-md border-blue-600"
                                                : "bg-white text-slate-500 hover:text-slate-900"}`, children: "Mensal" }), _jsxs("button", { onClick: () => setBillingPeriod("yearly"), className: `px-5 py-2 rounded-md text-sm font-semibold transition-all border border-slate-200 ${billingPeriod === "yearly"
                                                ? "bg-blue-600 text-white shadow-md border-blue-600"
                                                : "bg-white text-slate-500 hover:text-slate-900"}`, children: ["Anual ", _jsx(Badge, { variant: "secondary", className: "ml-2 text-xs", children: "-10%" })] })] })] }), _jsx("div", { className: "grid md:grid-cols-3 gap-8 max-w-5xl mx-auto", children: plans.map((plan) => (_jsxs(Card, { className: `relative overflow-hidden transition-all hover:shadow-xl ${plan.recommended
                                    ? "border-blue-600 shadow-xl scale-[1.05] ring-1 ring-blue-200"
                                    : "border-border/50"}`, children: [plan.recommended && (_jsx("div", { className: "absolute top-0 right-0", children: _jsx(Badge, { className: "rounded-none rounded-bl-lg bg-blue-600 text-white", children: "Recomendado" }) })), _jsxs(CardHeader, { className: "text-center pb-4", children: [_jsx(Badge, { variant: "outline", className: "w-fit mx-auto mb-3 text-xs font-semibold", children: plan.badge }), _jsx("div", { className: "w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-3", children: _jsx(plan.icon, { className: "w-6 h-6 text-blue-600" }) }), _jsx("h3", { className: "text-xl font-bold text-foreground", children: plan.name }), _jsx("p", { className: "text-sm text-muted-foreground", children: plan.description })] }), _jsxs(CardContent, { className: "text-center", children: [_jsxs("div", { className: "mb-6", children: [_jsxs("span", { className: "text-4xl font-bold text-foreground", children: ["R$ ", plan.price.toFixed(2).replace(".", ",")] }), _jsx("span", { className: "text-muted-foreground", children: " / m\u00EAs" })] }), _jsx("ul", { className: "space-y-3 mb-6 text-left", children: plan.features.map((feature, idx) => (_jsxs("li", { className: "flex items-start gap-2", children: [_jsx(CheckCircle2, { className: "w-5 h-5 text-blue-600 shrink-0 mt-0.5" }), _jsx("span", { className: "text-sm text-muted-foreground", children: feature })] }, idx))) }), _jsx(Button, { className: "w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md", onClick: () => handlePlanSelect(plan.badge), children: "Escolher plano" })] })] }, plan.id))) })] }) }), _jsx("section", { className: "py-20 bg-muted/30", id: "faq", children: _jsxs("div", { className: "max-w-3xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h2", { className: "text-3xl md:text-4xl font-bold text-foreground mb-4", children: "Perguntas Frequentes" }), _jsx("p", { className: "text-lg text-muted-foreground", children: "Tire suas d\u00FAvidas sobre a plataforma" })] }), _jsx(Accordion, { type: "single", collapsible: true, className: "space-y-4", children: faqs.map((faq, index) => (_jsxs(AccordionItem, { value: `item-${index}`, className: "bg-card border border-border/50 rounded-lg px-6 data-[state=open]:shadow-md", children: [_jsx(AccordionTrigger, { className: "text-left font-medium text-foreground hover:no-underline", children: faq.question }), _jsx(AccordionContent, { className: "text-muted-foreground", children: faq.answer })] }, index))) })] }) }), _jsx("section", { className: "py-20 md:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center", children: [_jsx("h2", { className: "text-3xl md:text-4xl font-bold text-primary-foreground mb-4", children: "Pronto para transformar sua gest\u00E3o de projetos" }), _jsx("p", { className: "text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto", children: "Junte-se a equipes que j\u00E1 utilizam a plataforma para entregar projetos no prazo e dentro do or\u00E7amento." }), _jsxs("div", { className: "mx-auto flex w-full max-w-[520px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-center", children: [_jsx("input", { placeholder: "Seu melhor email", className: "h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-white placeholder:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:w-[420px]" }), _jsxs(Button, { size: "lg", onClick: goStart, className: "h-12 rounded-xl px-6 gap-2 bg-white text-blue-600 shadow-md hover:bg-slate-50", children: ["Come\u00E7ar Agora ", _jsx(ArrowRight, { className: "w-4 h-4" })] })] })] }) }), _jsx("footer", { className: "py-12 border-t border-border bg-background", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr] items-start", children: [_jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-primary flex items-center justify-center", children: _jsx("span", { className: "text-primary-foreground font-bold text-sm", children: "G&P" }) }), _jsx("span", { className: "font-semibold text-foreground", children: "Gest\u00E3o de Projetos" })] }), _jsx("p", { className: "text-sm text-muted-foreground max-w-xs", children: "Plataforma completa para equipes que precisam de governan\u00E7a, clareza e execu\u00E7\u00E3o." })] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsx("p", { className: "font-semibold text-foreground", children: "Produto" }), _jsx("a", { href: "#pricing", className: "block text-muted-foreground hover:text-foreground transition-colors", children: "Planos" }), _jsx("a", { href: "#faq", className: "block text-muted-foreground hover:text-foreground transition-colors", children: "FAQ" }), _jsx("a", { href: "#features", className: "block text-muted-foreground hover:text-foreground transition-colors", children: "Recursos" })] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsx("p", { className: "font-semibold text-foreground", children: "Empresa" }), _jsx("a", { href: "#", className: "block text-muted-foreground hover:text-foreground transition-colors", children: "Sobre n\u00F3s" }), _jsx("a", { href: "#", className: "block text-muted-foreground hover:text-foreground transition-colors", children: "Carreiras" }), _jsx("a", { href: "#", className: "block text-muted-foreground hover:text-foreground transition-colors", children: "Contato" })] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsx("p", { className: "font-semibold text-foreground", children: "Legal" }), _jsx("a", { href: "#", className: "block text-muted-foreground hover:text-foreground transition-colors", children: "Termos" }), _jsx("a", { href: "#", className: "block text-muted-foreground hover:text-foreground transition-colors", children: "Privacidade" }), _jsx("a", { href: "#", className: "block text-muted-foreground hover:text-foreground transition-colors", children: "LGPD" })] })] }), _jsxs("div", { className: "mt-10 flex flex-col md:flex-row items-center justify-between gap-3 border-t border-border/60 pt-6", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "\u00A9 2024 G&P. Todos os direitos reservados." }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Gest\u00E3o com clareza para equipes modernas." })] }), _jsxs("p", { className: "mt-4 text-center text-[10px] text-muted-foreground/50", children: ["build: ", buildStamp] })] }) })] }));
};
export default Landing;
