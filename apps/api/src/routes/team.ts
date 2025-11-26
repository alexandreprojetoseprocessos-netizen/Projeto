import { Router } from "express";
import { MembershipRole } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { addMemberToOrganization, listMembersForOrganization } from "../services/organizationMembers";
import { prisma } from "@gestao/database";
import { canManageTeam } from "../services/permissions";

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

export default router;
