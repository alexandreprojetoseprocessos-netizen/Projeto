import { Router } from "express";
import crypto from "node:crypto";
import { prisma } from "@gestao/database";
import { InviteStatus, MembershipRole } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { attachOrgMembership, requireCanManageOrgSettings } from "../middleware/organization";
import { getDefaultModulePermissions } from "../services/modulePermissions";

export const invitesRouter = Router();

invitesRouter.use(authMiddleware);

invitesRouter.post(
  "/organizations/:orgId/invites",
  attachOrgMembership,
  requireCanManageOrgSettings,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { email, role } = req.body ?? {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "E-mail do convite Ã© obrigatÃ³rio." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const inviteRole =
      typeof role === "string" && Object.values(MembershipRole).includes(role as MembershipRole)
        ? (role as MembershipRole)
        : MembershipRole.MEMBER;

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const organizationId = (req as any).organizationId as string;

    const invite = await prisma.invite.create({
      data: {
        organizationId,
        email: normalizedEmail,
        token,
        status: InviteStatus.PENDING,
        role: inviteRole,
        expiresAt,
        createdById: req.user.id
      }
    });

    return res.status(201).json({
      invite: {
        id: invite.id,
        token: invite.token,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt
      }
    });
  }
);

invitesRouter.post("/invites/accept", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { token } = req.body ?? {};
  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Token do convite Ã© obrigatÃ³rio." });
  }

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { organization: true }
  });

  if (!invite || invite.status !== InviteStatus.PENDING || invite.expiresAt < new Date()) {
    if (invite && invite.status === InviteStatus.PENDING && invite.expiresAt < new Date()) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.EXPIRED }
      });
    }
    return res.status(400).json({ message: "Convite invÃ¡lido ou expirado." });
  }

  await prisma.organizationMembership.upsert({
    where: {
      organizationId_userId: {
        organizationId: invite.organizationId,
        userId: req.user.id
      }
    },
    update: {
      role: invite.role,
      modulePermissions: getDefaultModulePermissions(invite.role)
    } as any,
    create: {
      organizationId: invite.organizationId,
      userId: req.user.id,
      role: invite.role,
      modulePermissions: getDefaultModulePermissions(invite.role)
    } as any
  });

  await prisma.invite.update({
    where: { id: invite.id },
    data: {
      status: InviteStatus.ACCEPTED,
      acceptedAt: new Date(),
      acceptedById: req.user.id
    }
  });

  return res.json({
    organization: {
      id: invite.organization.id,
      name: invite.organization.name
    }
  });
});

