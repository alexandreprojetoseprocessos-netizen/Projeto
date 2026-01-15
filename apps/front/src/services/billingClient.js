import { apiFetch } from "../config/api";
export class ApiRequestError extends Error {
    constructor(message, status, body) {
        super(message);
        this.name = "ApiRequestError";
        this.status = status;
        this.body = body;
    }
}
const parseResponseBody = async (response) => {
    const rawText = await response.text();
    if (!rawText)
        return {};
    try {
        return JSON.parse(rawText);
    }
    catch {
        return { message: rawText };
    }
};
const handleApiResponse = async (response, fallbackMessage) => {
    const body = await parseResponseBody(response);
    if (!response.ok) {
        const message = body?.message ?? fallbackMessage;
        throw new ApiRequestError(message, response.status, body);
    }
    return body;
};
const authHeaders = (token) => ({
    Authorization: `Bearer ${token}`
});
export const createPixPayment = async (token, payload) => {
    const response = await apiFetch("/payments/pix", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(token)
        },
        body: JSON.stringify(payload),
        retry: 0
    });
    return handleApiResponse(response, "Falha ao criar pagamento Pix.");
};
export const createCardPayment = async (token, payload) => {
    const response = await apiFetch("/payments/card", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(token)
        },
        body: JSON.stringify(payload),
        retry: 0
    });
    return handleApiResponse(response, "Falha ao criar pagamento com cartao.");
};
export const fetchIdentificationTypes = async (token) => {
    const response = await apiFetch("/payments/identification_types", {
        method: "GET",
        headers: authHeaders(token),
        retry: 0
    });
    return handleApiResponse(response, "Falha ao carregar documentos.");
};
export const fetchPaymentMethods = async (token, bin) => {
    const params = new URLSearchParams({ bin });
    const response = await apiFetch(`/payments/payment_methods?${params.toString()}`, {
        method: "GET",
        headers: authHeaders(token),
        retry: 0
    });
    return handleApiResponse(response, "Falha ao consultar bandeira.");
};
export const fetchIssuers = async (token, params) => {
    const query = new URLSearchParams({
        payment_method_id: params.paymentMethodId,
        bin: params.bin
    });
    const response = await apiFetch(`/payments/issuers?${query.toString()}`, {
        method: "GET",
        headers: authHeaders(token),
        retry: 0
    });
    return handleApiResponse(response, "Falha ao carregar emissores.");
};
export const fetchInstallments = async (token, params) => {
    const query = new URLSearchParams({
        amount: params.amount.toFixed(2),
        bin: params.bin,
        payment_method_id: params.paymentMethodId
    });
    const response = await apiFetch(`/payments/installments?${query.toString()}`, {
        method: "GET",
        headers: authHeaders(token),
        retry: 0
    });
    return handleApiResponse(response, "Falha ao calcular parcelas.");
};
