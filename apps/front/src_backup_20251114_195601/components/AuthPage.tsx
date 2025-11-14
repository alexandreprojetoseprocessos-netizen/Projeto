import { FormEvent, useState } from "react";

type AuthPageProps = {
  onSubmit: (payload: { email: string; password: string }) => Promise<void> | void;
  onSignUp: (payload: { email: string; password: string }) => Promise<void> | void;
  error?: string | null;
};

export const AuthPage = ({ onSubmit, onSignUp, error }: AuthPageProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orgMode, setOrgMode] = useState<"new" | "invite">("new");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

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
      <section className="auth-hero">
        <div className="auth-hero__logo">G&P</div>
        <div className="auth-hero__content">
          <p className="eyebrow">Gestão visual, colaborativa e em tempo real</p>
          <h1>Organize seus projetos, equipe e resultados em um só lugar.</h1>
          <p className="subtext">
            Dashboards inteligentes, kanban em tempo real e integrações profundas com Supabase e GitHub.
          </p>
        </div>
        <div className="auth-hero__highlights">
          <div>
            <strong>+120</strong>
            <span>Projetos ativos</span>
          </div>
          <div>
            <strong>98%</strong>
            <span>Equipes engajadas</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <header className="auth-card__header">
            <p>{mode === "login" ? "Bem-vindo de volta" : "Comece em minutos"}</p>
            <h2>{mode === "login" ? "Entrar no G&P" : "Crie sua conta"}</h2>
          </header>

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
                placeholder="voce@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="input-group">
              <span>Senha</span>
              <input
                type="password"
                placeholder="••••••••"
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

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitLabel}
            </button>

            {displayedError && <span className="form-error">{displayedError}</span>}
          </form>

          <div className="auth-social">
            <div className="divider">
              <span>ou</span>
            </div>
            <button type="button" className="social-button google">
              Continuar com Google
            </button>
            <button type="button" className="social-button microsoft">
              Continuar com Microsoft
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
