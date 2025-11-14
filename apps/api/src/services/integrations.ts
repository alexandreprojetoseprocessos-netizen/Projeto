import crypto from "node:crypto";
import https from "node:https";
import { config } from "../config/env";

export const sendSlackMessage = async (payload: { text: string }) => {
  const webhookUrl = config.integrations.slackWebhookUrl;
  if (!webhookUrl) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const url = new URL(webhookUrl);
    const req = https.request(
      {
        method: "POST",
        hostname: url.hostname,
        path: url.pathname + url.search,
        headers: { "Content-Type": "application/json" }
      },
      (res) => {
        res.on("data", () => {});
        res.on("end", () => resolve());
      }
    );
    req.on("error", reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
};

export const verifyGithubSignature = (body: string, signature: string | undefined) => {
  const secret = config.github.webhookSecret;
  if (!secret || !signature) {
    return false;
  }

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body, "utf8");
  const digest = `sha256=${hmac.digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
};
