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
  if (!path) return normalizedBaseUrl;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
};

export type ApiError = {
  code?: string;
  message: string;
  requestId?: string;
  status: number;
  body?: unknown;
};

export type ApiFetchOptions = RequestInit & {
  timeoutMs?: number;
  retry?: number;
  silentHttpStatuses?: number[];
};

export type ApiRequestOptions = ApiFetchOptions;

export type ApiRequestError = Error & {
  status?: number;
  code?: string;
  requestId?: string;
  body?: unknown;
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
  const headers = new Headers(fetchOptions.headers ?? undefined);
  const hasBody = typeof fetchOptions.body !== "undefined" && fetchOptions.body !== null;
  const isFormData = typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;
  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Authorization")) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const requestOptions: RequestInit = { ...fetchOptions, headers };
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await fetchWithTimeout(apiUrl(path), requestOptions, timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt === retryCount) throw error;
    }
  }

  throw lastError;
};

export const apiRequest = async <TResponse = unknown>(path: string, options: ApiRequestOptions = {}): Promise<TResponse> => {
  const { silentHttpStatuses, ...requestOptions } = options;
  let response: Response;
  try {
    response = await apiFetch(path, requestOptions);
  } catch (error) {
    throw new Error(getNetworkErrorMessage(error));
  }

  if (!response.ok) {
    const apiError = await parseApiError(response, apiUrl(path), { silentHttpStatuses });
    const error = new Error(apiError.message) as Error & {
      status?: number;
      code?: string;
      requestId?: string;
      body?: unknown;
    };
    error.status = apiError.status;
    error.code = apiError.code;
    error.requestId = apiError.requestId;
    error.body = apiError.body;
    throw error;
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as TResponse;
  }

  return (await response.text()) as TResponse;
};

export const parseApiError = async (
  response: Response,
  url?: string,
  options?: { silentHttpStatuses?: number[] }
): Promise<ApiError> => {
  const rawText = await response.text();
  let body: unknown = {};
  if (rawText) {
    try {
      body = JSON.parse(rawText);
    } catch {
      body = { message: rawText };
    }
  }

  const silentStatuses = new Set(options?.silentHttpStatuses ?? []);
  if (!silentStatuses.has(response.status)) {
    console.warn("[api] request failed", {
      url: url ?? response.url,
      status: response.status,
      body: rawText
    });
  }

  const parsedBody = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const parsedMessage =
    typeof parsedBody.message === "string"
      ? parsedBody.message
      : typeof parsedBody.error === "string"
      ? parsedBody.error
      : undefined;
  const parsedCode = typeof parsedBody.code === "string" ? parsedBody.code : undefined;
  const parsedRequestId = typeof parsedBody.requestId === "string" ? parsedBody.requestId : undefined;

  return {
    status: response.status,
    code: parsedCode,
    message: parsedMessage ?? `API respondeu com status ${response.status}`,
    requestId: parsedRequestId,
    body: parsedBody
  };
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

const HTTP_STATUS_MESSAGES: Partial<Record<number, string>> = {
  400: "Dados inválidos. Revise os campos e tente novamente.",
  401: "Sua sessão expirou. Faça login novamente.",
  403: "Você não tem permissão para esta ação.",
  404: "Recurso não encontrado.",
  409: "Conflito de atualização. Recarregue a página e tente novamente.",
  422: "Dados inválidos. Revise os campos e tente novamente.",
  429: "Muitas tentativas. Aguarde e tente novamente.",
  500: "Erro interno no servidor. Tente novamente em instantes.",
  502: "Serviço temporariamente indisponível.",
  503: "Serviço temporariamente indisponível.",
  504: "Tempo de resposta do servidor excedido."
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

export const isApiRequestError = (error: unknown): error is ApiRequestError => {
  if (!(error instanceof Error)) return false;
  const record = error as unknown as Record<string, unknown>;
  return (
    typeof record.status === "number" ||
    typeof record.code === "string" ||
    typeof record.requestId === "string" ||
    typeof record.body !== "undefined"
  );
};

export const getApiErrorMessage = (error: unknown, fallbackMessage = "Não foi possível concluir a operação.") => {
  if (isApiRequestError(error)) {
    const status = typeof error.status === "number" ? error.status : undefined;
    const body = asRecord(error.body);
    const bodyMessage =
      typeof body?.message === "string"
        ? body.message
        : typeof body?.error === "string"
        ? body.error
        : undefined;
    const errorMessage = typeof error.message === "string" ? error.message.trim() : "";
    const defaultMessageForStatus = status ? HTTP_STATUS_MESSAGES[status] : undefined;
    const isGenericStatusMessage = /^API respondeu com status\s+\d+$/i.test(errorMessage);

    if (bodyMessage?.trim()) return bodyMessage.trim();
    if (errorMessage && !isGenericStatusMessage) return errorMessage;
    if (defaultMessageForStatus) return defaultMessageForStatus;
    return fallbackMessage;
  }

  if (error instanceof Error && error.message?.trim()) {
    return error.message.trim();
  }

  const networkMessage = getNetworkErrorMessage(error);
  return networkMessage || fallbackMessage;
};
