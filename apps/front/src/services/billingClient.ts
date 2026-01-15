import { apiFetch } from "../config/api";

export class ApiRequestError extends Error {
  status: number;
  body: any;

  constructor(message: string, status: number, body: any) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.body = body;
  }
}

type JsonBody = Record<string, any>;

export type PixPaymentPayload = {
  transaction_amount: number;
  description: string;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  externalReference?: string;
  planCode?: string;
  billingCycle?: string;
};

export type PixPaymentResponse = {
  payment_id: string;
  status: string;
  qr_code: string;
  qr_code_base64: string;
  externalReference?: string | null;
};

export type CardPaymentPayload = {
  transaction_amount: number;
  description: string;
  token: string;
  payment_method_id: string;
  installments: number;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  issuer_id?: string | null;
  externalReference?: string;
  planCode?: string;
  billingCycle?: string;
};

export type CardPaymentResponse = {
  id: string;
  status: string;
  status_detail?: string | null;
};

export type IdentificationType = {
  id: string;
  name: string;
};

export type PaymentMethodSetting = {
  bin?: {
    pattern?: string;
    exclusion_pattern?: string;
  };
};

export type PaymentMethod = {
  id: string;
  name?: string;
  payment_type_id?: string;
  status?: string;
  settings?: PaymentMethodSetting[];
};

export type InstallmentsResponse = Array<{
  issuer?: {
    id?: number | string;
    name?: string;
  };
  payer_costs?: Array<{
    installments: number;
    recommended_message?: string;
  }>;
}>;

const parseResponseBody = async (response: Response): Promise<JsonBody> => {
  const rawText = await response.text();
  if (!rawText) return {};
  try {
    return JSON.parse(rawText) as JsonBody;
  } catch {
    return { message: rawText };
  }
};

const handleApiResponse = async <T>(response: Response, fallbackMessage: string): Promise<T> => {
  const body = await parseResponseBody(response);
  if (!response.ok) {
    const message = (body as any)?.message ?? fallbackMessage;
    throw new ApiRequestError(message, response.status, body);
  }
  return body as T;
};

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`
});

export const createPixPayment = async (token: string, payload: PixPaymentPayload) => {
  const response = await apiFetch("/payments/pix", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify(payload),
    retry: 0
  });
  return handleApiResponse<PixPaymentResponse>(response, "Falha ao criar pagamento Pix.");
};

export const createCardPayment = async (token: string, payload: CardPaymentPayload) => {
  const response = await apiFetch("/payments/card", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify(payload),
    retry: 0
  });
  return handleApiResponse<CardPaymentResponse>(response, "Falha ao criar pagamento com cartao.");
};

export const fetchIdentificationTypes = async (token: string) => {
  const response = await apiFetch("/payments/identification_types", {
    method: "GET",
    headers: authHeaders(token),
    retry: 0
  });
  return handleApiResponse<IdentificationType[]>(response, "Falha ao carregar documentos.");
};

export const fetchPaymentMethods = async (token: string) => {
  const response = await apiFetch("/payments/payment_methods", {
    method: "GET",
    headers: authHeaders(token),
    retry: 0
  });
  return handleApiResponse<PaymentMethod[]>(response, "Falha ao consultar metodos de pagamento.");
};

export const fetchInstallments = async (
  token: string,
  params: { amount: number; paymentMethodId: string; issuerId?: string | null }
) => {
  const query = new URLSearchParams({
    amount: params.amount.toFixed(2),
    payment_method_id: params.paymentMethodId
  });
  if (params.issuerId) {
    query.set("issuer_id", params.issuerId);
  }
  const response = await apiFetch(`/payments/installments?${query.toString()}`, {
    method: "GET",
    headers: authHeaders(token),
    retry: 0
  });
  return handleApiResponse<InstallmentsResponse>(response, "Falha ao calcular parcelas.");
};
