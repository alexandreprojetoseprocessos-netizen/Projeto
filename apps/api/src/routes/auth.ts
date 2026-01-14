import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@gestao/database";
import { supabaseAdmin } from "../lib/supabase";
import { logger } from "../config/logger";
import { config } from "../config/env";
import { InviteStatus, MembershipRole, OrganizationStatus, Prisma } from "@prisma/client";

const registerSchema = z.object({
  fullName: z.string().min(3),
  corporateEmail: z.string().email(),
  personalEmail: z.string().email(),
  documentType: z.enum(["CPF", "CNPJ"]),
  documentNumber: z.string().min(1),
  password: z.string().min(1),
  startMode: z.enum(["NEW_ORG", "INVITE"]).optional(),
  mode: z.enum(["NEW_ORG", "INVITE"]).optional(),
  inviteToken: z.string().optional(),
  organizationName: z.string().min(2).optional()
});

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const onlyDigits = (value: string) => value.replace(/\D/g, "");

const isRepeatedDigits = (value: string) => /^(\d)\1+$/.test(value);

const validateCpf = (raw: string) => {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11 || isRepeatedDigits(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(cpf[i]) * (10 - i);
  }
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(cpf[i]) * (11 - i);
  }
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return check === Number(cpf[10]);
};

const validateCnpj = (raw: string) => {
  const cnpj = onlyDigits(raw);
  if (cnpj.length !== 14 || isRepeatedDigits(cnpj)) return false;
  const calcCheck = (length: number) => {
    let sum = 0;
    let pos = length - 7;
    for (let i = length; i >= 1; i -= 1) {
      sum += Number(cnpj[length - i]) * pos;
      pos -= 1;
      if (pos < 2) pos = 9;
    }
    const result = sum % 11;
    return result < 2 ? 0 : 11 - result;
  };
  const check1 = calcCheck(12);
  const check2 = calcCheck(13);
  return check1 === Number(cnpj[12]) && check2 === Number(cnpj[13]);
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40) || "org";

const ensureUniqueSlug = async (client: Prisma.TransactionClient, baseSlug: string) => {
  let suffix = 0;
  let candidate = baseSlug;
  let exists = await client.organization.findUnique({ where: { slug: candidate } });

  while (exists) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
    exists = await client.organization.findUnique({ where: { slug: candidate } });
  }
  return candidate;
};

