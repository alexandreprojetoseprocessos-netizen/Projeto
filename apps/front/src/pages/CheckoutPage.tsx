import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiUrl, getNetworkErrorMessage } from "../config/api";
import { AlertTriangle, CalendarClock, CheckCircle2, CreditCard, FileText, RefreshCw } from "lucide-react";
import {
  ANNUAL_DISCOUNT_LABEL,
  PLAN_DEFINITIONS,
  type BillingCycle,
  formatBillingPrice,
  formatMonthlyPrice,
  getPlanPriceCents
} from "../config/plans";
import { getMercadoPago } from "../lib/mercadopago";
import {
  ApiRequestError,
  createCardPayment,
  createPixPayment,
  fetchIdentificationTypes,
  fetchInstallments,
  fetchPaymentMethods,
  type PaymentMethod
} from "../services/billingClient";

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

const digitsOnly = (value: string) => (value || "").replace(/\D/g, "");
const normalizeCPF = (value: string) => (value || "").replace(/\D/g, "");

const resolvePaymentMethodId = (methods: PaymentMethod[], bin: string) => {
  for (const method of methods) {
    const settings = method?.settings ?? [];
    for (const setting of settings) {
      const pattern = setting?.bin?.pattern;
      if (!pattern) continue;
      try {
        if (new RegExp(pattern).test(bin)) {
          return method.id;
        }
      } catch {
        // Ignore invalid regex patterns from upstream.
      }
    }
  }
  return null;
};

const resolveFallbackPaymentMethodId = (bin: string) => {
  if (bin.startsWith("4")) return "visa";
  if (bin.startsWith("5")) return "master";
  if (bin.startsWith("3")) return "amex";
  return null;
};

const formatCardNumber = (value: string) => {
  const digits = digitsOnly(value).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
};

const formatMonth = (value: string) => digitsOnly(value).slice(0, 2);
const formatYear = (value: string) => digitsOnly(value).slice(0, 4);
const formatCvv = (value: string) => digitsOnly(value).slice(0, 4);
const formatIdentificationNumber = (value: string) => digitsOnly(value).slice(0, 14);

const formatDatePtBr = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
};

const billingCycleLabels: Record<string, string> = {
  MONTHLY: "Mensal",
  ANNUAL: "Anual"
};

const subscriptionStatusLabels: Record<string, string> = {
  ACTIVE: "Ativa",
  PENDING: "Pendente",
  PAST_DUE: "Em atraso",
  CANCELED: "Cancelada"
};

const paymentMethodLabels: Record<string, string> = {
  card: "Cartao de credito",
  pix: "Pix",
  boleto: "Boleto"
};

