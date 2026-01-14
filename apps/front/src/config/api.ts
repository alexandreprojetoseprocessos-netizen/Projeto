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
  if (!path) return normalizedBaseUrl;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
};

export type ApiFetchOptions = RequestInit & {
  timeoutMs?: number;
  retry?: number;
};

const DEFAULT_TIMEOUT_MS = 15000;

const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number) => {
  if (!timeoutMs) return fetch(url, options);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const isRetryableMethod = (method?: string) => {
  const normalized = (method ?? "GET").toUpperCase();
  return normalized === "GET" || normalized === "HEAD";
};

export const apiFetch = async (path: string, options: ApiFetchOptions = {}) => {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retry, ...fetchOptions } = options;
  const retryCount = typeof retry === "number" ? retry : isRetryableMethod(fetchOptions.method) ? 1 : 0;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await fetchWithTimeout(apiUrl(path), fetchOptions, timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt === retryCount) throw error;
    }
  }

  throw lastError;
};

export const getNetworkErrorMessage = (error: unknown) => {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Servidor demorou a responder. Tente novamente.";
  }
  if (error instanceof TypeError) {
    return "Servidor indisponível. Tente novamente.";
  }
  return "Falha de conexão. Tente novamente.";
};
