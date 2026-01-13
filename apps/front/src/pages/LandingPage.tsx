import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

type Plan = {
  code: string;
  name: string;
  price: string;
  description: string;
  tag?: string;
  features: string[];
};

const plans: Plan[] = [
  {
    code: "START",
    name: "Start",
    price: "R$ 0",
    description: "Para validar processos e criar as primeiras entregas.",
    tag: "Popular",
    features: ["Até 2 organizações", "3 projetos por organização", "Usuários ilimitados"]
  },
  {
    code: "BUSINESS",
    name: "Business",
    price: "R$ 199/mês",
    description: "Portfólio, aprovações e automatizações para squads múltiplas.",
    features: ["Até 10 organizações", "12 projetos por organização", "Permissões avançadas"]
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise",
    price: "Fale com vendas",
    description: "Suporte dedicado, SSO e limites customizados.",
    features: ["Organizações ilimitadas", "Projetos ilimitados", "SLAs e onboarding premium"]
  }
];

const features = [
  {
    title: "Kanban",
    description: "Avançado com limites WIP.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="6" height="16" rx="2" />
        <rect x="10" y="4" width="6" height="10" rx="2" />
        <rect x="17" y="4" width="4" height="14" rx="2" />
      </svg>
    )
  },
  {
    title: "EAP",
    description: "EDT colaborativa e versões.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="6" cy="6" r="2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="12" cy="18" r="2" />
        <path d="M8 6h8M12 8v8" />
      </svg>
    )
  },
  {
    title: "Cronograma",
    description: "Dependências e marcos críticos.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 9h18" />
        <path d="M10.5 14.5l1.5 1.5 3-3" />
      </svg>
    )
  },
  {
    title: "Documentos",
    description: "Docs, anexos e aprovações.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    )
  },
  {
    title: "Portfólio",
    description: "Indicadores em tempo real.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="6" rx="2" />
        <rect x="4" y="13" width="10" height="6" rx="2" />
        <rect x="15" y="13" width="5" height="6" rx="2" />
      </svg>
    )
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
    description: "Cartão, Pix ou boleto (entra no próximo bloco)."
  },
  {
    title: "Crie sua organização e projetos",
    description: "Convide o time, crie quadros, cronogramas e relatórios."
  }
];