const resolveOrganizationName = (fullName: string, corporateEmail: string) => {
  const domainPart = corporateEmail.split("@")[1] ?? "";
  const base = domainPart.split(".")[0] ?? "";
  const cleaned = base.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  if (cleaned) {
    return `Organização ${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
  }

  const firstName = fullName.trim().split(/\s+/)[0];
  if (firstName) {
    return `Organização ${firstName}`;
  }

  return "Minha organização";
};

const resolveOrganizationDomain = (corporateEmail: string) => {
  const domain = corporateEmail.split("@")[1]?.trim().toLowerCase();
  return domain || null;
};

const resolveSupabaseCreateError = (error: { message?: string } | null) => {
  const message = error?.message ?? "Falha ao criar usu\u00e1rio.";
  const normalized = message.toLowerCase();

  if (normalized.includes("password") || normalized.includes("senha") || normalized.includes("weak")) {
    return {
      code: "WEAK_PASSWORD",
      message: "Senha fraca. Use no m\u00ednimo 8 caracteres, com letras e n\u00fameros."
    };
  }

  if (
    normalized.includes("already") ||
    normalized.includes("exist") ||
    normalized.includes("registered") ||
    normalized.includes("duplicate")
  ) {
    return {
      code: "EMAIL_ALREADY_USED",
      message: "E-mail j\u00e1 cadastrado."
    };
  }

  return {
    code: "INTERNAL",
    message: "Erro ao criar conta. Tente novamente em instantes."
  };
};

export const authRouter = Router();

const registerHandler = async (req, res) => {
  const requestId = randomUUID();
  logger.info({ requestId, step: "signup:start" }, "Signup started");

  try {
    if (!config.supabase.url || !config.supabase.serviceRoleKey || !supabaseAdmin) {
      logger.error({ requestId, step: "signup:config" }, "Supabase admin is not configured");
      return res.status(500).json({
        code: "MISSING_SUPABASE_ADMIN",
        message: "Supabase admin n\u00e3o configurado.",
        requestId
      });
    }

    const parsed = registerSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      logger.warn({ requestId, step: "signup:validate", errors: parsed.error.flatten().fieldErrors }, "Signup payload invalid");
      return res.status(400).json({
        code: "INVALID_PAYLOAD",
        message: "Dados de cadastro inv\u00e1lidos.",
        details: parsed.error.flatten().fieldErrors,
        requestId
      });
    }

    const payload = parsed.data;
    const startMode = payload.startMode ?? payload.mode;
    const organizationNameInput = typeof payload.organizationName === "string"
      ? payload.organizationName.trim()
      : "";
    const fullName = payload.fullName.trim();
    const corporateEmail = normalizeEmail(payload.corporateEmail);
    const personalEmail = normalizeEmail(payload.personalEmail);
    const documentNumber = onlyDigits(payload.documentNumber);

    logger.info({
      requestId,
      step: "signup:payload",
      payload: {
        fullName,
        corporateEmail,
        personalEmail,
        documentType: payload.documentType,
        documentLast4: documentNumber ? documentNumber.slice(-4) : null,
        startMode,
        organizationName: organizationNameInput || null,
        inviteTokenProvided: Boolean(payload.inviteToken)
      }
    }, "Signup payload sanitized");

    if (!startMode) {
    return res.status(400).json({
      code: "INVALID_PAYLOAD",
      message: "Dados de cadastro inv\u00e1lidos.",
      details: { startMode: ["Campo obrigat?rio."] },
      requestId
    });
  }

  const passwordHasLetter = /[A-Za-z]/.test(payload.password);
    const passwordHasNumber = /\d/.test(payload.password);
    if (payload.password.length < 8 || !passwordHasLetter || !passwordHasNumber) {
      return res.status(400).json({
        code: "WEAK_PASSWORD",
        message: "Senha fraca. Use no m\u00ednimo 8 caracteres, com letras e n\u00fameros.",
        requestId
      });
    }

    if (startMode === "NEW_ORG" && !organizationNameInput) {
    return res.status(400).json({
      code: "INVALID_PAYLOAD",
      message: "Dados de cadastro inv\u00e1lidos.",
      details: { organizationName: ["Campo obrigat?rio."] },
      requestId
    });
  }

  if (corporateEmail === personalEmail) {
      return res.status(400).json({
        code: "EMAILS_MUST_DIFFER",
        message: "Os e-mails corporativo e pessoal precisam ser diferentes.",
        requestId
      });
    }

    const documentOk =
      payload.documentType === "CPF" ? validateCpf(documentNumber) : validateCnpj(documentNumber);
    if (!documentOk) {
      return res.status(400).json({
        code: "INVALID_DOCUMENT",
        message: "CPF ou CNPJ inv\u00e1lido.",
        requestId
      });
    }

    if (startMode === "INVITE" && !payload.inviteToken) {
      return res.status(400).json({
        code: "INVITE_INVALID",
        message: "Informe o c\u00f3digo do convite para continuar.",
        requestId
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: corporateEmail },
          { corporateEmail },
          { personalEmail }
        ]
      }
    });
    if (existingUser) {
      return res.status(409).json({
        code: "EMAIL_ALREADY_USED",
        message: "E-mail j\u00e1 cadastrado.",
        requestId
      });
    }

    let inviteRecord: { id: string; organizationId: string; role: MembershipRole; email: string } | null = null;
    if (startMode === "INVITE") {
      logger.info({ requestId, step: "invite:validate:start" }, "Validating invite");
      const invite = await prisma.invite.findUnique({
        where: { token: payload.inviteToken },
        select: { id: true, organizationId: true, role: true, email: true, status: true, expiresAt: true }
      });

      if (!invite || invite.status !== InviteStatus.PENDING || invite.expiresAt < new Date()) {
        if (invite && invite.status === InviteStatus.PENDING && invite.expiresAt < new Date()) {
          await prisma.invite.update({
            where: { id: invite.id },
            data: { status: InviteStatus.EXPIRED }
          });
        }
        logger.warn({ requestId, step: "invite:validate:end", result: "invalid" }, "Invite invalid or expired");
        return res.status(400).json({
          code: "INVITE_INVALID",
          message: "Convite inv\u00e1lido ou expirado.",
          requestId
        });
      }

      const inviteEmail = normalizeEmail(invite.email);
      if (inviteEmail !== corporateEmail && inviteEmail !== personalEmail) {
        logger.warn({ requestId, step: "invite:validate:end", result: "email_mismatch" }, "Invite email mismatch");
        return res.status(400).json({
          code: "INVITE_INVALID",
          message: "O e-mail do convite n\u00e3o corresponde ao cadastro informado.",
          requestId
        });
      }

      inviteRecord = {
        id: invite.id,
        organizationId: invite.organizationId,
        role: invite.role,
        email: invite.email
      };
      logger.info({ requestId, step: "invite:validate:end", inviteId: invite.id }, "Invite validated");
    }

    logger.info({ requestId, step: "supabase.admin.createUser:start" }, "Creating Supabase user");
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: corporateEmail,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (createError || !created.user) {
      const resolved = resolveSupabaseCreateError(createError);
      logger.error({ err: createError, requestId, step: "supabase.admin.createUser:end" }, "Supabase create user failed");
      const status = resolved.code === "EMAIL_ALREADY_USED" ? 409 : resolved.code === "WEAK_PASSWORD" ? 400 : 500;
      return res.status(status).json({ code: resolved.code, message: resolved.message, requestId });
    }

    const supabaseUserId = created.user.id;
    logger.info({ requestId, step: "supabase.admin.createUser:end", userId: supabaseUserId }, "Supabase user created");

    try {
      await prisma.$transaction(async (tx) => {
        logger.info({ requestId, step: "prisma.user.upsert:start", userId: supabaseUserId }, "Upserting user");
        await tx.user.upsert({
          where: { id: supabaseUserId },
          update: {
            email: corporateEmail,
            corporateEmail,
            personalEmail,
            documentType: payload.documentType,
            documentNumber,
            fullName
          },
          create: {
            id: supabaseUserId,
            email: corporateEmail,
            corporateEmail,
            personalEmail,
            documentType: payload.documentType,
            documentNumber,
            fullName,
            passwordHash: "supabase-auth",
            locale: "pt-BR",
            timezone: "America/Sao_Paulo"
          }
        });
        logger.info({ requestId, step: "prisma.user.upsert:end", userId: supabaseUserId }, "User upserted");

        if (inviteRecord) {
          logger.info({ requestId, step: "prisma.organizationMembership.create:start", organizationId: inviteRecord.organizationId }, "Creating membership from invite");
          await tx.organizationMembership.upsert({
            where: {
              organizationId_userId: {
                organizationId: inviteRecord.organizationId,
                userId: supabaseUserId
              }
            },
            update: {
              role: inviteRecord.role
            },
            create: {
              organizationId: inviteRecord.organizationId,
              userId: supabaseUserId,
              role: inviteRecord.role
            }
          });
          logger.info({ requestId, step: "prisma.organizationMembership.create:end", organizationId: inviteRecord.organizationId }, "Membership created from invite");

          logger.info({ requestId, step: "invite:accept:start", inviteId: inviteRecord.id }, "Accepting invite");
          await tx.invite.update({
            where: { id: inviteRecord.id },
            data: {
              status: InviteStatus.ACCEPTED,
              acceptedAt: new Date(),
              acceptedById: supabaseUserId
            }
          });
          logger.info({ requestId, step: "invite:accept:end", inviteId: inviteRecord.id }, "Invite accepted");
        }

        if (startMode === "NEW_ORG") {
          const organizationName = organizationNameInput || resolveOrganizationName(fullName, corporateEmail);
          const organizationDomain = resolveOrganizationDomain(corporateEmail);
          const slug = await ensureUniqueSlug(tx, slugify(organizationName));

          logger.info({ requestId, step: "prisma.organization.create:start", slug }, "Creating organization");
          await tx.organization.create({
            data: {
              name: organizationName,
              slug,
              domain: organizationDomain,
              status: OrganizationStatus.ACTIVE,
              isActive: true,
              memberships: {
                create: {
                  userId: supabaseUserId,
                  role: MembershipRole.OWNER
                }
              }
            }
          });
          logger.info({ requestId, step: "prisma.organization.create:end", slug }, "Organization created");
        }
      });
    } catch (dbError) {
      logger.error({ err: dbError, requestId, step: "prisma:transaction" }, "Signup transaction failed");
      try {
        logger.warn({ requestId, step: "supabase.admin.deleteUser:start", userId: supabaseUserId }, "Rolling back Supabase user");
        await supabaseAdmin.auth.admin.deleteUser(supabaseUserId);
        logger.warn({ requestId, step: "supabase.admin.deleteUser:end", userId: supabaseUserId }, "Supabase user rolled back");
      } catch (cleanupError) {
        logger.warn({ err: cleanupError, requestId, step: "supabase.admin.deleteUser:error" }, "Failed to rollback Supabase user");
      }
      throw dbError;
    }

    logger.info({ requestId, step: "supabase.session:start" }, "Creating signup session");
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: corporateEmail,
      password: payload.password
    });

    if (sessionError || !sessionData.session) {
      logger.warn({ requestId, step: "supabase.session:end", err: sessionError }, "Signup session not created");
      return res.status(201).json({
        user: { id: supabaseUserId, email: corporateEmail, fullName },
        session: null,
        requestId
      });
    }

    logger.info({ requestId, step: "supabase.session:end" }, "Signup session created");
    logger.info({ requestId, step: "signup:complete" }, "Signup completed");
    return res.status(201).json({
      user: { id: supabaseUserId, email: corporateEmail, fullName },
      session: sessionData.session,
      invite: inviteRecord
        ? {
            organizationId: inviteRecord.organizationId
          }
        : null,
      requestId
    });
  } catch (error) {
    logger.error({ err: error, requestId, step: "signup:error" }, "Failed to register user");
    return res.status(500).json({
      code: "INTERNAL",
      message: "Erro ao criar conta. Tente novamente em instantes.",
      requestId
    });
  }
};

authRouter.post("/register", registerHandler);
authRouter.post("/signup", registerHandler);

authRouter.post("/login", (_req, res) => {
  const requestId = randomUUID();
  return res.status(501).json({
    code: "LOGIN_NOT_IMPLEMENTED",
    message: "Login is handled by Supabase on the client.",
    requestId
  });
});

authRouter.get("/login", (_req, res) => {
  const requestId = randomUUID();
  return res.status(501).json({
    code: "LOGIN_NOT_IMPLEMENTED",
    message: "Login is handled by Supabase on the client.",
    requestId
  });
});

