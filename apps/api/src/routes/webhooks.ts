import { Router } from "express";
import axios from "axios";
import { config } from "../config/env";
import { logger } from "../config/logger";
import { MP_BASE_URL, syncSubscriptionFromPayment, verifyMercadoPagoSignature } from "../services/mercadopago";

export const webhooksRouter = Router();

webhooksRouter.post("/mercadopago", async (req, res) => {
  const accessToken = config.mercadoPago.accessToken;
  if (!accessToken) {
    return res.status(200).json({ received: true });
  }

  const body: any = req.body ?? {};
  const dataId =
    body?.data?.id ??
    (typeof req.query?.["data.id"] === "string" ? req.query?.["data.id"] : undefined) ??
    body?.id ??
    (typeof req.query?.id === "string" ? req.query?.id : undefined);

  const rawBody = (req as any).rawBody as string | undefined;
  const signatureOk = verifyMercadoPagoSignature({
    rawBody,
    headers: req.headers as Record<string, string | string[] | undefined>,
    dataId
  });

  if (!signatureOk) {
    logger.warn({ dataId }, "Mercado Pago webhook signature invalid");
    return res.status(401).json({ message: "Invalid signature" });
  }

  if (!dataId) {
    return res.status(200).json({ received: true });
  }

  logger.info(
    {
      dataId,
      eventType: body?.type ?? body?.action ?? null
    },
    "Mercado Pago webhook received"
  );

  try {
    const paymentResponse = await axios.get(`${MP_BASE_URL}/v1/payments/${dataId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const payment = paymentResponse.data as {
      id: number | string;
      status: string;
      external_reference?: string;
      payment_method_id?: string;
    };

    await syncSubscriptionFromPayment({
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      payment_method_id: payment.payment_method_id
    });

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error({ err: error, dataId }, "Failed to handle Mercado Pago webhook");
    return res.status(200).json({ received: true });
  }
});
