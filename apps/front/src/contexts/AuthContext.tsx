import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { apiFetch, getNetworkErrorMessage, parseApiError } from "../config/api";

type AuthStatus = "loading" | "unauthenticated" | "authenticated";

export type RegisterPayload = {
  fullName: string;
  corporateEmail: string;
  personalEmail: string;
  documentType: "CPF" | "CNPJ";
  documentNumber: string;
  password: string;
  startMode: "NEW_ORG" | "INVITE";
  organizationName?: string;
  inviteToken?: string;
};

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  token: string | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const registerErrorMap: Record<string, string> = {
  EMAIL_ALREADY_USED: "E-mail j\u00e1 cadastrado.",
  INVALID_DOCUMENT: "CPF ou CNPJ inv\u00e1lido.",
  INVITE_INVALID: "Convite inv\u00e1lido ou expirado.",
  INVITE_INVALID_OR_EXPIRED: "Convite inv\u00e1lido ou expirado.",
  INVITE_REQUIRED: "Informe o c\u00f3digo do convite para continuar.",
  EMAILS_MUST_DIFFER: "Os e-mails corporativo e pessoal precisam ser diferentes.",
  INVALID_PAYLOAD: "Confira os dados informados.",
  MISSING_SUPABASE_ADMIN: "Configura\u00e7\u00e3o do servidor incompleta. Fale com o suporte.",
  SUPABASE_NOT_CONFIGURED: "Servidor indispon\u00edvel. Tente novamente.",
  WEAK_PASSWORD: "Senha fraca. Use no m\u00ednimo 8 caracteres, com letras e n\u00fameros.",
  INTERNAL: "Erro ao criar conta. Tente novamente em instantes."
};

const fieldLabelMap: Record<string, string> = {
  fullName: "Nome completo",
  corporateEmail: "E-mail corporativo",
  personalEmail: "E-mail pessoal",
  documentType: "Tipo de documento",
  documentNumber: "N\u00famero do documento",
  startMode: "Modo de in\u00edcio",
  organizationName: "Nome da organiza\u00e7\u00e3o",
  inviteToken: "C\u00f3digo do convite",
  password: "Senha"
};

const resolveInvalidPayloadMessage = (details?: Record<string, string[]>) => {
  if (!details) return registerErrorMap.INVALID_PAYLOAD;
  const fields = Object.keys(details);
  if (!fields.length) return registerErrorMap.INVALID_PAYLOAD;
  const labels = fields.map((field) => fieldLabelMap[field] ?? field);
  return `Confira os dados informados: ${labels.join(", ")}.`;
};

const appendRequestId = (message: string, body: any) => {
  const requestId = body?.requestId;
  return requestId ? `${message} (ID: ${requestId})` : message;
};

const resolveRegisterErrorMessage = (response: Response, body: any) => {
  const code = body?.code;
  let baseMessage;
  if (code === "INVALID_PAYLOAD") {
    baseMessage = resolveInvalidPayloadMessage(body?.details);
  } else if (code && registerErrorMap[code]) {
    baseMessage = registerErrorMap[code];
  } else if (response.status >= 500) {
    baseMessage = "Erro ao criar conta. Tente novamente em instantes.";
  } else {
    baseMessage = body?.message ?? "Falha ao criar conta.";
  }
  return appendRequestId(baseMessage, body);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setStatus(data.session ? "authenticated" : "unauthenticated");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      setSession(updatedSession);
      setStatus(updatedSession ? "authenticated" : "unauthenticated");
      setError(null);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      throw error;
    }
    setSession(data.session);
    setStatus("authenticated");
  };

  const signUp = async (payload: RegisterPayload) => {
    setError(null);
    let response: Response;
    try {
      response = await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        retry: 0,
        timeoutMs: 15000
      });
    } catch (error) {
      const message = getNetworkErrorMessage(error);
      setError(message);
      throw new Error(message);
    }

    if (!response.ok) {
      const apiError = await parseApiError(response, "/auth/register");
      const message = resolveRegisterErrorMessage(response, apiError.body ?? apiError);
      setError(message);
      throw new Error(message);
    }

    const body = await response.json().catch(() => ({}));
    const sessionData = body?.session as Session | null | undefined;
    if (sessionData?.access_token && sessionData?.refresh_token) {
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token
      });
      if (sessionError) {
        setError(sessionError.message);
        throw sessionError;
      }
      setSession(data.session ?? null);
      setStatus(data.session ? "authenticated" : "unauthenticated");
      return;
    }

    await signIn(payload.corporateEmail, payload.password);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setStatus("unauthenticated");
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      token: session?.access_token ?? null,
      error,
      signIn,
      signUp,
      signOut
    }),
    [status, session, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
