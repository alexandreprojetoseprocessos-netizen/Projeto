import axios, { type AxiosError } from "axios";
import { config } from "../config/env";
import { logger } from "../config/logger";

export type MercadoPagoEnv = "sandbox" | "production";

export const MP_BASE_URL = "https://api.mercadopago.com";

const MP_TIMEOUT_MS = 10000;

const resolveMercadoPagoEnv = (): MercadoPagoEnv => {
  const normalized = (config.mercadoPago.env ?? "").toLowerCase();
  if (normalized === "production" || normalized === "prod") return "production";
  if (normalized === "sandbox") return "sandbox";
  return config.env === "production" ? "production" : "sandbox";
};

const maskToken = (token?: string | null) => {
  if (!token) return "***";
  return `***${token.slice(-6)}`;
};

const warnIfTokenMismatch = (env: MercadoPagoEnv, token: string, requestId: string) => {
  const isTestToken = token.startsWith("TEST-");
  const isProdToken = token.startsWith("APP_USR-");
  if (env === "production" && isTestToken) {
    logger.warn({ requestId, mp: { env, token: maskToken(token) } }, "Mercado Pago token looks like sandbox");
  }
  if (env === "sandbox" && isProdToken) {
    logger.warn({ requestId, mp: { env, token: maskToken(token) } }, "Mercado Pago token looks like production");
  }
};

export class MercadoPagoClientError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(message: string, options?: { status?: number; code?: string; details?: Record<string, unknown> }) {
    super(message);
    this.name = "MercadoPagoClientError";
    this.status = options?.status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

type MercadoPagoRequestParams = {
  requestId: string;
  method: "GET" | "POST";
  path: string;
  params?: Record<string, unknown>;
  data?: Record<string, unknown>;
  idempotencyKey?: string;
};

export const mercadopagoRequest = async <T>({
  requestId,
  method,
  path,
  params,
  data,
  idempotencyKey
}: MercadoPagoRequestParams): Promise<T> => {
  const accessToken = config.mercadoPago.accessToken;
  if (!accessToken) {
    throw new MercadoPagoClientError("Mercado Pago nao configurado.", {
      status: 500,
      code: "MP_NOT_CONFIGURED"
    });
  }

  const env = resolveMercadoPagoEnv();
  warnIfTokenMismatch(env, accessToken, requestId);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`
  };
  if (typeof idempotencyKey === "string" && idempotencyKey.trim()) {
    headers["X-Idempotency-Key"] = idempotencyKey.trim();
  }

  try {
    const response = await axios.request<T>({
      baseURL: MP_BASE_URL,
      url: path,
      method,
      params,
      data,
      timeout: MP_TIMEOUT_MS,
      headers
    });

    logger.info(
      {
        requestId,
        mp: {
          env,
          method,
          path,
          status: response.status,
          token: maskToken(accessToken)
        }
      },
      "Mercado Pago request ok"
    );

    return response.data;
  } catch (error) {
    const env = resolveMercadoPagoEnv();
    const tokenHint = maskToken(accessToken);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const status = axiosError.response?.status;
      const responseData = axiosError.response?.data;
      const message =
        (typeof responseData?.message === "string" && responseData.message) ||
        (typeof responseData?.error === "string" && responseData.error) ||
        axiosError.message ||
        "Falha ao comunicar com Mercado Pago.";
      const code =
        (typeof responseData?.error === "string" && responseData.error) ||
        (typeof responseData?.code === "string" && responseData.code) ||
        undefined;

      logger.error(
        {
          requestId,
          mp: {
            env,
            method,
            path,
            status,
            token: tokenHint,
            code
          }
        },
        "Mercado Pago request failed"
      );

      throw new MercadoPagoClientError(message, {
        status,
        code,
        details: {
          status
        }
      });
    }

    logger.error(
      {
        requestId,
        mp: {
          env,
          method,
          path,
          token: tokenHint
        },
        err: error
      },
      "Mercado Pago request failed"
    );

    throw new MercadoPagoClientError("Falha ao comunicar com Mercado Pago.", {
      status: 502,
      code: "MP_REQUEST_FAILED"
    });
  }
};

export const mercadopagoGet = async <T>(
  requestId: string,
  path: string,
  params?: Record<string, unknown>
) => {
  return mercadopagoRequest<T>({
    requestId,
    method: "GET",
    path,
    params
  });
};

export const mercadopagoPost = async <T>(
  requestId: string,
  path: string,
  data?: Record<string, unknown>,
  options?: { idempotencyKey?: string }
) => {
  return mercadopagoRequest<T>({
    requestId,
    method: "POST",
    path,
    data,
    idempotencyKey: options?.idempotencyKey
  });
};
