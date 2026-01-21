import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth, type RegisterPayload } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

import { Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";

type PlanParam = "START" | "BUSINESS" | "ENTERPRISE" | null;

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const stripDocument = (value: string) => value.replace(/\D/g, "");

const formatCpf = (value: string) => {
  const digits = stripDocument(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatCnpj = (value: string) => {
  const digits = stripDocument(value).slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

const isRepeatedDigits = (value: string) => /^(\d)\1+$/.test(value);

const validateCpf = (raw: string) => {
  const cpf = stripDocument(raw);
  if (cpf.length !== 11 || isRepeatedDigits(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(cpf[i]) * (10 - i);
  }
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(cpf[i]) * (11 - i);
  }
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return check === Number(cpf[10]);
};

const validateCnpj = (raw: string) => {
  const cnpj = stripDocument(raw);
  if (cnpj.length !== 14 || isRepeatedDigits(cnpj)) return false;
  const calcCheck = (length: number) => {
    let sum = 0;
    let pos = length - 7;
    for (let i = length; i >= 1; i -= 1) {
      sum += Number(cnpj[length - i]) * pos;
      pos -= 1;
      if (pos < 2) pos = 9;
    }
    const result = sum % 11;
    return result < 2 ? 0 : 11 - result;
  };
  const check1 = calcCheck(12);
  const check2 = calcCheck(13);
  return check1 === Number(cnpj[12]) && check2 === Number(cnpj[13]);
};

const isEmailValid = (value: string) => /\S+@\S+\.\S+/.test(value);

const isPasswordStrong = (value: string) => {
  if (value.length < 8) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  if (!/\d/.test(value)) return false;
  return true;
};

function usePlanFromQuery(): PlanParam {
  const { search } = useLocation();
  return useMemo(() => {
    const p = new URLSearchParams(search).get("plan");
    if (!p) return null;
    const upper = p.toUpperCase();
    if (upper === "START" || upper === "BUSINESS" || upper === "ENTERPRISE") return upper;
    return null;
  }, [search]);
}

const inputClassName =
  "w-full h-11 rounded-lg border border-slate-200 bg-[#eef5ff] px-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, error: authError } = useAuth();
  const plan = usePlanFromQuery();

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [fullName, setFullName] = useState("");
  const [corporateEmail, setCorporateEmail] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [documentType, setDocumentType] = useState<"CPF" | "CNPJ">("CPF");
  const [documentNumber, setDocumentNumber] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [startMode, setStartMode] = useState<RegisterPayload["startMode"]>("NEW_ORG");
  const [organizationName, setOrganizationName] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const planLabelMap: Record<string, string> = {
    START: "Start",
    BUSINESS: "Business",
    ENTERPRISE: "Enterprise"
  };
  const selectedPlanLabel = plan ? planLabelMap[plan] ?? plan : null;

  useEffect(() => {
    if (plan) {
      window.localStorage.setItem("gp:selectedPlan", plan);
    }
  }, [plan]);

  useEffect(() => {
    setDocumentNumber((current) => (documentType === "CPF" ? formatCpf(current) : formatCnpj(current)));
  }, [documentType]);

  const validateSignupForm = (mode: RegisterPayload["startMode"]) => {
    const errors: Record<string, string> = {};
    const trimmedFullName = fullName.trim();
    const trimmedCorporateEmail = corporateEmail.trim();
    const trimmedPersonalEmail = personalEmail.trim();
    const normalizedDocument = stripDocument(documentNumber);
    const trimmedOrganizationName = organizationName.trim();
    const trimmedInviteToken = inviteToken.trim();

    if (!trimmedFullName) {
      errors.fullName = "Informe seu nome completo.";
    }
    if (!trimmedCorporateEmail || !isEmailValid(trimmedCorporateEmail)) {
      errors.corporateEmail = "Informe um e-mail corporativo válido.";
    }
    if (!trimmedPersonalEmail || !isEmailValid(trimmedPersonalEmail)) {
      errors.personalEmail = "Informe um e-mail pessoal válido.";
    }
    if (
      trimmedCorporateEmail &&
      trimmedPersonalEmail &&
      normalizeEmail(trimmedCorporateEmail) === normalizeEmail(trimmedPersonalEmail)
    ) {
      errors.email = "Os e-mails corporativo e pessoal precisam ser diferentes.";
    }
    if (!documentType) {
      errors.documentType = "Selecione o tipo de documento.";
    }
    if (!normalizedDocument) {
      errors.documentNumber = "Informe o número do documento.";
    } else if (documentType === "CPF" && !validateCpf(documentNumber)) {
      errors.documentNumber = "CPF inválido.";
    } else if (documentType === "CNPJ" && !validateCnpj(documentNumber)) {
      errors.documentNumber = "CNPJ inválido.";
    }
    if (!signupPassword.trim()) {
      errors.password = "Informe uma senha.";
    } else if (!isPasswordStrong(signupPassword)) {
      errors.password = "Senha fraca. Use no mínimo 8 caracteres, com letras e números.";
    }
    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Confirme a sua senha.";
    } else if (signupPassword !== confirmPassword) {
      errors.confirmPassword = "As senhas não conferem.";
    }
    if (mode === "NEW_ORG" && !trimmedOrganizationName) {
      errors.organizationName = "Informe o nome da organização.";
    }
    if (mode === "INVITE" && !trimmedInviteToken) {
      errors.inviteToken = "Informe o código do convite.";
    }
    if (!acceptedTerms) {
      errors.terms = "Aceite os termos para continuar.";
    }

    return Object.keys(errors).length ? errors : null;
  };

  const realLogin = async () => {
    await signIn(normalizeEmail(email), password);
  };

  const realSignup = async () => {
    const payload: RegisterPayload = {
      fullName: fullName.trim(),
      corporateEmail: normalizeEmail(corporateEmail),
      personalEmail: normalizeEmail(personalEmail),
      documentType,
      documentNumber: stripDocument(documentNumber),
      password: signupPassword,
      startMode,
      organizationName: startMode === "NEW_ORG" ? organizationName.trim() : undefined,
      inviteToken: startMode === "INVITE" ? inviteToken.trim() : undefined
    };
    await signUp(payload);
  };

  const realResetPassword = async () => {
    await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
      redirectTo: `${window.location.origin}/auth`
    });
  };

  const realOAuthGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth` }
    });
  };

  const realOAuthMicrosoft = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: { redirectTo: `${window.location.origin}/auth` }
    });
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLocalError("Informe seu e-mail corporativo e senha.");
      return;
    }
    setIsLoading(true);
    setLocalError(null);
    try {
      await realLogin();
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setLocalError(err?.message ?? "Verifique suas credenciais e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setLocalError(null);
    const errors = validateSignupForm(startMode);
    if (errors) {
      const [firstError] = Object.values(errors);
      if (firstError) setLocalError(firstError);
      setIsLoading(false);
      return;
    }
    try {
      await realSignup();
      navigate("/checkout", { replace: true });
    } catch (err: any) {
      setLocalError(err?.message ?? "Confira os dados e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setLocalError("Informe seu email para recuperar a senha.");
      return;
    }
    setIsLoading(true);
    setLocalError(null);
    try {
      await realResetPassword();
    } catch (err: any) {
      setLocalError(err?.message ?? "Tente novamente em instantes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    setLocalError(null);
    try {
      await realOAuthGoogle();
    } catch (err: any) {
      setLocalError(err?.message ?? "Falha ao entrar com Google.");
      setIsLoading(false);
    }
  };

  const handleMicrosoft = async () => {
    setIsLoading(true);
    setLocalError(null);
    try {
      await realOAuthMicrosoft();
    } catch (err: any) {
      setLocalError(err?.message ?? "Falha ao entrar com Microsoft.");
      setIsLoading(false);
    }
  };

  const displayedError = localError ?? authError ?? null;
  const documentPlaceholder = documentType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0b1b4d] via-[#1238a8] to-[#2f5fe0] flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-200/30 mix-blend-multiply blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-300/30 mix-blend-multiply blur-3xl opacity-20 animate-pulse" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/30 mix-blend-multiply blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 w-full max-w-[460px]">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-blue-700 font-extrabold text-sm">G&P</span>
          </div>
          <span className="text-2xl font-bold text-white">Gestão de Projetos</span>
        </Link>

        <Card className="border-border/20 bg-white shadow-2xl rounded-2xl">
          <CardHeader className="text-center pb-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              Bem-vindo de volta
            </h2>
            <p className="text-sm text-slate-500">
              Entre na sua conta ou crie uma nova
              {selectedPlanLabel ? (
                <span className="block mt-2 text-xs text-slate-500">
                  Plano selecionado: <b>{selectedPlanLabel}</b>
                </span>
              ) : null}
            </p>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-2 rounded-full border border-[#E5E7EB] bg-[#F3F4F6] p-[7px] mb-6 shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`rounded-full h-10 px-6 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  tab === "login"
                    ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                    : "bg-[#F3F4F6] text-slate-500 border border-[#E5E7EB] hover:bg-white/70"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setTab("signup")}
                className={`rounded-full h-10 px-6 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  tab === "signup"
                    ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                    : "bg-[#F3F4F6] text-slate-500 border border-[#E5E7EB] hover:bg-white/70"
                }`}
              >
                Cadastrar
              </button>
            </div>

            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email corporativo
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder="nome@empresa.com"
                      className={`${inputClassName} pl-10`}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className={`${inputClassName} pl-10`}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-500/80">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 translate-y-[1px]"
                  />
                  Lembrar de mim
                </label>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-[#0B2B40] hover:bg-[#103652] text-white font-semibold shadow-[0_2px_8px_rgba(2,6,23,0.2)] focus:outline-none focus:ring-2 focus:ring-blue-300 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-0"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Entrando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Entrar <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-slate-700">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      className={`${inputClassName} pl-10`}
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="signup-email" className="text-sm font-medium text-slate-700">
                    E-mail corporativo
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="signup-email"
                      type="email"
                      placeholder="nome@empresa.com"
                      className={`${inputClassName} pl-10`}
                      value={corporateEmail}
                      onChange={(event) => setCorporateEmail(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="signup-personal-email" className="text-sm font-medium text-slate-700">
                    E-mail pessoal
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="signup-personal-email"
                      type="email"
                      placeholder="nome@gmail.com"
                      className={`${inputClassName} pl-10`}
                      value={personalEmail}
                      onChange={(event) => setPersonalEmail(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Documento</span>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="document-type"
                        value="CPF"
                        checked={documentType === "CPF"}
                        onChange={() => setDocumentType("CPF")}
                        className="h-4 w-4 text-blue-600"
                      />
                      CPF
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="document-type"
                        value="CNPJ"
                        checked={documentType === "CNPJ"}
                        onChange={() => setDocumentType("CNPJ")}
                        className="h-4 w-4 text-blue-600"
                      />
                      CNPJ
                    </label>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={documentPlaceholder}
                    className={inputClassName}
                    value={documentNumber}
                    onChange={(event) =>
                      setDocumentNumber(documentType === "CPF" ? formatCpf(event.target.value) : formatCnpj(event.target.value))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="signup-password" className="text-sm font-medium text-slate-700">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="signup-password"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      className={`${inputClassName} pl-10`}
                      value={signupPassword}
                      onChange={(event) => setSignupPassword(event.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="signup-confirm" className="text-sm font-medium text-slate-700">
                    Confirme a senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="signup-confirm"
                      type="password"
                      placeholder="Repita sua senha"
                      className={`${inputClassName} pl-10`}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Como você quer começar?</span>
                  <div className="flex flex-col gap-2 text-sm text-slate-600">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="organization-mode"
                        value="NEW_ORG"
                        checked={startMode === "NEW_ORG"}
                        onChange={() => setStartMode("NEW_ORG")}
                        className="h-4 w-4 text-blue-600"
                      />
                      Criar nova organização
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="organization-mode"
                        value="INVITE"
                        checked={startMode === "INVITE"}
                        onChange={() => setStartMode("INVITE")}
                        className="h-4 w-4 text-blue-600"
                      />
                      Entrar em uma existente (convite)
                    </label>
                  </div>
                </div>

                {startMode === "NEW_ORG" ? (
                  <div className="space-y-2">
                    <label htmlFor="org-name" className="text-sm font-medium text-slate-700">
                      Nome da organização
                    </label>
                    <input
                      id="org-name"
                      type="text"
                      placeholder="Ex: Empresa Exemplo"
                      className={inputClassName}
                      value={organizationName}
                      onChange={(event) => setOrganizationName(event.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label htmlFor="invite-token" className="text-sm font-medium text-slate-700">
                      Código do convite
                    </label>
                    <input
                      id="invite-token"
                      type="text"
                      placeholder="Cole aqui o token do convite"
                      className={inputClassName}
                      value={inviteToken}
                      onChange={(event) => setInviteToken(event.target.value)}
                      required
                    />
                    <span className="text-xs text-slate-400">
                      Peça ao administrador o convite da organização.
                    </span>
                  </div>
                )}

                <label className="flex items-start gap-2 text-sm text-slate-500">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                    required
                  />
                  Concordo com os{" "}
                  <Link to="#" className="text-blue-600 hover:text-blue-700">
                    Termos de Serviço
                  </Link>{" "}
                  e{" "}
                  <Link to="#" className="text-blue-600 hover:text-blue-700">
                    Política de Privacidade
                  </Link>
                </label>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-[#0B2B40] hover:bg-[#103652] text-white font-semibold shadow-[0_2px_8px_rgba(2,6,23,0.2)] focus:outline-none focus:ring-2 focus:ring-blue-300 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-0"
                  disabled={isLoading || !acceptedTerms}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Criando conta...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Criar conta <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>
            )}

            {displayedError ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {displayedError}
              </div>
            ) : null}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-400">ou continue com</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="ghost"
                className="h-12 bg-transparent border-0 text-slate-500 hover:bg-[#F3F4F6] focus-visible:ring-0 flex items-center justify-center gap-2"
                type="button"
                onClick={handleGoogle}
                disabled={isLoading}
              >
                <span className="inline-flex h-4 w-4 items-center justify-center">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </span>
                Google
              </Button>

              <Button
                variant="ghost"
                className="h-12 bg-transparent border-0 text-slate-500 hover:bg-[#F3F4F6] focus-visible:ring-0 flex items-center justify-center gap-2"
                type="button"
                onClick={handleMicrosoft}
                disabled={isLoading}
              >
                <span className="inline-grid grid-cols-2 gap-[2px]">
                  <span className="h-2 w-2 bg-[#F25022]" />
                  <span className="h-2 w-2 bg-[#7FBA00]" />
                  <span className="h-2 w-2 bg-[#00A4EF]" />
                  <span className="h-2 w-2 bg-[#FFB900]" />
                </span>
                Microsoft
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-white/70 text-sm mt-6">
          © 2024 G&P Gestão de Projetos. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Auth;
