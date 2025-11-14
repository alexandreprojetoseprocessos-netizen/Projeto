import { Router } from "express";
import { sendSlackMessage, verifyGithubSignature } from "../services/integrations";
import { logger } from "../config/logger";

export const integrationsRouter = Router();

integrationsRouter.post("/slack/test", async (_req, res) => {
  try {
    await sendSlackMessage({ text: ":white_check_mark: Slack integration test OK." });
    return res.json({ message: "Notification sent (if webhook configured)." });
  } catch (error) {
    logger.error({ err: error }, "Failed to send Slack test");
    return res.status(500).json({ message: "Failed to send Slack notification" });
  }
});

integrationsRouter.post("/github/webhook", async (req, res) => {
  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  const rawBody = (req as any).rawBody ?? JSON.stringify(req.body ?? {});

  if (!verifyGithubSignature(rawBody, signature)) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  logger.info({ event: req.headers["x-github-event"], body: req.body }, "GitHub webhook received");
  return res.json({ ok: true });
});

integrationsRouter.post("/webhooks/:event", (req, res) => {
  const { event } = req.params;
  logger.info({ event, payload: req.body }, "Inbound webhook");
  res.status(202).json({ status: "queued" });
});
