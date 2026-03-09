import nodemailer, { type Transporter } from "nodemailer";
import { MembershipRole } from "@prisma/client";
import { prisma } from "@gestao/database";
import { config } from "../config/env";
import { logger } from "../config/logger";
import { getEmailAlertsConnection } from "./integrationConnections";

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let smtpTransport: Transporter | null = null;

const normalizeEmails = (items: string[]) =>
  [...new Set(items.map((item) => item.trim().toLowerCase()).filter((item) => EMAIL_REGEX.test(item)))];

const resolveOrganizationOwnerAdminRecipients = async (organizationId: string) => {
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

const resolveOrganizationAlertRecipients = async ({
  organizationId,
  preferredRecipients
}: {
  organizationId: string;
  preferredRecipients?: string[];
}) => {
  const preferred = normalizeEmails(preferredRecipients ?? []);
  if (preferred.length) {
    return {
      recipients: preferred,
      source: "ORG_CONNECTION" as const
    };
  }

  const overrideRecipients = normalizeEmails(config.notifications.smtp.alertRecipients);
  if (overrideRecipients.length) {
    return {
      recipients: overrideRecipients,
      source: "ENV_OVERRIDE" as const
    };
  }

  return {
    recipients: await resolveOrganizationOwnerAdminRecipients(organizationId),
    source: "ORG_ADMINS" as const
  };
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

export const isSmtpConfigured = () => Boolean(config.notifications.smtp.host && config.notifications.smtp.from);

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

const sendEmail = async ({
  organizationId,
  subject,
  text,
  recipients
}: {
  organizationId: string;
  subject: string;
  text: string;
  recipients: string[];
}): Promise<SendEmailResult> => {
  if (!recipients.length) {
    return { delivered: false, recipients: [], skippedReason: "no_recipients" };
  }

  const transport = getSmtpTransport();
  const from = config.notifications.smtp.from;
  if (!transport || !from) {
    logger.warn(
      {
        organizationId
      },
      "SMTP not configured. Skipping critical webhook email alert."
    );
    return { delivered: false, recipients, skippedReason: "smtp_not_configured" };
  }

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
        organizationId
      },
      "Failed to send email notification"
    );
    return { delivered: false, recipients, skippedReason: "smtp_send_failed" };
  }
};

export const sendCriticalWebhookAlertEmail = async (
  payload: CriticalWebhookAlertEmailPayload
): Promise<SendEmailResult> => {
  if (!config.notifications.smtp.criticalAlertsEnabled) {
    return { delivered: false, recipients: [], skippedReason: "SMTP_CRITICAL_ALERTS_ENABLED=false" };
  }

  const emailConnection = await getEmailAlertsConnection(payload.organizationId);
  if (emailConnection && !emailConnection.isActive) {
    return { delivered: false, recipients: [], skippedReason: "org_disabled" };
  }

  const recipientResolution = await resolveOrganizationAlertRecipients({
    organizationId: payload.organizationId,
    preferredRecipients: emailConnection?.emailConfig.recipients ?? []
  });
  const subject = `[Meu G&P] Webhook crítico: ${payload.webhookName}`;
  const text = formatCriticalWebhookAlertEmailText(payload);

  const result = await sendEmail({
    organizationId: payload.organizationId,
    recipients: recipientResolution.recipients,
    subject,
    text
  });

  return {
    ...result,
    skippedReason: result.skippedReason ?? `source:${recipientResolution.source}`
  };
};

export const sendEmailAlertsTest = async ({
  organizationId,
  organizationName,
  requestedRecipients
}: {
  organizationId: string;
  organizationName?: string | null;
  requestedRecipients?: string[];
}): Promise<SendEmailResult> => {
  const recipientList = normalizeEmails(requestedRecipients ?? []);
  const recipientResolution =
    recipientList.length > 0
      ? { recipients: recipientList, source: "MANUAL_TEST" as const }
      : await resolveOrganizationAlertRecipients({ organizationId });

  const subject = `[Meu G&P] Teste de alerta por e-mail`;
  const text = [
    "Este é um teste de envio de alerta por e-mail do Meu G&P.",
    "",
    `Organização: ${organizationName ?? organizationId}`,
    `Data: ${new Date().toISOString()}`,
    "",
    "Se você recebeu esta mensagem, o canal de e-mail está configurado."
  ].join("\n");

  const result = await sendEmail({
    organizationId,
    recipients: recipientResolution.recipients,
    subject,
    text
  });

  return {
    ...result,
    skippedReason: result.skippedReason ?? `source:${recipientResolution.source}`
  };
};
