import { DocumentType, MembershipRole } from "@prisma/client";
import { Router } from "express";
import { prisma } from "@gestao/database";
import { authMiddleware } from "../middleware/auth";
import { addMemberToOrganization, listMembersForOrganization } from "../services/organizationMembers";
import { canManageTeam } from "../services/permissions";
import { supabaseAdmin } from "../lib/supabase";
import { uploadAvatar } from "../services/storage";

const router = Router();

router.use(authMiddleware);

const getMembership = async (organizationId: string, userId: string) => {
  return prisma.organizationMembership.findFirst({
    where: { organizationId, userId }
  });
};

router.get("/:organizationId/members", async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Authentication required" });

  const { organizationId } = req.params;
  if (!organizationId) return res.status(400).json({ message: "organizationId is required" });

  const membership = await getMembership(organizationId, req.user.id);
  if (!membership) return res.status(403).json({ message: "Access denied" });

  const members = await listMembersForOrganization(organizationId);
  return res.json({ members });
});

router.post("/:organizationId/members", async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Authentication required" });

  const { organizationId } = req.params;
  const { email, role } = req.body ?? {};

  if (!organizationId) return res.status(400).json({ message: "organizationId is required" });
  if (!email || typeof email !== "string") {
    return res.status(400).json({ message: "Email é obrigatório" });
  }

  const normalizedRole =
    typeof role === "string" && (["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const).includes(role as any)
      ? (role as MembershipRole)
      : MembershipRole.MEMBER;

  const membership = await getMembership(organizationId, req.user.id);
  if (!membership) return res.status(403).json({ message: "Access denied" });
  if (!canManageTeam(membership.role as any)) {
    return res.status(403).json({ message: "Você não tem permissão para gerenciar a equipe." });
  }

  try {
    const created = await addMemberToOrganization(organizationId, email, normalizedRole, req.user);
    return res.status(201).json({ member: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível adicionar membro";
    return res.status(400).json({ message });
  }
});

router.patch("/:organizationId/members/:memberId", async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Authentication required" });

  const { organizationId, memberId } = req.params;
  if (!organizationId || !memberId) {
    return res.status(400).json({ message: "organizationId e memberId são obrigatórios" });
  }

  const requesterMembership = await getMembership(organizationId, req.user.id);
  if (!requesterMembership) return res.status(403).json({ message: "Access denied" });

  const targetMembership = await prisma.organizationMembership.findFirst({
    where: { id: memberId, organizationId },
    include: { user: true }
  });
  if (!targetMembership) {
    return res.status(404).json({ message: "Membro não encontrado" });
  }

  const isSelf = targetMembership.userId === req.user.id;
  const canEdit = isSelf || canManageTeam(requesterMembership.role as any);
  if (!canEdit) {
    return res.status(403).json({ message: "Você não tem permissão para editar este perfil." });
  }

  const {
    fullName,
    email,
    phone,
    address,
    cpf,
    jobTitle,
    status,
    avatarBase64,
    avatarFileName,
    avatarContentType
  } = req.body ?? {};

  let avatarUrl: string | undefined;
  if (avatarBase64 && avatarFileName && avatarContentType) {
    const sanitized = String(avatarBase64);
    const base64Data = sanitized.includes(",") ? sanitized.split(",")[1] : sanitized;
    const buffer = Buffer.from(base64Data, "base64");
    const upload = await uploadAvatar({
      userId: targetMembership.userId,
      data: buffer,
      fileName: String(avatarFileName),
      contentType: String(avatarContentType)
    });
    avatarUrl = upload.publicUrl ?? undefined;
  }

  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : undefined;
  const normalizedCpf = typeof cpf === "string" ? cpf.replace(/\D/g, "") : undefined;

  if (normalizedEmail && normalizedEmail !== targetMembership.user.email) {
    if (!supabaseAdmin) {
      return res.status(500).json({ message: "Supabase admin não configurado." });
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(targetMembership.userId, {
      email: normalizedEmail
    });
    if (error) {
      return res.status(400).json({ message: error.message || "Falha ao atualizar o e-mail." });
    }
  }

  if (typeof fullName === "string" && fullName.trim() && supabaseAdmin) {
    await supabaseAdmin.auth.admin.updateUserById(targetMembership.userId, {
      user_metadata: { full_name: fullName.trim() }
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetMembership.userId },
    data: {
      ...(typeof fullName === "string" && fullName.trim() ? { fullName: fullName.trim() } : {}),
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      ...(typeof phone === "string" ? { phone: phone.trim() || null } : {}),
      ...(typeof address === "string" ? { address: address.trim() || null } : {}),
      ...(typeof jobTitle === "string" ? { jobTitle: jobTitle.trim() || null } : {}),
      ...(typeof status === "string" ? { active: status === "ACTIVE" } : {}),
      ...(normalizedCpf
        ? {
            documentType: DocumentType.CPF,
            documentNumber: normalizedCpf
          }
        : {}),
      ...(avatarUrl ? { avatarUrl } : {})
    }
  });

  return res.json({
    member: {
      ...targetMembership,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        phone: updatedUser.phone,
        address: updatedUser.address,
        jobTitle: updatedUser.jobTitle,
        avatarUrl: updatedUser.avatarUrl,
        active: updatedUser.active,
        documentType: updatedUser.documentType,
        documentNumber: updatedUser.documentNumber
      }
    }
  });
});

export default router;
