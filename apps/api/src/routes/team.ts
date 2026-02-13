import { DocumentType, MembershipRole } from "@prisma/client";
import { Router } from "express";
import { prisma } from "@gestao/database";
import { authMiddleware } from "../middleware/auth";
import { addMemberToOrganization, listMembersForOrganization } from "../services/organizationMembers";
import { canManageTeam } from "../services/permissions";
import { supabaseAdmin } from "../lib/supabase";
import { uploadAvatar } from "../services/storage";
import {
  getDefaultModulePermissions,
  normalizeModulePermissionsForRole
} from "../services/modulePermissions";

const router = Router();

router.use(authMiddleware);

const getMembership = async (organizationId: string, userId: string) => {
  return prisma.organizationMembership.findFirst({
    where: { organizationId, userId }
  });
};

const canAssignMembershipRole = (requesterRole: MembershipRole, targetRole: MembershipRole) => {
  if (requesterRole === MembershipRole.OWNER) return true;
  if (requesterRole === MembershipRole.ADMIN) {
    return targetRole === MembershipRole.MEMBER || targetRole === MembershipRole.VIEWER;
  }
  return false;
};

const canManageMembershipTarget = (requesterRole: MembershipRole, targetRole: MembershipRole) => {
  if (requesterRole === MembershipRole.OWNER) return true;
  if (requesterRole === MembershipRole.ADMIN) {
    return targetRole === MembershipRole.MEMBER || targetRole === MembershipRole.VIEWER;
  }
  return false;
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
  if (!canAssignMembershipRole(membership.role as MembershipRole, normalizedRole)) {
    return res.status(403).json({ message: "Seu papel atual não permite convidar este nível de acesso." });
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
  if (
    !isSelf &&
    !canManageMembershipTarget(requesterMembership.role as MembershipRole, targetMembership.role as MembershipRole)
  ) {
    return res.status(403).json({ message: "Seu papel atual não permite editar este nível de acesso." });
  }

  const {
    fullName,
    email,
    corporateEmail,
    personalEmail,
    phone,
    address,
    cpf,
    jobTitle,
    locale,
    timezone,
    status,
    role,
    modulePermissions,
    avatarBase64,
    avatarFileName,
    avatarContentType
  } = req.body ?? {};

  const normalizedRole =
    typeof role === "string" && (["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const).includes(role as any)
      ? (role as MembershipRole)
      : undefined;

  const hasModulePermissionsPayload = Object.prototype.hasOwnProperty.call(req.body ?? {}, "modulePermissions");
  const normalizedModulePermissions = hasModulePermissionsPayload
    ? normalizeModulePermissionsForRole(
        (normalizedRole ?? (targetMembership.role as MembershipRole)) as MembershipRole,
        modulePermissions
      )
    : undefined;

  if (normalizedRole) {
    if (!canManageTeam(requesterMembership.role as any)) {
      return res.status(403).json({ message: "Você não tem permissão para alterar papéis de acesso." });
    }
    if (!canAssignMembershipRole(requesterMembership.role as MembershipRole, normalizedRole)) {
      return res.status(403).json({ message: "Seu papel atual não permite definir este nível de acesso." });
    }
    if (
      !canManageMembershipTarget(requesterMembership.role as MembershipRole, targetMembership.role as MembershipRole)
    ) {
      return res.status(403).json({ message: "Seu papel atual não permite alterar este membro." });
    }
    const requesterIsOwner = requesterMembership.role === MembershipRole.OWNER;
    if (!requesterIsOwner && (targetMembership.role === MembershipRole.OWNER || normalizedRole === MembershipRole.OWNER)) {
      return res.status(403).json({ message: "Somente o proprietário pode alterar papéis de OWNER." });
    }
    if (
      targetMembership.userId === req.user.id &&
      targetMembership.role === MembershipRole.OWNER &&
      normalizedRole !== MembershipRole.OWNER
    ) {
      return res.status(400).json({ message: "O proprietário não pode remover o próprio papel de OWNER." });
    }
  }

  if (hasModulePermissionsPayload) {
    if (!canManageTeam(requesterMembership.role as any)) {
      return res.status(403).json({ message: "Você não tem permissão para ajustar permissões por módulo." });
    }
    if (
      !canManageMembershipTarget(requesterMembership.role as MembershipRole, targetMembership.role as MembershipRole)
    ) {
      return res.status(403).json({ message: "Seu papel atual não permite alterar permissões deste membro." });
    }
  }

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
  const normalizedCorporateEmail = typeof corporateEmail === "string" ? corporateEmail.trim().toLowerCase() : undefined;
  const normalizedPersonalEmail = typeof personalEmail === "string" ? personalEmail.trim().toLowerCase() : undefined;
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

  const userPatch = {
    ...(typeof fullName === "string" && fullName.trim() ? { fullName: fullName.trim() } : {}),
    ...(normalizedEmail ? { email: normalizedEmail } : {}),
    ...(normalizedCorporateEmail !== undefined ? { corporateEmail: normalizedCorporateEmail || null } : {}),
    ...(normalizedPersonalEmail !== undefined ? { personalEmail: normalizedPersonalEmail || null } : {}),
    ...(typeof phone === "string" ? { phone: phone.trim() || null } : {}),
    ...(typeof address === "string" ? { address: address.trim() || null } : {}),
    ...(typeof jobTitle === "string" ? { jobTitle: jobTitle.trim() || null } : {}),
    ...(typeof locale === "string" && locale.trim() ? { locale: locale.trim() } : {}),
    ...(typeof timezone === "string" && timezone.trim() ? { timezone: timezone.trim() } : {}),
    ...(typeof status === "string" ? { active: status === "ACTIVE" } : {}),
    ...(normalizedCpf
      ? {
          documentType: DocumentType.CPF,
          documentNumber: normalizedCpf
        }
      : {}),
    ...(avatarUrl ? { avatarUrl } : {})
  };

  const hasUserPatch = Object.keys(userPatch).length > 0;
  let updatedUser = targetMembership.user;
  if (hasUserPatch) {
    try {
      updatedUser = await prisma.user.update({
        where: { id: targetMembership.userId },
        data: userPatch
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar dados do usuário.";
      if (message.includes("corporateEmail")) {
        return res.status(400).json({ message: "O e-mail corporativo informado já está em uso." });
      }
      if (message.includes("email")) {
        return res.status(400).json({ message: "O e-mail informado já está em uso." });
      }
      return res.status(400).json({ message });
    }
  }

  const roleChanged = Boolean(normalizedRole && normalizedRole !== targetMembership.role);
  const membershipPatch: {
    role?: MembershipRole;
    modulePermissions?: ReturnType<typeof getDefaultModulePermissions>;
  } = {};

  if (roleChanged && normalizedRole) {
    membershipPatch.role = normalizedRole;
  }

  if (normalizedModulePermissions) {
    membershipPatch.modulePermissions = normalizedModulePermissions;
  } else if (roleChanged && normalizedRole) {
    membershipPatch.modulePermissions = getDefaultModulePermissions(normalizedRole);
  }

  const updatedMembership =
    Object.keys(membershipPatch).length > 0
      ? await prisma.organizationMembership.update({
          where: { id: targetMembership.id },
          data: membershipPatch as any
        })
      : targetMembership;

  return res.json({
    member: {
      ...targetMembership,
      role: updatedMembership.role,
      modulePermissions: normalizeModulePermissionsForRole(
        updatedMembership.role as MembershipRole,
        (updatedMembership as any).modulePermissions
      ),
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        corporateEmail: updatedUser.corporateEmail,
        personalEmail: updatedUser.personalEmail,
        fullName: updatedUser.fullName,
        phone: updatedUser.phone,
        address: updatedUser.address,
        jobTitle: updatedUser.jobTitle,
        locale: updatedUser.locale,
        timezone: updatedUser.timezone,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        avatarUrl: updatedUser.avatarUrl,
        active: updatedUser.active,
        documentType: updatedUser.documentType,
        documentNumber: updatedUser.documentNumber
      }
    }
  });
});

router.delete("/:organizationId/members/:memberId", async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Authentication required" });

  const { organizationId, memberId } = req.params;
  if (!organizationId || !memberId) {
    return res.status(400).json({ message: "organizationId e memberId são obrigatórios" });
  }

  const requesterMembership = await getMembership(organizationId, req.user.id);
  if (!requesterMembership) return res.status(403).json({ message: "Access denied" });
  if (!canManageTeam(requesterMembership.role as any)) {
    return res.status(403).json({ message: "Você não tem permissão para remover membros." });
  }

  const targetMembership = await prisma.organizationMembership.findFirst({
    where: { id: memberId, organizationId }
  });
  if (!targetMembership) {
    return res.status(404).json({ message: "Membro não encontrado" });
  }
  if (
    !canManageMembershipTarget(requesterMembership.role as MembershipRole, targetMembership.role as MembershipRole)
  ) {
    return res.status(403).json({ message: "Seu papel atual não permite remover este nível de acesso." });
  }

  if (targetMembership.userId === req.user.id) {
    return res.status(400).json({ message: "Você não pode remover sua própria associação." });
  }

  if (targetMembership.role === MembershipRole.OWNER) {
    return res.status(400).json({ message: "Não é permitido remover o proprietário da organização." });
  }

  await prisma.wbsNode.updateMany({
    where: {
      responsibleMembershipId: targetMembership.id,
      project: { organizationId }
    },
    data: {
      responsibleMembershipId: null
    }
  });

  await prisma.organizationMembership.delete({
    where: { id: targetMembership.id }
  });

  return res.status(204).send();
});

export default router;

