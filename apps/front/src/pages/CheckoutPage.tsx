import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type PaymentMethod = "card" | "pix" | "boleto";

type CheckoutPageProps = {
  subscription?: any | null;
  subscriptionError?: string | null;
  onSubscriptionActivated?: () => Promise<void> | void;
};

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const plans = {
  START: { name: "Plano Start", price: "R$ 49/mês" },
  BUSINESS: { name: "Plano Business", price: "R$ 97/mês" },
  ENTERPRISE: { name: "Plano Enterprise", price: "R$ 197/mês" }
};

const baseBenefits = [
  "Organizações e usuários ilimitados",
  "Kanban avançado, EDT e cronograma",
  "Documentos, anexos e aprovações",
  "Relatórios e portfólio em tempo real"
];

export const CheckoutPage = ({ subscription, subscriptionError, onSubscriptionActivated }: CheckoutPageProps) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [error, setError] = useState<string | null>(subscriptionError ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlanCode] = useState<string>(() => {
    if (typeof window === "undefined") return "START";
    return window.localStorage.getItem("gp:selectedPlan") ?? "START";
  });

  useEffect(() => {
    if (typeof window !== "undefined" && selectedPlanCode) {
      window.localStorage.setItem("gp:selectedPlan", selectedPlanCode);
    }
  }, [selectedPlanCode]);

  const selectedPlan =
    selectedPlanCode && plans[selectedPlanCode as keyof typeof plans]
      ? plans[selectedPlanCode as keyof typeof plans]
      : plans.START;

  const handleCheckout = async (method: PaymentMethod) => {
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      return;
    }

    if (!selectedPlanCode) {
      setError("Nenhum plano selecionado. Volte e escolha um plano para continuar.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/subscriptions/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          planCode: selectedPlanCode,
          paymentMethod: method
        })
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = (body as any).message ?? "Falha ao processar pagamento.";
        throw new Error(message);
      }

      if (onSubscriptionActivated) {
        await onSubscriptionActivated();
      }

      navigate("/organizacao", { replace: true });
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Falha ao processar pagamento.");
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
      <section className="checkout-card">
        <p className="eyebrow">Checkout seguro</p>
        <h2>Confirme o pagamento do seu plano</h2>

        <div className="checkout-plan">
          <div>
            <p className="muted">Plano selecionado</p>
            <h3>{selectedPlan.name}</h3>
            <p className="checkout-price">{selectedPlan.price}</p>
          </div>
          <div className="plan-benefits">
            {baseBenefits.map((benefit) => (
              <span key={benefit}>{benefit}</span>
            ))}
          </div>
        </div>

        <p className="subtext">
          Você poderá pagar com cartão, Pix ou boleto. Nesta versão de teste, o pagamento será simulado e a assinatura
          será ativada automaticamente.
        </p>

        {error && <p className="error-text">{error}</p>}

        <div className="payment-actions">
          <button type="button" className="primary-button" disabled={isLoading} onClick={() => handleCheckout("card")}>
            {isLoading ? "Processando..." : "Pagar com Cartão"}
          </button>
          <button type="button" className="secondary-button" disabled={isLoading} onClick={() => handleCheckout("pix")}>
            Pagar com Pix
          </button>
          <button type="button" className="ghost-button" disabled={isLoading} onClick={() => handleCheckout("boleto")}>
            Pagar com Boleto
          </button>
        </div>
      </section>

      <aside className="checkout-sidebar">
        <h4>Resumo rápido</h4>
        <ul>
          <li>
            <strong>Passo 1:</strong> confirme o plano e o método de pagamento.
          </li>
          <li>
            <strong>Passo 2:</strong> assinatura fica ativa imediatamente.
          </li>
          <li>
            <strong>Passo 3:</strong> crie sua organização e projetos.
          </li>
        </ul>
        <p className="muted">Dúvidas? Fale com nosso time e ajuda no onboarding.</p>
      </aside>
    </div>
  );
};
