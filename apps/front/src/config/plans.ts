export type PlanCode = "START" | "BUSINESS" | "ENTERPRISE";

export type PlanDefinition = {
  code: PlanCode;
  name: string;
  displayName: string;
  priceCents: number;
  billingPeriod: "monthly";
  annualDiscountPercent: number;
  limits: {
    organizations: number | null;
    projectsPerOrganization: number | null;
  };
  marketing: {
    description: string;
    summary: string;
    features: string[];
    badge?: string;
  };
};

export const ANNUAL_DISCOUNT_PERCENT = 10;
export const ANNUAL_DISCOUNT_LABEL = "Economize 10% no plano anual";

export const PLAN_DEFINITIONS: Record<PlanCode, PlanDefinition> = {
  START: {
    code: "START",
    name: "Plano Start",
    displayName: "Start",
    priceCents: 4900,
    billingPeriod: "monthly",
    annualDiscountPercent: ANNUAL_DISCOUNT_PERCENT,
    limits: {
      organizations: 1,
      projectsPerOrganization: 3
    },
    marketing: {
      description: "Ideal para validação e projetos iniciais",
      summary: "Ideal para validação e projetos iniciais",
      features: [
        "1 organização",
        "Até 3 projetos",
        "Controle essencial de tarefas",
        ANNUAL_DISCOUNT_LABEL
      ]
    }
  },
  BUSINESS: {
    code: "BUSINESS",
    name: "Plano Business",
    displayName: "Business",
    priceCents: 9700,
    billingPeriod: "monthly",
    annualDiscountPercent: ANNUAL_DISCOUNT_PERCENT,
    limits: {
      organizations: 3,
      projectsPerOrganization: 3
    },
    marketing: {
      description: "Para PMOs, consultorias e times em crescimento",
      summary: "Para PMOs, consultorias e times em crescimento",
      features: [
        "Até 3 organizações",
        "Até 3 projetos por organização",
        "Relatórios e visão de portfólio",
        ANNUAL_DISCOUNT_LABEL
      ]
    }
  },
  ENTERPRISE: {
    code: "ENTERPRISE",
    name: "Plano Enterprise",
    displayName: "Enterprise",
    priceCents: 19900,
    billingPeriod: "monthly",
    annualDiscountPercent: ANNUAL_DISCOUNT_PERCENT,
    limits: {
      organizations: null,
      projectsPerOrganization: null
    },
    marketing: {
      description: "Para operações maduras e grandes equipes",
      summary: "Para operações maduras e grandes equipes",
      features: [
        "Organizações ilimitadas",
        "Projetos ilimitados",
        "Suporte prioritário",
        ANNUAL_DISCOUNT_LABEL
      ]
    }
  }
};

const formatCurrency = (priceCents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(priceCents / 100);

export const formatMonthlyPrice = (priceCents: number, withSpace = true) =>
  `${formatCurrency(priceCents)}${withSpace ? " / mês" : "/mês"}`;

export const formatBillingPrice = (priceCents?: number | null, period?: string | null) => {
  if (!priceCents && priceCents !== 0) return "-";
  const base = formatCurrency(priceCents);
  if (!period) return base;
  if (period === "monthly") return `${base}/mês`;
  if (period === "annual") return `${base}/ano`;
  return `${base}/${period}`;
};

export const getPlanDefinition = (code?: string | null): PlanDefinition =>
  PLAN_DEFINITIONS[(code ?? "START") as PlanCode] ?? PLAN_DEFINITIONS.START;
