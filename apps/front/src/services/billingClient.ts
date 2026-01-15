import { apiFetch } from "../config/api";

export type PixPaymentPayload = {
  amount: number;
  description: string;
  payerEmail: string;
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
  amount: number;
  description: string;
  payerEmail: string;
  cardToken: string;
  paymentMethodId: string;
  installments: number;
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

const handleApiResponse = async <T>(response: Response, fallbackMessage: string): Promise<T> => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (body as any)?.message ?? fallbackMessage;
    throw new Error(message);
  }
  return body as T;
};

export const createPixPayment = async (token: string, payload: PixPaymentPayload) => {
  const response = await apiFetch("/payments/pix", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
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
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload),
    retry: 0
  });
  return handleApiResponse<CardPaymentResponse>(response, "Falha ao criar pagamento com cartao.");
};