export const CheckoutPage = ({ subscription, subscriptionError, onSubscriptionActivated }: CheckoutPageProps) => {
  const navigate = useNavigate();
  const { token, user, signOut } = useAuth();
  const [error, setError] = useState<string | null>(subscriptionError ?? null);
  const [info, setInfo] = useState<string | null>(null);
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
  const [identificationTypes, setIdentificationTypes] = useState<{ id: string; name: string }[]>([]);
  const [identificationType, setIdentificationType] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [issuerId, setIssuerId] = useState<string | null>(null);
  const [issuerOptions, setIssuerOptions] = useState<{ id: string; name: string }[]>([]);
  const [installments, setInstallments] = useState(1);
  const [installmentOptions, setInstallmentOptions] = useState<{ value: number; label: string }[]>([]);

  const mpRef = useRef<any | null>(null);
  const [mpReady, setMpReady] = useState(false);
  const [mpError, setMpError] = useState<string | null>(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);

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
    if (typeof window === "undefined") return;
    const key = "gp:checkout_reopen_after_cancel";
    const shouldShowInfo = window.sessionStorage.getItem(key);
    if (shouldShowInfo === "1") {
      setInfo("Assinatura cancelada. Escolha abaixo a nova forma de pagamento para reativar seu acesso.");
      window.sessionStorage.removeItem(key);
    }
  }, []);

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
  const currentPlanName = subscription?.product?.name ?? subscription?.product?.code ?? selectedPlanCode;
  const currentStatus = String(subscription?.status ?? "PENDING").toUpperCase();
  const currentStatusLabel = subscriptionStatusLabels[currentStatus] ?? currentStatus;
  const currentPaymentMethod = String(subscription?.paymentMethod ?? "").toLowerCase();
  const currentPaymentMethodLabel = paymentMethodLabels[currentPaymentMethod] ?? "Nao informado";
  const currentBillingCycleLabel =
    billingCycleLabels[String(subscription?.billingCycle ?? "").toUpperCase()] ??
    String(subscription?.billingCycle ?? "Nao informado");
  const nextBillingDate = formatDatePtBr(subscription?.currentPeriodEnd ?? subscription?.expiresAt ?? null);
  const startedAtLabel = formatDatePtBr(subscription?.startedAt ?? null);

  const resolveCheckoutErrorMessage = useCallback((error: unknown) => {
    if (error instanceof DOMException || error instanceof TypeError) {
      return getNetworkErrorMessage(error);
    }
    if (error instanceof Error) return error.message;
    return "Falha ao iniciar pagamento.";
  }, []);

  const handleCancelAndReopenCheckout = async () => {
    if (!token) {
      setManageError("Sessao expirada. Faca login novamente.");
      return;
    }

    const confirmed = window.confirm(
      "Para trocar cartao ou forma de pagamento, a assinatura atual sera cancelada agora. Deseja continuar?"
    );
    if (!confirmed) return;

    setManageLoading(true);
    setManageError(null);

    try {
      const response = await fetch(apiUrl("/subscriptions/cancel"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message ?? "Nao foi possivel cancelar a assinatura atual.");
      }
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("gp:checkout_reopen_after_cancel", "1");
      }
      await onSubscriptionActivated?.();
    } catch (cancelError) {
      setManageError(resolveCheckoutErrorMessage(cancelError));
    } finally {
      setManageLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([fetchIdentificationTypes(token), fetchPaymentMethods(token)])
      .then(([types, methods]) => {
        if (!active) return;
        const normalizedTypes = (types ?? []).map((type) => ({
          id: String(type.id),
          name: type.name
        }));
        setIdentificationTypes(normalizedTypes);
        if (normalizedTypes.length) {
          setIdentificationType((current) => current || normalizedTypes[0].id);
        }
        setPaymentMethods(Array.isArray(methods) ? methods : []);
      })
      .catch((fetchError) => {
        if (!active) return;
        setCardError(resolveCheckoutErrorMessage(fetchError));
      });

    return () => {
      active = false;
    };
  }, [token, resolveCheckoutErrorMessage]);

  useEffect(() => {
    const cardDigits = digitsOnly(cardNumber);
    const bin = cardDigits.slice(0, 6);
    if (bin.length < 6) {
      setPaymentMethodId(null);
      setIssuerId(null);
      setIssuerOptions([]);
      setInstallmentOptions([]);
      setInstallments(1);
      return;
    }

    const pmFromApi = resolvePaymentMethodId(paymentMethods, bin);
    const fallbackMethodId = resolveFallbackPaymentMethodId(bin);
    const resolvedMethodId = pmFromApi || fallbackMethodId;
    if (!resolvedMethodId) {
      setPaymentMethodId(null);
      setIssuerId(null);
      setIssuerOptions([]);
      setInstallmentOptions([]);
      setInstallments(1);
      setCardError("Payment method nao identificado.");
      return;
    }

    setCardError(null);
    setPaymentMethodId(resolvedMethodId);
  }, [cardNumber, paymentMethods]);

  useEffect(() => {
    if (!token || !paymentMethodId || !amount) {
      setIssuerId(null);
      setIssuerOptions([]);
      setInstallmentOptions([]);
      setInstallments(1);
      return;
    }

    let active = true;
    const loadInstallments = async () => {
      setCardError(null);
      const installmentsResponse = await fetchInstallments(token, {
        amount,
        paymentMethodId,
        issuerId
      });

      if (!active) return;
      const normalizedResponse = Array.isArray(installmentsResponse) ? installmentsResponse : [];
      const issuerMap = new Map<string, { id: string; name: string }>();
      normalizedResponse.forEach((entry) => {
        const issuer = entry?.issuer;
        if (!issuer?.id) return;
        const issuerKey = String(issuer.id);
        if (issuerMap.has(issuerKey)) return;
        issuerMap.set(issuerKey, { id: issuerKey, name: issuer.name ?? issuerKey });
      });

      const issuerList = Array.from(issuerMap.values());
      setIssuerOptions(issuerList);

      if (issuerId && !issuerMap.has(issuerId)) {
        setIssuerId(null);
      }
      if (!issuerId && issuerList.length === 1) {
        setIssuerId(issuerList[0].id);
      }

      const selectedIssuerId = issuerId ?? issuerList[0]?.id ?? null;
      const selectedEntry =
        (selectedIssuerId &&
          normalizedResponse.find((entry) => String(entry?.issuer?.id) === selectedIssuerId)) ||
        normalizedResponse[0];
      const payerCosts = selectedEntry?.payer_costs ?? [];
      const options = payerCosts.map((cost) => ({
        value: cost.installments,
        label: cost.recommended_message ?? `${cost.installments}x`
      }));
      setInstallmentOptions(options);
      if (options.length) {
        setInstallments(options[0].value);
      } else {
        setInstallments(1);
      }
    };

    loadInstallments().catch((err) => {
      if (!active) return;
      setCardError(err instanceof Error ? err.message : "Erro ao calcular parcelas.");
    });

    return () => {
      active = false;
    };
  }, [amount, issuerId, paymentMethodId, token]);

  const handlePixPayment = async () => {
    if (!token) {
      setPixError("Sessao expirada. Faca login novamente.");
      return;
    }
    if (!payerEmail) {
      setPixError("E-mail do pagador obrigatorio.");
      return;
    }
    const identificationDigits = digitsOnly(identificationNumber);
    if (!identificationType || !identificationDigits) {
      setPixError("Documento do pagador obrigatorio.");
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
        transaction_amount: amount,
        description,
        payer: {
          email: payerEmail,
          identification: {
            type: identificationType,
            number: identificationDigits
          }
        },
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
    const cardDigits = digitsOnly(cardNumber);
    const cpf = normalizeCPF(identificationNumber);
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
    if (!identificationType) {
      setCardError("Tipo de documento obrigatorio.");
      return;
    }
    const normalizedDocType = identificationType.trim().toUpperCase();
    if (normalizedDocType !== "CPF") {
      setCardError("Tipo de documento deve ser CPF.");
      return;
    }
    if (cpf.length !== 11) {
      setCardError("CPF deve conter 11 digitos.");
      return;
    }
    const resolvedInstallments = Number(installments);
    if (!Number.isFinite(resolvedInstallments) || resolvedInstallments < 1) {
      setCardError("Parcelas obrigatorias.");
      return;
    }

    const bin = cardDigits.slice(0, 6);
    const pmFromApi = resolvePaymentMethodId(paymentMethods, bin);
    const fallbackMethodId = resolveFallbackPaymentMethodId(bin);
    const resolvedMethodId = pmFromApi || fallbackMethodId;
    if (!resolvedMethodId) {
      setCardError("Payment method nao identificado.");
      return;
    }

    setCardLoading(true);
    setCardError(null);
    setCardResult(null);

    try {
      console.log("BIN", bin);
      console.log("payment_method_id", resolvedMethodId);
      console.log("installments", installments);

      const cardTokenResponse = await mpRef.current.createCardToken({
        cardNumber: cardDigits,
        cardholderName: cardholderName.trim(),
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: expirationYear,
        securityCode: securityCode.trim(),
        identificationType: normalizedDocType,
        identificationNumber: cpf
      });

      const cardToken = cardTokenResponse?.id;
      console.log("token created ok?", Boolean(cardToken));
      if (!cardToken || typeof cardToken !== "string" || !cardToken.trim()) {
        const message = cardTokenResponse?.error?.message ?? "Falha ao tokenizar cartao.";
        throw new Error(message);
      }
      if (!payerEmail) {
        setCardError("E-mail do pagador obrigatorio.");
        return;
      }
      if (!amount) {
        setCardError("Valor do plano invalido.");
        return;
      }
      if (!identificationType) {
        setCardError("Tipo de documento obrigatorio.");
        return;
      }
      if (normalizedDocType !== "CPF") {
        setCardError("Tipo de documento deve ser CPF.");
        return;
      }
      if (cpf.length !== 11) {
        setCardError("CPF deve conter 11 digitos.");
        return;
      }
      if (!resolvedMethodId) {
        setCardError("Payment method nao identificado.");
        return;
      }
      if (!Number.isFinite(resolvedInstallments) || resolvedInstallments < 1) {
        setCardError("Parcelas obrigatorias.");
        return;
      }

      const response = await createCardPayment(token, {
        transaction_amount: amount,
        description,
        token: cardToken,
        payment_method_id: resolvedMethodId,
        installments: resolvedInstallments,
        issuer_id: issuerId ?? undefined,
        payer: {
          email: payerEmail,
          identification: {
            type: normalizedDocType,
            number: cpf
          }
        },
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
      if (cardPaymentError instanceof ApiRequestError) {
        console.error("[checkout] card payment error", {
          status: cardPaymentError.status,
          body: cardPaymentError.body
        });
      } else {
        console.error("[checkout] card payment error", cardPaymentError);
      }
      setCardError(resolveCheckoutErrorMessage(cardPaymentError));
    } finally {
      setCardLoading(false);
    }
  };

  if (subscription?.status === "ACTIVE") {
    return (
      <div className="checkout-page">
        <section className="checkout-card checkout-manage">
          <header className="checkout-manage-hero">
            <div>
              <p className="eyebrow">Gestao de pagamento</p>
              <h2>Assinatura ativa e pronta para uso</h2>
              <p className="subtext">
                Aqui voce acompanha plano, ciclo e metodo atual, alem de executar troca de pagamento quando precisar.
              </p>
            </div>
            <span className="checkout-manage-status">{currentStatusLabel}</span>
          </header>

          <div className="checkout-manage-grid">
            <article className="checkout-manage-card">
              <div className="checkout-manage-card__title">
                <CreditCard size={16} />
                <h3>Plano e cobranca</h3>
              </div>
              <dl className="checkout-manage-metrics">
                <div>
                  <dt>Plano atual</dt>
                  <dd>{currentPlanName}</dd>
                </div>
                <div>
                  <dt>Ciclo</dt>
                  <dd>{currentBillingCycleLabel}</dd>
                </div>
                <div>
                  <dt>Metodo atual</dt>
                  <dd>{currentPaymentMethodLabel}</dd>
                </div>
                <div>
                  <dt>Inicio</dt>
                  <dd>{startedAtLabel}</dd>
                </div>
                <div>
                  <dt>Proxima cobranca</dt>
                  <dd>{nextBillingDate}</dd>
                </div>
              </dl>
            </article>

            <article className="checkout-manage-card">
              <div className="checkout-manage-card__title">
                <CalendarClock size={16} />
                <h3>Gerenciar assinatura</h3>
              </div>
              <div className="checkout-manage-steps">
                <p>
                  Para trocar cartao ou forma de pagamento, o sistema precisa encerrar a assinatura atual e iniciar novo
                  checkout.
                </p>
                <div className="checkout-manage-warning">
                  <AlertTriangle size={15} />
                  <span>A troca de pagamento cancela a assinatura atual antes da nova cobranca.</span>
                </div>
              </div>
              <div className="checkout-manage-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleCancelAndReopenCheckout}
                  disabled={manageLoading}
                >
                  {manageLoading ? "Preparando checkout..." : "Trocar forma de pagamento"}
                </button>
                <button type="button" className="secondary-button" onClick={() => navigate("/plano")}>
                  Ver detalhes do plano
                </button>
              </div>
              {manageError ? <p className="error-text">{manageError}</p> : null}
            </article>
          </div>

          <div className="checkout-manage-footer">
            <button type="button" className="ghost-button" onClick={() => navigate("/dashboard")}>
              <CheckCircle2 size={16} />
              Ir para dashboard
            </button>
            <button type="button" className="ghost-button" onClick={() => navigate("/organizacao")}>
              <FileText size={16} />
              Criar/selecionar organizacao
            </button>
            <button type="button" className="ghost-button" onClick={onSubscriptionActivated}>
              <RefreshCw size={16} />
              Atualizar status
            </button>
          </div>
        </section>

        <aside className="checkout-sidebar checkout-manage-sidebar">
          <h4>Resumo rapido</h4>
          <ul>
            <li>
              <strong>Plano:</strong> {currentPlanName}
            </li>
            <li>
              <strong>Metodo:</strong> {currentPaymentMethodLabel}
            </li>
            <li>
              <strong>Ciclo:</strong> {currentBillingCycleLabel}
            </li>
            <li>
              <strong>Proxima cobranca:</strong> {nextBillingDate}
            </li>
          </ul>
          <p className="muted">Pagamento processado via provedor seguro e com atualizacao automatica da assinatura.</p>
        </aside>
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

        {info && <p className="warning-text">{info}</p>}
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
            <div className="payment-row">
              <label className="input-group">
                <span>Tipo de documento</span>
                <select
                  value={identificationType}
                  onChange={(event) => setIdentificationType(event.target.value)}
                  disabled={!identificationTypes.length}
                >
                  {identificationTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="input-group">
                <span>Numero do documento</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="CPF/CNPJ"
                  value={identificationNumber}
                  onChange={(event) => setIdentificationNumber(formatIdentificationNumber(event.target.value))}
                />
              </label>
            </div>
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
                  <span>Tipo de documento</span>
                  <select
                    value={identificationType}
                    onChange={(event) => setIdentificationType(event.target.value)}
                    disabled={!identificationTypes.length}
                  >
                    {identificationTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="input-group">
                  <span>Numero do documento</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="CPF/CNPJ"
                    value={identificationNumber}
                    onChange={(event) => setIdentificationNumber(formatIdentificationNumber(event.target.value))}
                  />
                </label>
              </div>
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
