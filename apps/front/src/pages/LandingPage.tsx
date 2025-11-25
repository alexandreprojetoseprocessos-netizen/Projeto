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

  const planCards = useMemo(
    () =>
      plans.map((plan) => (
        <article key={plan.code} className="landing-plan-card" data-plan-code={plan.code}>
          <div className="landing-plan-card__header">
            <div>
              <p className="eyebrow">{plan.code}</p>
              <h3>{plan.name}</h3>
              <p className="subtext">{plan.description}</p>
            </div>
            {plan.tag && <span className="chip chip-primary">{plan.tag}</span>}
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
      )),
    [navigate]
  );

  return (
    <div className="landing-shell">
      <section className="landing-hero">
        <div className="landing-hero__content">
          <div className="landing-hero__tagline">
            <span className="chip chip-soft">G&P • Gestao de Projetos</span>
            <span className="chip chip-outline">Times e PMOs</span>
          </div>
          <h1>Planeje, execute e meca cada projeto em um so lugar.</h1>
          <p className="subtext">
            Multi-organizacoes, EDT colaborativa, quadros Kanban, cronograma Gantt, relatorios avancados e portfolio em
            tempo real. Tudo pensado para PMOs, squads e consultorias.
          </p>
          <div className="landing-hero__actions">
            <button type="button" className="primary-button" onClick={() => navigate("/auth?plan=START")}>
              Comecar agora
            </button>
            <button type="button" className="ghost-button" onClick={() => navigate("/dashboard")}>
              Ver demo rapida
            </button>
          </div>
          <div className="landing-hero__highlights">
            {highlights.map((item) => (
              <span key={item} className="chip chip-soft">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="landing-hero__visual" aria-hidden>
          <div className="landing-hero__glass">
            <p className="eyebrow">Status semanal</p>
            <h4>Portfolio ativo</h4>
            <ul>
              <li>
                <span>Board</span>
                <strong>45 cards</strong>
              </li>
              <li>
                <span>Cronograma</span>
                <strong>12 marcos</strong>
              </li>
              <li>
                <span>Riscos</span>
                <strong>3 abertos</strong>
              </li>
            </ul>
            <div className="landing-hero__progress">
              <span>Execucao</span>
              <div className="progress-bar">
                <div className="progress-bar__fill" style={{ width: "68%" }} />
              </div>
              <small>68% concluido</small>
            </div>
          </div>
          <div className="landing-hero__glow" />
        </div>
      </section>

      <section className="landing-plans">
        <header className="landing-plans__header">
          <p className="eyebrow">Planos</p>
          <h2>Escolha o plano ideal para sua operacao</h2>
          <p className="subtext">Migracao rapida entre planos. Sem limite de usuarios.</p>
        </header>
        <div className="landing-plans__grid">{planCards}</div>
      </section>

      <section className="landing-steps">
        <header className="landing-steps__header">
          <p className="eyebrow">Como funciona</p>
          <h2>Da escolha do plano ao primeiro projeto</h2>
          <p className="subtext">Fluxo simples em 4 passos para colocar sua equipe em producao.</p>
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
      </section>
    </div>
  );
};

export default LandingPage;
