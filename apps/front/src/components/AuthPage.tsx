import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

type AuthPageProps = {
  onSubmit: (payload: { email: string; password: string }) => Promise<void> | void;
  onSignUp: (payload: { email: string; password: string }) => Promise<void> | void;
  error?: string | null;
};

export const AuthPage = ({ onSubmit, onSignUp, error }: AuthPageProps) => {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const selectedPlan = params.get("plan");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orgMode, setOrgMode] = useState<"new" | "invite">("new");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const planNameMap: Record<string, string> = {
    START: "Start",
    BUSINESS: "Business",
    ENTERPRISE: "Enterprise"
  };
  const selectedPlanName = selectedPlan ? planNameMap[selectedPlan] ?? selectedPlan : null;

  useEffect(() => {
    if (selectedPlan) {
      window.localStorage.setItem("gp:selectedPlan", selectedPlan);
    }
  }, [selectedPlan]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setSubmitting(true);

    try {
      if (mode === "register") {
        if (password !== confirmPassword) {
          setLocalError("As senhas não coincidem.");
          return;
        }
        await onSignUp({ email, password });
      } else {
        await onSubmit({ email, password });
      }
    } catch (submitError) {
      setLocalError(
        submitError instanceof Error ? submitError.message : "Não foi possível completar a solicitação."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const displayedError = localError ?? error ?? null;
  const submitLabel = submitting ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta";

  return (
    <div className="auth-page">
      <section className="auth-panel">
        <div className="auth-card">
          <header className="auth-card__header">
            <div className="auth-brand">
              <img className="auth-logo" src="/logo-gp.svg" alt="G&P" width={44} height={44} />
              <div className="auth-brand__text">
                <span className="auth-brand__name">G&P — Gestão de Projetos</span>
                <span className="auth-brand__subtitle">Gestão visual, colaborativa e em tempo real</span>
              </div>
            </div>
            <div className="auth-card__intro">
              <p>{mode === "login" ? "Bem-vindo de volta" : "Comece em minutos"}</p>
              <h2>{mode === "login" ? "Entrar no G&P" : "Crie sua conta"}</h2>
            </div>
          </header>

          {mode === "register" && selectedPlanName && (
            <p className="auth-selected-plan">
              Você está criando sua conta no plano <strong>{selectedPlanName}</strong>. Depois do cadastro vamos
              configurar o pagamento e a sua primeira organização.
            </p>
          )}

          {mode === "login" && selectedPlanName && (
            <p className="auth-selected-plan">
              Você escolheu o plano <strong>{selectedPlanName}</strong> na página inicial. Faça login para continuar.
            </p>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <label className="input-group">
                <span>Nome completo</span>
                <input
                  type="text"
                  placeholder="Como devemos te chamar?"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>
            )}

            <label className="input-group">
              <span>E-mail corporativo</span>
              <input
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="input-group">
              <span>Senha</span>
              <input
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {mode === "register" && (
              <label className="input-group">
                <span>Confirme a senha</span>
                <input
                  type="password"
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </label>
            )}

            {mode === "login" && (
              <div className="helper-links">
                <button type="button" className="link-button">
                  Esqueci minha senha
                </button>
              </div>
            )}

            {mode === "register" && (
              <div className="auth-options">
                <span>Como você quer começar?</span>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="organization-mode"
                      value="new"
                      checked={orgMode === "new"}
                      onChange={() => setOrgMode("new")}
                    />
                    <span>Criar nova organização</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="organization-mode"
                      value="invite"
                      checked={orgMode === "invite"}
                      onChange={() => setOrgMode("invite")}
                    />
                    <span>Entrar em uma existente (convite)</span>
                  </label>
                </div>
              </div>
            )}

            <button className="primary-button" type="submit" disabled={submitting} data-loading={submitting}>
              {submitLabel}
            </button>

            {displayedError && <span className="form-error">{displayedError}</span>}
          </form>

          <div className="auth-social">
            <div className="divider">
              <span>ou</span>
            </div>
            <button type="button" className="social-button google">
              <span className="social-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M21.805 10.023h-9.18v3.96h5.253c-.226 1.216-1.356 3.56-5.253 3.56-3.159 0-5.737-2.616-5.737-5.833 0-3.217 2.578-5.833 5.737-5.833 1.8 0 3 .76 3.69 1.416l2.52-2.43C17.19 2.44 15.18 1.5 12.625 1.5 7.807 1.5 3.875 5.435 3.875 10.25c0 4.816 3.932 8.75 8.75 8.75 5.04 0 8.38-3.54 8.38-8.537 0-.575-.063-1.013-.142-1.44z"
                  />
                </svg>
              </span>
              <span>Continuar com Google</span>
            </button>
            <button type="button" className="social-button microsoft">
              <span className="social-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <rect x="2" y="2" width="9" height="9" fill="#f25022" />
                  <rect x="13" y="2" width="9" height="9" fill="#7fba00" />
                  <rect x="2" y="13" width="9" height="9" fill="#00a4ef" />
                  <rect x="13" y="13" width="9" height="9" fill="#ffb900" />
                </svg>
              </span>
              <span>Continuar com Microsoft</span>
            </button>
          </div>

          <div className="auth-toggle">
            {mode === "login" ? (
              <>
                <span>Ainda não tem conta?</span>
                <button type="button" onClick={() => setMode("register")}>
                  Criar conta
                </button>
              </>
            ) : (
              <>
                <span>Já tem conta?</span>
                <button type="button" onClick={() => setMode("login")}>
                  Entrar
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
