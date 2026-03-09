import nodemailer, { type Transporter } from "nodemailer";
import { MembershipRole } from "@prisma/client";
import { prisma } from "@gestao/database";
import { config } from "../config/env";
import { logger } from "../config/logger";

type CriticalWebhookAlertEmailPayload = {
  organizationId: string;
  organizationName?: string | null;
  webhookId: string;
  webhookName: string;
  attempts: number;
  failedCount: number;
  failedRate: number;
  windowHours: number;
};

type SendEmailResult = {
  delivered: boolean;
  recipients: string[];
  skippedReason?: string;
};

let smtpTransport: Transporter | null = null;

const resolveOrganizationAlertRecipients = async (organizationId: string) => {
  const overrideRecipients = config.notifications.smtp.alertRecipients;
  if (overrideRecipients.length) {
    return [...new Set(overrideRecipients)];
  }

  const memberships = await prisma.organizationMembership.findMany({
    where: {
      organizationId,
      role: {
        in: [MembershipRole.OWNER, MembershipRole.ADMIN]
      }
    },
    select: {
      user: {
        select: {
          active: true,
          email: true
        }
      }
    }
  });

  const emails = memberships
    .filter((membership) => membership.user.active)
    .map((membership) => membership.user.email.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(emails)];
};

const getSmtpTransport = () => {
  if (smtpTransport) return smtpTransport;

  const smtpConfig = config.notifications.smtp;
  if (!smtpConfig.host || !smtpConfig.from) return null;

  smtpTransport = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth:
      smtpConfig.user && smtpConfig.pass
        ? {
            user: smtpConfig.user,
            pass: smtpConfig.pass
          }
        : undefined
  });

  return smtpTransport;
};

const formatCriticalWebhookAlertEmailText = ({
  organizationName,
  webhookName,
  webhookId,
  attempts,
  failedCount,
  failedRate,
  windowHours
}: Omit<CriticalWebhookAlertEmailPayload, "organizationId">) => {
  const failedPercent = Math.round(failedRate * 100);
  return [
    "Meu G&P - Alerta crítico de webhook",
    "",
    `Organização: ${organizationName ?? "Organização"}`,
    `Webhook: ${webhookName}`,
    `ID: ${webhookId}`,
    `Janela: últimas ${windowHours}h`,
    `Falhas: ${failedCount}/${attempts} (${failedPercent}%)`,
    "",
    "Ação recomendada:",
    "- Validar URL de destino e credenciais",
    "- Testar endpoint no painel de integrações",
    "- Reenfileirar falhas após corrigir o destino"
  ].join("\n");
};

export const sendCriticalWebhookAlertEmail = async (
  payload: CriticalWebhookAlertEmailPayload
): Promise<SendEmailResult> => {
  if (!config.notifications.smtp.criticalAlertsEnabled) {
    return { delivered: false, recipients: [], skippedReason: "SMTP_CRITICAL_ALERTS_ENABLED=false" };
  }

  const recipients = await resolveOrganizationAlertRecipients(payload.organizationId);
  if (!recipients.length) {
    return { delivered: false, recipients: [], skippedReason: "no_recipients" };
  }

  const transport = getSmtpTransport();
  const from = config.notifications.smtp.from;
  if (!transport || !from) {
    logger.warn(
      {
        organizationId: payload.organizationId
      },
      "SMTP not configured. Skipping critical webhook email alert."
    );
    return { delivered: false, recipients, skippedReason: "smtp_not_configured" };
  }

  const subject = `[Meu G&P] Webhook crítico: ${payload.webhookName}`;
  const text = formatCriticalWebhookAlertEmailText(payload);

  try {
    await transport.sendMail({
      from,
      to: from,
      bcc: recipients.join(", "),
      subject,
      text
    });

    return { delivered: true, recipients };
  } catch (error) {
    logger.warn(
      {
        err: error,
        organizationId: payload.organizationId,
        webhookId: payload.webhookId
      },
      "Failed to send critical webhook alert email"
    );
    return { delivered: false, recipients, skippedReason: "smtp_send_failed" };
  }
};
