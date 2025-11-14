import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
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
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setStatus(session ? "authenticated" : "unauthenticated");
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
    const signUp = async ({ email, password }) => {
        setError(null);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin }
        });
        if (error) {
            setError(error.message);
            throw error;
        }
        setSession(data.session ?? null);
        setStatus(data.session ? "authenticated" : "unauthenticated");
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