const LandingPage = () => {
  const navigate = useNavigate();

  const planCards = useMemo(
    () =>
      plans.map((plan) => {
        const isRecommended = plan.code === "BUSINESS";
        return (
          <article
            key={plan.code}
            className={`landing-plan-card${isRecommended ? " is-recommended" : ""}`}
            data-plan-code={plan.code}
          >
            <div className="landing-plan-card__header">
              <div>
                <p className="eyebrow">{plan.code}</p>
                <h3>{plan.name}</h3>
                <p className="subtext">{plan.description}</p>
              </div>
              <div className="landing-plan-card__badges">
                {plan.tag && <span className="chip chip-soft">{plan.tag}</span>}
                {isRecommended && <span className="chip chip-primary">Recomendado</span>}
              </div>
            </div>
            <div className="landing-plan-card__price">{plan.price}</div>
            <ul className="landing-plan-card__features">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                navigate(`/auth?plan=${plan.code}`);
              }}
            >
              Escolher plano
            </button>
          </article>
        );
      }),
    [navigate]
  );

  const featureCards = useMemo(
    () =>
      features.map((feature) => (
        <article key={feature.title} className="feature-card">
          <span className="feature-card__icon" aria-hidden="true">
            {feature.icon}
          </span>
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
        </article>
      )),
    []
  );

  return (
    <div className="landing-shell">
      <section className="landing-hero">
        <div className="landing-container landing-hero__grid">
          <div className="landing-hero__content">
            <div className="landing-hero__tagline">
              <span className="chip chip-soft">G&P • Gestão de Projetos</span>
              <span className="chip chip-outline">Times e PMOs</span>
            </div>
            <h1>Planeje, execute e meça cada projeto em um só lugar.</h1>
            <p className="subtext">
              Multi-organizações, EDT colaborativa, quadros Kanban, cronograma Gantt, relatórios avançados e portfólio em
              tempo real. Tudo pensado para PMOs, squads e consultorias.
            </p>
            <div className="landing-hero__actions">
              <button type="button" className="primary-button" onClick={() => navigate("/auth?plan=START")}>
                Começar agora
              </button>
              <button type="button" className="ghost-button" onClick={() => navigate("/dashboard")}>
                Ver demo rápida
              </button>
            </div>
          </div>
          <div className="landing-hero__visual" aria-hidden="true">
            <div className="landing-hero__card">
              <div className="landing-hero__card-header">
                <p className="eyebrow">Status semanal</p>
                <span className="landing-hero__pill">Atualizado hoje</span>
              </div>
              <h4>Portfólio ativo</h4>
              <div className="landing-hero__metrics">
                {portfolioMetrics.map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
              <div className="landing-hero__progress">
                <span>Execução</span>
                <div className="landing-progress">
                  <div className="landing-progress__bar">
                    <div className="landing-progress__fill" style={{ width: `${executionProgress}%` }} />
                  </div>
                  <small>{executionProgress}% concluído</small>
                </div>
              </div>
            </div>
            <div className="landing-hero__glow" />
          </div>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-container">
          <header className="landing-section__header">
            <p className="eyebrow">Benefícios</p>
            <h2>Recursos que dão clareza ao portfólio</h2>
            <p className="subtext">Organize ponta a ponta com visões claras para times e PMOs.</p>
          </header>
          <div className="landing-features__grid">{featureCards}</div>
        </div>
      </section>

      <section className="landing-dashboard">
        <div className="landing-container">
          <header className="landing-section__header">
            <p className="eyebrow">Dashboard preview</p>
            <h2>Status semanal com leitura instantânea</h2>
            <p className="subtext">Do overview ao detalhe, tudo em um fluxo visual e colaborativo.</p>
          </header>
          <div className="landing-dashboard__grid">
            <article className="landing-dashboard__card">
              <p className="eyebrow">Status semanal</p>
              <h3>Visão geral</h3>
              <ul className="landing-status-list">
                {statusItems.map((item) => (
                  <li key={item.label}>
                    <span className={`status-dot ${item.tone}`} />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="landing-dashboard__card">
              <p className="eyebrow">Portfólio ativo</p>
              <h3>Indicadores do dia</h3>
              <ul className="landing-metrics-list">
                {portfolioMetrics.map((item) => (
                  <li key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </li>
                ))}
              </ul>
            </article>
            <article className="landing-dashboard__card">
              <p className="eyebrow">Execução</p>
              <h3>Progresso do portfólio</h3>
              <div className="landing-progress is-large">
                <div className="landing-progress__bar">
                  <div className="landing-progress__fill" style={{ width: `${executionProgress}%` }} />
                </div>
                <small>{executionProgress}% concluído</small>
              </div>
              <p className="landing-dashboard__note">Sprints e marcos sincronizados com o time.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-plans">
        <div className="landing-container">
          <header className="landing-section__header">
            <p className="eyebrow">Planos</p>
            <h2>Escolha o plano ideal para sua operação</h2>
            <p className="subtext">Migração rápida entre planos. Sem limite de usuários.</p>
          </header>
          <div className="landing-plans__grid">{planCards}</div>
        </div>
      </section>

      <section className="landing-steps">
        <div className="landing-container">
          <header className="landing-section__header">
            <p className="eyebrow">Como funciona</p>
            <h2>Da escolha do plano ao primeiro projeto</h2>
            <p className="subtext">Fluxo simples em 4 passos para colocar sua equipe em produção.</p>
          </header>
          <div className="landing-steps__grid">
            {steps.map((step, index) => (
              <article key={step.title} className="landing-step-card">
                <span className="landing-step-card__badge">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
