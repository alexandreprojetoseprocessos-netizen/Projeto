type ClientErrorMetadata = Record<string, unknown>;

export type ClientErrorEntry = {
  id: string;
  timestamp: string;
  source: string;
  message: string;
  stack?: string | null;
  pathname?: string | null;
  metadata?: ClientErrorMetadata;
};

const CLIENT_ERROR_STORAGE_KEY = "gp:client-error-log";
const MAX_CLIENT_ERRORS = 20;

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message || "Erro sem mensagem",
      stack: error.stack ?? null
    };
  }

  if (typeof error === "string" && error.trim()) {
    return {
      message: error.trim(),
      stack: null
    };
  }

  try {
    return {
      message: JSON.stringify(error) || "Erro desconhecido",
      stack: null
    };
  } catch {
    return {
      message: "Erro desconhecido",
      stack: null
    };
  }
};

const buildErrorEntry = (source: string, error: unknown, metadata?: ClientErrorMetadata): ClientErrorEntry => {
  const serialized = serializeError(error);
  const pathname = typeof window !== "undefined" ? window.location.pathname : null;

  return {
    id: `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    source,
    message: serialized.message,
    stack: serialized.stack,
    pathname,
    metadata
  };
};

const persistClientError = (entry: ClientErrorEntry) => {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(CLIENT_ERROR_STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as ClientErrorEntry[]) : [];
    const next = [entry, ...existing].slice(0, MAX_CLIENT_ERRORS);
    window.localStorage.setItem(CLIENT_ERROR_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore local persistence failures in the browser.
  }
};

export const reportClientError = (source: string, error: unknown, metadata?: ClientErrorMetadata) => {
  const entry = buildErrorEntry(source, error, metadata);

  persistClientError(entry);
  console.error(`[client-error] ${source}`, entry);

  return entry;
};

export const getRecentClientErrors = () => {
  if (typeof window === "undefined") return [] as ClientErrorEntry[];

  try {
    const raw = window.localStorage.getItem(CLIENT_ERROR_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ClientErrorEntry[]) : [];
  } catch {
    return [] as ClientErrorEntry[];
  }
};
