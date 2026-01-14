import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { apiUrl } from "../config/api";
const AuthContext = createContext(undefined);
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
        const response = await fetch(apiUrl("/auth/register"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = body?.message ?? "Falha ao criar conta.";
            setError(message);
            throw new Error(message);
        }
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
