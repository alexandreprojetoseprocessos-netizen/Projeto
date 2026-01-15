import { randomUUID } from "node:crypto";
import { Router } from "express";
import { config } from "../config/env";
import { logger } from "../config/logger";
import { syncSubscriptionFromPayment, verifyMercadoPagoSignature } from "../services/mercadopago";
import { MercadoPagoClientError, mercadopagoGet } from "../services/mercadopagoClient";

export const webhooksRouter = Router();

webhooksRouter.post("/mercadopago", async (req, res) => {
  const requestId = randomUUID();
  const accessToken = config.mercadoPago.accessToken;
  if (!accessToken) {
    logger.warn({ requestId }, "Mercado Pago access token not configured for webhook");
    return res.status(200).json({ received: true });
  }

  const body: any = req.body ?? {};
  const dataId =
    body?.data?.id ??
    (typeof req.query?.["data.id"] === "string" ? req.query?.["data.id"] : undefined) ??
    body?.id ??
    (typeof req.query?.id === "string" ? req.query?.id : undefined);

  const rawBody = (req as any).rawBody as string | undefined;
  const shouldVerify = Boolean(config.mercadoPago.webhookSecret);
  if (!shouldVerify) {
    logger.warn({ requestId }, "MP_WEBHOOK_SECRET missing; skipping signature validation");
  }
  const signatureOk = shouldVerify
    ? verifyMercadoPagoSignature({
        rawBody,
        headers: req.headers as Record<string, string | string[] | undefined>,
        dataId
      })
    : true;

  if (!signatureOk) {
    logger.warn({ requestId, dataId }, "Mercado Pago webhook signature invalid");
    return res.status(401).json({
      message: "Invalid signature",
      code: "INVALID_SIGNATURE",
      requestId
    });
  }

  if (!dataId) {
    return res.status(200).json({ received: true });
  }

  logger.info(
    {
      requestId,
      dataId,
      eventType: body?.type ?? body?.action ?? null
    },
    "Mercado Pago webhook received"
  );

  try {
    const payment = await mercadopagoGet<{
      id: number | string;
      status: string;
      external_reference?: string;
      payment_method_id?: string;
    }>(requestId, `/v1/payments/${dataId}`);

    await syncSubscriptionFromPayment({
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      payment_method_id: payment.payment_method_id
    });

    return res.status(200).json({ received: true });
  } catch (error) {
    if (error instanceof MercadoPagoClientError) {
      logger.error({ requestId, dataId, code: error.code, status: error.status }, "Failed to handle Mercado Pago webhook");
    } else {
      logger.error({ err: error, requestId, dataId }, "Failed to handle Mercado Pago webhook");
    }
    return res.status(200).json({ received: true });
  }
});
