export type PlanCode = "START" | "BUSINESS" | "ENTERPRISE";
export type BillingCycle = "MONTHLY" | "ANNUAL";

export type PlanDefinition = {
  code: PlanCode;
  name: string;
  description: string;
  priceCents: number;
  billingPeriod: "monthly";
  annualDiscountPercent: number;
  limits: {
    organizations: number | null;
    projectsPerOrganization: number | null;
  };
  metadata: {
    trialDays: number | null;
    allowCoupons: boolean;
    allowAutoUpgrade: boolean;
  };
};

export const PLAN_DEFINITIONS: Record<PlanCode, PlanDefinition> = {
  START: {
    code: "START",
    name: "Plano Start",
    description: "Ideal para validação e projetos iniciais",
    priceCents: 4900,
    billingPeriod: "monthly",
    annualDiscountPercent: 10,
    limits: {
      organizations: 1,
      projectsPerOrganization: 3
    },
    metadata: {
      trialDays: null,
      allowCoupons: true,
      allowAutoUpgrade: true
    }
  },
  BUSINESS: {
    code: "BUSINESS",
    name: "Plano Business",
    description: "Para PMOs, consultorias e times em crescimento",
    priceCents: 9700,
    billingPeriod: "monthly",
    annualDiscountPercent: 10,
    limits: {
      organizations: 3,
      projectsPerOrganization: 3
    },
    metadata: {
      trialDays: null,
      allowCoupons: true,
      allowAutoUpgrade: true
    }
  },
  ENTERPRISE: {
    code: "ENTERPRISE",
    name: "Plano Enterprise",
    description: "Para operações maduras e grandes equipes",
    priceCents: 19900,
    billingPeriod: "monthly",
    annualDiscountPercent: 10,
    limits: {
      organizations: null,
      projectsPerOrganization: null
    },
    metadata: {
      trialDays: null,
      allowCoupons: true,
      allowAutoUpgrade: true
    }
  }
};

export const isPlanCode = (code?: string | null): code is PlanCode =>
  Boolean(code && Object.prototype.hasOwnProperty.call(PLAN_DEFINITIONS, code));

export const getPlanDefinition = (code?: string | null): PlanDefinition | null =>
  isPlanCode(code) ? PLAN_DEFINITIONS[code] : null;

export const getPlanDefinitionOrDefault = (code?: string | null): PlanDefinition =>
  getPlanDefinition(code) ?? PLAN_DEFINITIONS.START;

export const getPlanProduct = (code?: string | null) => {
  const plan = getPlanDefinition(code);
  if (!plan) return null;
  return {
    name: plan.name,
    description: plan.description,
    priceCents: plan.priceCents,
    billingPeriod: plan.billingPeriod
  };
};

export const calculateAnnualPriceCents = (monthlyPriceCents: number, discountPercent: number) =>
  Math.round(monthlyPriceCents * 12 * (1 - discountPercent / 100));

export const getPlanPriceCents = (code?: string | null, cycle: BillingCycle = "MONTHLY") => {
  const plan = getPlanDefinition(code);
  if (!plan) return null;
  if (cycle === "ANNUAL") {
    return calculateAnnualPriceCents(plan.priceCents, plan.annualDiscountPercent);
  }
  return plan.priceCents;
};
