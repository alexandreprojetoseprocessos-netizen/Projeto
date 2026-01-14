import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch, getNetworkErrorMessage } from "../config/api";
import {
  ANNUAL_DISCOUNT_LABEL,
  PLAN_DEFINITIONS,
  type BillingCycle,
  formatBillingPrice,
  formatMonthlyPrice,
  getPlanPriceCents
} from "../config/plans";

type CheckoutPageProps = {
  subscription?: any | null;
  subscriptionError?: string | null;
  onSubscriptionActivated?: () => Promise<void> | void;
};

const baseBenefits = [
  "Usuários ilimitados",
  "Kanban, EAP e cronograma",
  "Documentos, anexos e aprovações",
  "Relatórios e portfólio em tempo real"
];

export const CheckoutPage = ({ subscription, subscriptionError }: CheckoutPageProps) => {
  const navigate = useNavigate();
  const { token, signOut } = useAuth();
  const [error, setError] = useState<string | null>(subscriptionError ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [selectedPlanCode] = useState<string>(() => {
    if (typeof window === "undefined") return "START";
    return window.localStorage.getItem("gp:selectedPlan") ?? "START";
  });

  useEffect(() => {
    if (typeof window !== "undefined" && selectedPlanCode) {
      window.localStorage.setItem("gp:selectedPlan", selectedPlanCode);
    }
  }, [selectedPlanCode]);

  const plan =
    selectedPlanCode && PLAN_DEFINITIONS[selectedPlanCode as keyof typeof PLAN_DEFINITIONS]
      ? PLAN_DEFINITIONS[selectedPlanCode as keyof typeof PLAN_DEFINITIONS]
      : PLAN_DEFINITIONS.START;
  const planBenefits = plan.marketing.features.filter((feature) => feature !== ANNUAL_DISCOUNT_LABEL);

  const priceCents = getPlanPriceCents(plan.code, billingCycle);
  const priceLabel = useMemo(() => {
    if (billingCycle === "MONTHLY") {
      return formatMonthlyPrice(priceCents, false);
    }
    return formatBillingPrice(priceCents, "annual");
  }, [billingCycle, priceCents]);

  const resolveCheckoutErrorMessage = (error: unknown) => {
    if (error instanceof DOMException || error instanceof TypeError) {
      return getNetworkErrorMessage(error);
    }
    if (error instanceof Error) return error.message;
    return "Falha ao iniciar pagamento.";
  };

  const handleCheckout = async () => {
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch("/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: plan.code,
          billingCycle
        }),
        retry: 0
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          (body as any).message ??
          (response.status >= 500 ? "Servidor indisponível. Tente novamente." : "Falha ao iniciar pagamento.");
        throw new Error(message);
      }

      if (body?.init_point) {
        window.location.href = body.init_point;
        return;
      }

      throw new Error("Link de pagamento não disponível.");
    } catch (checkoutError) {
      setError(resolveCheckoutErrorMessage(checkoutError));
    } finally {
      setIsLoading(false);
    }
  };

  if (subscription?.status === "ACTIVE") {
    return (
      <div className="checkout-page">
        <section className="checkout-card">
          <p className="eyebrow">Assinatura ativa</p>
          <h2>Você já tem acesso liberado</h2>
          <p className="subtext">
            Plano {subscription.product?.name ?? subscription.product?.code ?? selectedPlanCode} ativo. Você pode criar
            sua organização e acessar os projetos normalmente.
          </p>
          <div className="payment-actions">
            <button type="button" className="primary-button" onClick={() => navigate("/organizacao")}>
              Ir para criação da organização
            </button>
            <button type="button" className="secondary-button" onClick={() => navigate("/dashboard")}>
              Ver dashboard
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-page-header">
        <button type="button" className="ghost-button" onClick={signOut}>
          Sair
        </button>
      </div>
      <section className="checkout-card">
        <p className="eyebrow">Checkout seguro</p>
        <h2>Confirme o pagamento do seu plano</h2>

        <div className="checkout-plan">
          <div>
            <p className="muted">Plano selecionado</p>
            <h3>{plan.name}</h3>
            <p className="checkout-price">{priceLabel}</p>
            <div className="checkout-billing-toggle">
              <button
                type="button"
                className={`chip chip-outline ${billingCycle === "MONTHLY" ? "is-active" : ""}`}
                onClick={() => setBillingCycle("MONTHLY")}
              >
                Mensal
              </button>
              <button
                type="button"
                className={`chip chip-soft ${billingCycle === "ANNUAL" ? "is-active" : ""}`}
                onClick={() => setBillingCycle("ANNUAL")}
              >
                Anual
              </button>
            </div>
            <p className="muted">{ANNUAL_DISCOUNT_LABEL}</p>
          </div>
          <div className="plan-benefits">
            {[...planBenefits, ...baseBenefits].map((benefit) => (
              <span key={benefit}>{benefit}</span>
            ))}
          </div>
        </div>

        <div className="checkout-info-row">
          <p className="subtext">
            Pagamento com cartão via Mercado Pago. Após a confirmação, sua assinatura é ativada automaticamente.
          </p>
          <button type="button" className="ghost-button logout-button" onClick={signOut}>
            Sair
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="payment-actions">
          <button type="button" className="primary-button" disabled={isLoading} onClick={handleCheckout}>
            {isLoading ? "Redirecionando..." : "Pagar com cartão"}
          </button>
        </div>
      </section>

      <aside className="checkout-sidebar">
        <h4>Resumo rápido</h4>
        <ul>
          <li>
            <strong>Passo 1:</strong> confirme o plano e a forma de pagamento.
          </li>
          <li>
            <strong>Passo 2:</strong> finalize o checkout no Mercado Pago.
          </li>
          <li>
            <strong>Passo 3:</strong> acesse o painel e crie sua organização.
          </li>
        </ul>
        <p className="muted">Dúvidas? Fale com nosso time durante o onboarding.</p>
      </aside>
    </div>
  );
};
