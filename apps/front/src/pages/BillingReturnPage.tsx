import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiUrl } from "../config/api";

type BillingReturnPageProps = {
  onSubscriptionActivated?: () => Promise<void> | void;
};

export const BillingReturnPage = ({ onSubscriptionActivated }: BillingReturnPageProps) => {
  const { token, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const statusParam = useMemo(() => new URLSearchParams(location.search).get("status"), [location.search]);
  const maxAttempts = 3;

  useEffect(() => {
    if (!token) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const fetchStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(apiUrl("/billing/status"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body?.message ?? "Falha ao carregar status do pagamento.");
        }
        const current = body?.subscription ?? null;
        setSubscription(current);

        if (current?.status === "ACTIVE") {
          await onSubscriptionActivated?.();
        } else if (attempt < maxAttempts) {
          timeoutId = setTimeout(() => setAttempt((value) => value + 1), 4000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar status do pagamento.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [token, attempt, maxAttempts, onSubscriptionActivated]);

  const statusLabel = subscription?.status ?? statusParam ?? "pending";
  const isActive = subscription?.status === "ACTIVE";
  const isPending = subscription?.status === "PENDING" || statusParam === "pending";
  const isFailure = statusParam === "failure" || subscription?.status === "PAST_DUE";

  return (
    <div className="checkout-page">
      <div className="checkout-page-header">
        <button type="button" className="ghost-button" onClick={signOut}>
          Sair
        </button>
      </div>
      <section className="checkout-card">
        <p className="eyebrow">Retorno do pagamento</p>
        <h2>{isActive ? "Pagamento confirmado" : isFailure ? "Pagamento não aprovado" : "Processando pagamento"}</h2>
        <p className="subtext">
          {isActive
            ? "Sua assinatura foi ativada. Você já pode criar sua organização e acessar os projetos."
            : isFailure
            ? "Não foi possível confirmar o pagamento. Verifique com o emissor do cartão ou tente novamente."
            : "Estamos confirmando a transação. Isso pode levar alguns segundos."}
        </p>

        <div className="checkout-info-row">
          <p className="muted">Status atual: {statusLabel}</p>
          <button
            type="button"
            className="ghost-button"
            onClick={() => setAttempt((value) => value + 1)}
            disabled={loading}
          >
            {loading ? "Atualizando..." : "Atualizar status"}
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="payment-actions">
          {isActive ? (
            <>
              <button type="button" className="primary-button" onClick={() => navigate("/plano")}>
                Ver meu plano
              </button>
              <button type="button" className="secondary-button" onClick={() => navigate("/organizacao")}>
                Criar organização
              </button>
            </>
          ) : (
            <>
              <button type="button" className="primary-button" onClick={() => navigate("/checkout")}>
                Voltar ao checkout
              </button>
              <button type="button" className="ghost-button" onClick={() => navigate("/")}>
                Voltar ao site
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
