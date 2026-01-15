import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { apiFetch, getNetworkErrorMessage, parseApiError } from "../config/api";
const AuthContext = createContext(undefined);
const registerErrorMap = {
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
const fieldLabelMap = {
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
const resolveInvalidPayloadMessage = (details) => {
    if (!details)
        return registerErrorMap.INVALID_PAYLOAD;
    const fields = Object.keys(details);
    if (!fields.length)
        return registerErrorMap.INVALID_PAYLOAD;
    const labels = fields.map((field) => fieldLabelMap[field] ?? field);
    return `Confira os dados informados: ${labels.join(", ")}.`;
};
const appendRequestId = (message, body) => {
    const requestId = body?.requestId;
    return requestId ? `${message} (ID: ${requestId})` : message;
};
const resolveRegisterErrorMessage = (response, body) => {
    const code = body?.code;
    let baseMessage;
    if (code === "INVALID_PAYLOAD") {
        baseMessage = resolveInvalidPayloadMessage(body?.details);
    }
    else if (code && registerErrorMap[code]) {
        baseMessage = registerErrorMap[code];
    }
    else if (response.status >= 500) {
        baseMessage = "Erro ao criar conta. Tente novamente em instantes.";
    }
    else {
        baseMessage = body?.message ?? "Falha ao criar conta.";
    }
    return appendRequestId(baseMessage, body);
};
export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState(null);
    useEffect(() => {
        let isMounted = true;
        supabase.auth.getSession().then(({ data }) => {
            if (!isMounted)
                return;
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
    const signIn = async (email, password) => {
        setError(null);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError(error.message);
            throw error;
        }
        setSession(data.session);
        setStatus("authenticated");
    };
    const signUp = async (payload) => {
        setError(null);
        let response;
        try {
            response = await apiFetch("/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                retry: 0,
                timeoutMs: 15000
            });
        }
        catch (error) {
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
        const sessionData = body?.session;
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
    const value = useMemo(() => ({
        status,
        session,
        user: session?.user ?? null,
        token: session?.access_token ?? null,
        error,
        signIn,
        signUp,
        signOut
    }), [status, session, error]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};
