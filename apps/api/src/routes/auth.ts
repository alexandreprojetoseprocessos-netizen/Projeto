import { Router } from "express";
import { z } from "zod";
import { prisma } from "@gestao/database";
import { supabaseAdmin } from "../lib/supabase";
import { logger } from "../config/logger";
import { InviteStatus, MembershipRole } from "@prisma/client";

const registerSchema = z.object({
  fullName: z.string().min(3),
  corporateEmail: z.string().email(),
  personalEmail: z.string().email(),
  documentType: z.enum(["CPF", "CNPJ"]),
  documentNumber: z.string().min(1),
  password: z.string().min(6),
  startMode: z.enum(["NEW_ORG", "INVITE"]),
  inviteToken: z.string().optional()
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

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ code: "SUPABASE_NOT_CONFIGURED", message: "Supabase não configurado." });
  }

  const parsed = registerSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      code: "INVALID_PAYLOAD",
      message: "Dados de cadastro inválidos.",
      details: parsed.error.flatten().fieldErrors
    });
  }

  const payload = parsed.data;
  const fullName = payload.fullName.trim();
  const corporateEmail = normalizeEmail(payload.corporateEmail);
  const personalEmail = normalizeEmail(payload.personalEmail);
  const documentNumber = onlyDigits(payload.documentNumber);

  if (corporateEmail === personalEmail) {
    return res.status(400).json({
      code: "EMAILS_MUST_DIFFER",
      message: "Os e-mails corporativo e pessoal precisam ser diferentes."
    });
  }

  const documentOk =
    payload.documentType === "CPF" ? validateCpf(documentNumber) : validateCnpj(documentNumber);
  if (!documentOk) {
    return res.status(400).json({
      code: "INVALID_DOCUMENT",
      message: "CPF ou CNPJ inválido."
    });
  }

  if (payload.startMode === "INVITE" && !payload.inviteToken) {
    return res.status(400).json({
      code: "INVITE_REQUIRED",
      message: "Informe o código do convite para continuar."
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
      message: "E-mail já cadastrado."
    });
  }

  let inviteRecord: { id: string; organizationId: string; role: MembershipRole; email: string } | null = null;
  if (payload.startMode === "INVITE") {
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
      return res.status(400).json({
        code: "INVITE_INVALID",
        message: "Convite inválido ou expirado."
      });
    }

    const inviteEmail = normalizeEmail(invite.email);
    if (inviteEmail !== corporateEmail && inviteEmail !== personalEmail) {
      return res.status(400).json({
        code: "INVITE_EMAIL_MISMATCH",
        message: "O e-mail do convite não corresponde ao cadastro informado."
      });
    }

    inviteRecord = {
      id: invite.id,
      organizationId: invite.organizationId,
      role: invite.role,
      email: invite.email
    };
  }

  try {
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: corporateEmail,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (createError || !created.user) {
      const message = createError?.message ?? "Falha ao criar usuário.";
      logger.error({ err: createError }, "Supabase create user failed");
      return res.status(400).json({ code: "SUPABASE_ERROR", message });
    }

    const supabaseUserId = created.user.id;

    await prisma.user.upsert({
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

    if (inviteRecord) {
      await prisma.organizationMembership.upsert({
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

      await prisma.invite.update({
        where: { id: inviteRecord.id },
        data: {
          status: InviteStatus.ACCEPTED,
          acceptedAt: new Date(),
          acceptedById: supabaseUserId
        }
      });
    }

    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: corporateEmail,
      password: payload.password
    });

    if (sessionError || !sessionData.session) {
      return res.status(201).json({
        user: { id: supabaseUserId, email: corporateEmail, fullName },
        session: null
      });
    }

    return res.status(201).json({
      user: { id: supabaseUserId, email: corporateEmail, fullName },
      session: sessionData.session,
      invite: inviteRecord
        ? {
            organizationId: inviteRecord.organizationId
          }
        : null
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to register user");
    return res.status(500).json({ code: "REGISTER_FAILED", message: "Falha ao criar cadastro." });
  }
});
