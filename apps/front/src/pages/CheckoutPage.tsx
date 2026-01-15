import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getNetworkErrorMessage } from "../config/api";
import {
  ANNUAL_DISCOUNT_LABEL,
  PLAN_DEFINITIONS,
  type BillingCycle,
  formatBillingPrice,
  formatMonthlyPrice,
  getPlanPriceCents
} from "../config/plans";
import { getMercadoPago } from "../lib/mercadopago";
import { createCardPayment, createPixPayment } from "../services/billingClient";

type CheckoutPageProps = {
  subscription?: any | null;
  subscriptionError?: string | null;
  onSubscriptionActivated?: () => Promise<void> | void;
};

const baseBenefits = [
  "Usuarios ilimitados",
  "Kanban, EAP e cronograma",
  "Documentos, anexos e aprovacoes",
  "Relatorios e portfolio em tempo real"
];

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const formatCardNumber = (value: string) => {
  const digits = onlyDigits(value).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
};

const formatMonth = (value: string) => onlyDigits(value).slice(0, 2);
const formatYear = (value: string) => onlyDigits(value).slice(0, 4);
const formatCvv = (value: string) => onlyDigits(value).slice(0, 4);

export const CheckoutPage = ({ subscription, subscriptionError, onSubscriptionActivated }: CheckoutPageProps) => {
  const navigate = useNavigate();
  const { token, user, signOut } = useAuth();
  const [error, setError] = useState<string | null>(subscriptionError ?? null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [selectedPlanCode] = useState<string>(() => {
    if (typeof window === "undefined") return "START";
    return window.localStorage.getItem("gp:selectedPlan") ?? "START";
  });

  const [activeTab, setActiveTab] = useState<"pix" | "card">("pix");
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{
    paymentId: string;
    status: string;
    qrCode: string;
    qrCodeBase64: string;
  } | null>(null);

  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardResult, setCardResult] = useState<{ id: string; status: string; statusDetail?: string | null } | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [issuerId, setIssuerId] = useState<string | null>(null);
  const [issuerOptions, setIssuerOptions] = useState<{ id: string; name: string }[]>([]);
  const [installments, setInstallments] = useState(1);
  const [installmentOptions, setInstallmentOptions] = useState<{ value: number; label: string }[]>([]);

  const mpRef = useRef<any | null>(null);
  const [mpReady, setMpReady] = useState(false);
  const [mpError, setMpError] = useState<string | null>(null);

  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;

  useEffect(() => {
    if (!publicKey) {
      setMpError("VITE_MP_PUBLIC_KEY nao configurada.");
      return;
    }

    let mounted = true;
    getMercadoPago(publicKey)
      .then((mp) => {
        if (!mounted) return;
        mpRef.current = mp;
        setMpReady(true);
      })
      .catch((err) => {
        if (!mounted) return;
        setMpError(err instanceof Error ? err.message : "Falha ao carregar MercadoPago.js.");
      });

    return () => {
      mounted = false;
    };
  }, [publicKey]);

  useEffect(() => {
    setError(subscriptionError ?? null);
  }, [subscriptionError]);

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

  const amount = Number(((priceCents ?? 0) / 100).toFixed(2));
  const description = `Plano ${plan.name}`;
  const payerEmail = user?.email ?? "";

  const resolveCheckoutErrorMessage = (error: unknown) => {
    if (error instanceof DOMException || error instanceof TypeError) {
      return getNetworkErrorMessage(error);
    }
    if (error instanceof Error) return error.message;
    return "Falha ao iniciar pagamento.";
  };

  useEffect(() => {
    const cardBin = onlyDigits(cardNumber).slice(0, 6);
    if (!mpReady || !mpRef.current || cardBin.length < 6 || !amount) {
      setPaymentMethodId(null);
      setIssuerId(null);
      setIssuerOptions([]);
      setInstallmentOptions([]);
      setInstallments(1);
      return;
    }

    let active = true;

    const loadPaymentData = async () => {
      setCardError(null);
      const paymentMethods = await mpRef.current.getPaymentMethods({ bin: cardBin });
      const method = paymentMethods?.results?.[0];
      if (!method?.id) {
        throw new Error("Cartao nao reconhecido.");
      }
      if (!active) return;
      setPaymentMethodId(method.id);

      const issuersResponse = await mpRef.current.getIssuers(method.id, cardBin);
      const issuers = issuersResponse?.results ?? issuersResponse ?? [];
      if (!active) return;
      setIssuerOptions(
        Array.isArray(issuers)
          ? issuers.map((issuer: any) => ({ id: String(issuer.id), name: issuer.name }))
          : []
      );
      const defaultIssuer = Array.isArray(issuers) && issuers.length ? String(issuers[0].id) : null;
      setIssuerId(defaultIssuer);

      const installmentsResponse = await mpRef.current.getInstallments({
        amount,
        bin: cardBin,
        paymentMethodId: method.id
      });
      const payerCosts = installmentsResponse?.[0]?.payer_costs ?? [];
      const options = payerCosts.map((cost: any) => ({
        value: cost.installments,
        label: cost.recommended_message ?? `${cost.installments}x`
      }));
      if (!active) return;
      setInstallmentOptions(options);
      if (options.length) {
        setInstallments(options[0].value);
      }
    };

    loadPaymentData().catch((err) => {
      if (!active) return;
      setCardError(err instanceof Error ? err.message : "Erro ao validar cartao.");
    });

    return () => {
      active = false;
    };
  }, [cardNumber, amount, mpReady]);

  const handlePixPayment = async () => {
    if (!token) {
      setPixError("Sessao expirada. Faca login novamente.");
      return;
    }
    if (!payerEmail) {
      setPixError("E-mail do pagador obrigatorio.");
      return;
    }
    if (!amount) {
      setPixError("Valor do plano invalido.");
      return;
    }

    setPixLoading(true);
    setPixError(null);
    setPixData(null);

    try {
      const response = await createPixPayment(token, {
        amount,
        description,
        payerEmail,
        planCode: plan.code,
        billingCycle
      });

      setPixData({
        paymentId: response.payment_id,
        status: response.status,
        qrCode: response.qr_code,
        qrCodeBase64: response.qr_code_base64
      });

      if (response.status === "approved") {
        await onSubscriptionActivated?.();
      }
    } catch (pixError) {
      setPixError(resolveCheckoutErrorMessage(pixError));
    } finally {
      setPixLoading(false);
    }
  };

  const handleCopyPix = async () => {
    if (!pixData?.qrCode) return;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(pixData.qrCode);
    }
  };

  const handleCardPayment = async () => {
    if (!token) {
      setCardError("Sessao expirada. Faca login novamente.");
      return;
    }
    if (!payerEmail) {
      setCardError("E-mail do pagador obrigatorio.");
      return;
    }
    if (!mpRef.current) {
      setCardError("MercadoPago.js nao carregou.");
      return;
    }
    if (!amount) {
      setCardError("Valor do plano invalido.");
      return;
    }
    const cardDigits = onlyDigits(cardNumber);
    if (!cardDigits || cardDigits.length < 13) {
      setCardError("Numero do cartao invalido.");
      return;
    }
    if (!cardholderName.trim()) {
      setCardError("Nome do titular obrigatorio.");
      return;
    }
    if (!expirationMonth || !expirationYear) {
      setCardError("Validade do cartao obrigatoria.");
      return;
    }
    if (!securityCode) {
      setCardError("CVV obrigatorio.");
      return;
    }

    setCardLoading(true);
    setCardError(null);
    setCardResult(null);

    try {
      const cardTokenResponse = await mpRef.current.createCardToken({
        cardNumber: cardDigits,
        cardholderName: cardholderName.trim(),
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: expirationYear,
        securityCode: securityCode.trim()
      });

      const cardToken = cardTokenResponse?.id;
      if (!cardToken) {
        const message = cardTokenResponse?.error?.message ?? "Falha ao tokenizar cartao.";
        throw new Error(message);
      }

      if (!paymentMethodId) {
        throw new Error("Payment method nao identificado.");
      }

      const response = await createCardPayment(token, {
        amount,
        description,
        payerEmail,
        cardToken,
        paymentMethodId,
        installments,
        issuer_id: issuerId ?? undefined,
        planCode: plan.code,
        billingCycle
      });

      setCardResult({
        id: response.id,
        status: response.status,
        statusDetail: response.status_detail ?? null
      });

      if (response.status === "approved") {
        await onSubscriptionActivated?.();
      }
    } catch (cardPaymentError) {
      setCardError(resolveCheckoutErrorMessage(cardPaymentError));
    } finally {
      setCardLoading(false);
    }
  };

  if (subscription?.status === "ACTIVE") {
    return (
      <div className="checkout-page">
        <section className="checkout-card">
          <p className="eyebrow">Assinatura ativa</p>
          <h2>Voce ja tem acesso liberado</h2>
          <p className="subtext">
            Plano {subscription.product?.name ?? subscription.product?.code ?? selectedPlanCode} ativo. Voce pode criar
            sua organizacao e acessar os projetos normalmente.
          </p>
          <div className="payment-actions">
            <button type="button" className="primary-button" onClick={() => navigate("/organizacao")}>
              Ir para criacao da organizacao
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
        <h2>Finalize o pagamento do seu plano</h2>

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
            Escolha Pix ou cartao de credito. A assinatura e ativada automaticamente apos a confirmacao do pagamento.
          </p>
          <button type="button" className="ghost-button logout-button" onClick={signOut}>
            Sair
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="payment-tabs">
          <button
            type="button"
            className={`payment-tab ${activeTab === "pix" ? "is-active" : ""}`}
            onClick={() => setActiveTab("pix")}
          >
            Pix
          </button>
          <button
            type="button"
            className={`payment-tab ${activeTab === "card" ? "is-active" : ""}`}
            onClick={() => setActiveTab("card")}
          >
            Cartao de credito
          </button>
        </div>

        {activeTab === "pix" && (
          <div className="payment-panel">
            <p className="muted">Gere o QR Code Pix e finalize o pagamento no seu banco.</p>
            {pixData ? (
              <div className="pix-result">
                <img
                  className="pix-qr"
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code Pix"
                />
                <div className="pix-code">
                  <textarea readOnly value={pixData.qrCode} />
                  <button type="button" className="secondary-button" onClick={handleCopyPix}>
                    Copiar codigo Pix
                  </button>
                  <span className="muted">Status: {pixData.status}</span>
                </div>
              </div>
            ) : (
              <button type="button" className="primary-button" disabled={pixLoading} onClick={handlePixPayment}>
                {pixLoading ? "Gerando QR Code..." : "Gerar QR Code Pix"}
              </button>
            )}
            {pixError && <p className="error-text">{pixError}</p>}
          </div>
        )}

        {activeTab === "card" && (
          <div className="payment-panel">
            {mpError && <p className="error-text">{mpError}</p>}
            <div className="payment-grid">
              <label className="input-group">
                <span>Numero do cartao</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                />
              </label>
              <label className="input-group">
                <span>Nome no cartao</span>
                <input
                  type="text"
                  placeholder="Como no cartao"
                  value={cardholderName}
                  onChange={(event) => setCardholderName(event.target.value)}
                />
              </label>
              <div className="payment-row">
                <label className="input-group">
                  <span>Mes</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM"
                    value={expirationMonth}
                    onChange={(event) => setExpirationMonth(formatMonth(event.target.value))}
                  />
                </label>
                <label className="input-group">
                  <span>Ano</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="AAAA"
                    value={expirationYear}
                    onChange={(event) => setExpirationYear(formatYear(event.target.value))}
                  />
                </label>
                <label className="input-group">
                  <span>CVV</span>
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder="000"
                    value={securityCode}
                    onChange={(event) => setSecurityCode(formatCvv(event.target.value))}
                  />
                </label>
              </div>

              {issuerOptions.length > 1 && (
                <label className="input-group">
                  <span>Banco emissor</span>
                  <select value={issuerId ?? ""} onChange={(event) => setIssuerId(event.target.value || null)}>
                    {issuerOptions.map((issuer) => (
                      <option key={issuer.id} value={issuer.id}>
                        {issuer.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="input-group">
                <span>Parcelas</span>
                <select
                  value={installments}
                  onChange={(event) => setInstallments(Number(event.target.value))}
                  disabled={!installmentOptions.length}
                >
                  {installmentOptions.length ? (
                    installmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  ) : (
                    <option value={1}>1x</option>
                  )}
                </select>
              </label>
            </div>

            <div className="payment-actions">
              <button
                type="button"
                className="primary-button"
                disabled={cardLoading || !mpReady}
                onClick={handleCardPayment}
              >
                {cardLoading ? "Processando..." : "Pagar com cartao"}
              </button>
              {cardResult && (
                <span className="muted">
                  Status: {cardResult.status}
                  {cardResult.statusDetail ? ` (${cardResult.statusDetail})` : ""}
                </span>
              )}
            </div>
            {cardError && <p className="error-text">{cardError}</p>}
          </div>
        )}
      </section>

      <aside className="checkout-sidebar">
        <h4>Resumo rapido</h4>
        <ul>
          <li>
            <strong>Passo 1:</strong> confirme o plano e a forma de pagamento.
          </li>
          <li>
            <strong>Passo 2:</strong> finalize Pix ou cartao.
          </li>
          <li>
            <strong>Passo 3:</strong> acesse o painel e crie sua organizacao.
          </li>
        </ul>
        <p className="muted">Duvidas? Fale com nosso time durante o onboarding.</p>
      </aside>
    </div>
  );
};
