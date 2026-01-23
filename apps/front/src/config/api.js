import { supabase } from "../lib/supabase";
const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
const resolvedBaseUrl = (() => {
    if (typeof envBaseUrl === "string" && envBaseUrl.trim()) {
        return envBaseUrl.trim();
    }
    if (import.meta.env.DEV) {
        return "http://localhost:4000";
    }
    throw new Error("VITE_API_BASE_URL is required in production.");
})();
const normalizedBaseUrl = resolvedBaseUrl.endsWith("/")
    ? resolvedBaseUrl.slice(0, -1)
    : resolvedBaseUrl;
export const apiBaseUrl = normalizedBaseUrl;
export const apiUrl = (path = "") => {
    if (!path)
        return normalizedBaseUrl;
    if (/^https?:\/\//i.test(path))
        return path;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${normalizedBaseUrl}${normalizedPath}`;
};
const DEFAULT_TIMEOUT_MS = 15000;
const fetchWithTimeout = async (url, options, timeoutMs) => {
    if (!timeoutMs)
        return fetch(url, options);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    }
    finally {
        window.clearTimeout(timeoutId);
    }
};
const isRetryableMethod = (method) => {
    const normalized = (method ?? "GET").toUpperCase();
    return normalized === "GET" || normalized === "HEAD";
};
export const apiFetch = async (path, options = {}) => {
    const { timeoutMs = DEFAULT_TIMEOUT_MS, retry, ...fetchOptions } = options;
    const retryCount = typeof retry === "number" ? retry : isRetryableMethod(fetchOptions.method) ? 1 : 0;
    const headers = new Headers(fetchOptions.headers ?? undefined);
    if (!headers.has("Content-Type"))
        headers.set("Content-Type", "application/json");
    if (!headers.has("Authorization")) {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token)
            headers.set("Authorization", `Bearer ${token}`);
    }
    const requestOptions = { ...fetchOptions, headers };
    let lastError;
    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
        try {
            return await fetchWithTimeout(apiUrl(path), requestOptions, timeoutMs);
        }
        catch (error) {
            lastError = error;
            if (attempt === retryCount)
                throw error;
        }
    }
    throw lastError;
};
export const parseApiError = async (response, url) => {
    const rawText = await response.text();
    let body = {};
    if (rawText) {
        try {
            body = JSON.parse(rawText);
        }
        catch {
            body = { message: rawText };
        }
    }
    console.warn("[api] request failed", {
        url: url ?? response.url,
        status: response.status,
        body: rawText
    });
    return {
        status: response.status,
        code: body?.code,
        message: body?.message ?? body?.error ?? `API respondeu com status ${response.status}`,
        requestId: body?.requestId,
        body
    };
};
export const getNetworkErrorMessage = (error) => {
    if (error instanceof DOMException && error.name === "AbortError") {
        return "Servidor demorou a responder. Tente novamente.";
    }
    if (error instanceof TypeError) {
        return "Servidor indisponível. Tente novamente.";
    }
    return "Falha de conexão. Tente novamente.";
};
