import { apiFetch } from "../config/api";
const handleApiResponse = async (response, fallbackMessage) => {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = body?.message ?? fallbackMessage;
        throw new Error(message);
    }
    return body;
};
export const createPixPayment = async (token, payload) => {
    const response = await apiFetch("/payments/pix", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
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
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        retry: 0
    });
    return handleApiResponse(response, "Falha ao criar pagamento com cartao.");
};
