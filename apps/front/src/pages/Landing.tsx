import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  ListTree,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { status, token } = useAuth();
  const buildStamp = import.meta.env.VITE_BUILD_ID ?? `dev-${new Date().toISOString()}`;
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

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
      quote:
        "Em 3 semanas já tínhamos visibilidade total do portfólio. O time ganhou ritmo e o board virou referência diária.",
    },
    {
      name: "Renato Silva",
      role: "Head de Operações, Nexa",
      initials: "RS",
      quote:
        "A plataforma simplificou nossa governança. Conseguimos reduzir atrasos e ganhar previsibilidade nos marcos.",
    },
    {
      name: "Juliana Freitas",
      role: "Consultoria PMO, Elevare",
      initials: "JF",
      quote:
        "Clientes enxergam o progresso em tempo real. Os relatórios saem prontos e o acompanhamento ficou muito mais leve.",
    },
  ];

  const faqs = [
    {
      question: "Posso testar antes de assinar",
      answer:
        "Sim! Oferecemos 14 dias de teste grátis em todos os planos, sem necessidade de cartão de crédito. Você pode explorar todas as funcionalidades antes de decidir.",
    },
    {
      question: "Como funciona a migração entre planos",
      answer:
        "A migração é instantânea e pode ser feita a qualquer momento. Ao fazer upgrade, você terá acesso imediato às novas funcionalidades. Em caso de downgrade, as mudanças entram em vigor no próximo ciclo de faturamento.",
    },
    {
      question: "Existe limite de usuários",
      answer:
        "Não! Todos os planos permitem usuários ilimitados. Você paga apenas pelo plano escolhido, independente do tamanho da sua equipe.",
    },
    {
      question: "Meus dados estão seguros",
      answer:
        "Absolutamente. Utilizamos criptografia, servidores seguros e realizamos backups automáticos diários. Seus dados são sua propriedade e você pode exportá-los a qualquer momento.",
    },
    {
      question: "Vocês oferecem suporte",
      answer:
        "Sim! Todos os planos incluem suporte por email. O plano Enterprise oferece suporte prioritário com tempo de resposta garantido e atendimento via chat.",
    },
    {
      question: "Posso cancelar a qualquer momento",
      answer:
        "Sim, você pode cancelar sua assinatura a qualquer momento. Não há multas. Você mantém o acesso até o fim do período pago.",
    },
  ];

  const goLogin = () => navigate("/auth");
  const handlePlanSelect = (planCode: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="G&P"
              className="h-10 w-10 rounded-xl shadow-md object-contain"
            />
            <span className="font-semibold text-foreground">Gestão de Projetos</span>
          </div>
          <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium text-gray-600 md:flex">
            <a href="#features" className="no-underline transition-colors hover:text-gray-900">
              Recursos
            </a>
            <a href="#pricing" className="no-underline transition-colors hover:text-gray-900">
              Preços
            </a>
            <a href="#faq" className="no-underline transition-colors hover:text-gray-900">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={goLogin}
              className="h-10 rounded-full border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={goStart}
              className="h-10 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
            >
              Começar Grátis
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.28),_transparent_60%)] relative overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-slate-800">Gestão de Projetos</span>
            <br />
            <span className="text-blue-600">Simplificada e Poderosa</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Planeje, execute e monitore seus projetos com uma plataforma completa.
            Dashboard, Kanban, EAP e muito mais em um só lugar.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              className="h-12 w-full sm:w-auto rounded-xl bg-blue-600 px-8 font-semibold text-white shadow-sm transition hover:bg-blue-700"
              type="button"
              onClick={goStart}
            >
              Começar Grátis
            </button>
            <button
              className="h-12 w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-8 font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
              type="button"
              onClick={goDemo}
            >
              Ver Demonstração
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            14 dias grátis • Sem cartão de crédito • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-2xl border border-border/60 bg-white px-5 py-4 shadow-sm"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 text-blue-600 flex items-center justify-center">
                  <metric.icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-slate-500">{metric.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa para gerenciar projetos
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais para equipes de todos os tamanhos
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-border/50 bg-card/50 backdrop-blur rounded-2xl shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all"
              >
                <CardContent className="pt-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4 mx-auto">
                    <feature.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Times que confiam na plataforma
            </h2>
            <p className="text-lg text-muted-foreground">
              Histórias reais de equipes que elevaram a execução.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="border-border/60 bg-card/80 rounded-2xl shadow-lg shadow-black/5"
              >
                <CardContent className="pt-6 flex flex-col gap-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star key={starIndex} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {testimonial.quote}
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                      {testimonial.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Escolha o plano ideal para sua operação
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Migração rápida entre planos. Sem limite de usuários.
            </p>

            <div className="inline-flex items-center gap-4 p-1 bg-slate-100 border border-slate-200 rounded-xl shadow-sm">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-5 py-2 rounded-md text-sm font-semibold transition-all border border-slate-200 ${
                  billingPeriod === "monthly"
                    ? "bg-blue-600 text-white shadow-md border-blue-600"
                    : "bg-white text-slate-500 hover:text-slate-900"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-5 py-2 rounded-md text-sm font-semibold transition-all border border-slate-200 ${
                  billingPeriod === "yearly"
                    ? "bg-blue-600 text-white shadow-md border-blue-600"
                    : "bg-white text-slate-500 hover:text-slate-900"
                }`}
              >
                Anual <Badge variant="secondary" className="ml-2 text-xs">-10%</Badge>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative overflow-hidden rounded-2xl border transition-all hover:shadow-xl ${
                  plan.recommended
                    ? "border-blue-500 shadow-xl scale-[1.03]"
                    : "border-slate-200 shadow-sm"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute top-1 right-0 -translate-y-1/4">
                    <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                      Recomendado
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <Badge variant="outline" className="w-fit mx-auto mb-3 text-xs font-semibold border-slate-300 text-slate-700">
                    {plan.badge}
                  </Badge>
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                    <plan.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6 flex items-baseline justify-center gap-2">
                    <span className="text-sm font-semibold text-slate-500">R$</span>
                    <span className="text-4xl font-bold text-foreground tracking-tight">
                      {plan.price.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-sm text-slate-500">/ mês</span>
                  </div>
                  <ul className="space-y-3 mb-6 text-left">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => handlePlanSelect(plan.badge)}
                    className="h-11 w-full rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
                  >
                    Escolher {plan.name}
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-muted-foreground">Tire suas dúvidas sobre a plataforma</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border/50 rounded-lg px-6 data-[state=open]:shadow-md"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-20 md:py-24 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.18)_1px,_transparent_1px)] [background-size:28px_28px] opacity-25" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Pronto para transformar sua
            <span className="block">gestão de projetos</span>
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-base text-white/85 md:text-lg">
            Junte-se a equipes que já utilizam a plataforma para entregar projetos no prazo e dentro do orçamento.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr] items-start">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="G&P"
                  className="h-8 w-8 rounded-lg shadow-md object-contain"
                />
                <span className="font-semibold text-foreground">Gestão de Projetos</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Plataforma completa para equipes que precisam de governança, clareza e execução.
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">Produto</p>
              <a href="#pricing" className="block text-muted-foreground hover:text-foreground transition-colors">
                Planos
              </a>
              <a href="#faq" className="block text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </a>
              <a href="#features" className="block text-muted-foreground hover:text-foreground transition-colors">
                Recursos
              </a>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">Empresa</p>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                Sobre nós
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                Carreiras
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                Contato
              </a>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">Legal</p>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                Termos
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                Privacidade
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                LGPD
              </a>
            </div>
          </div>
          <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-3 border-t border-border/60 pt-6">
            <p className="text-xs text-muted-foreground">© 2024 G&P. Todos os direitos reservados.</p>
            <p className="text-xs text-muted-foreground">Gestão com clareza para equipes modernas.</p>
          </div>
          <p className="mt-4 text-center text-[10px] text-muted-foreground/50">build: {buildStamp}</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
