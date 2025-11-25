import { Router } from "express";
import { MembershipRole } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { addMemberToOrganization, listMembersForOrganization } from "../services/organizationMembers";
import { prisma } from "@gestao/database";

const router = Router();

router.use(authMiddleware);

const ensureUserInOrganization = async (organizationId: string, userId: string) => {
  const membership = await prisma.organizationMembership.findFirst({
    where: { organizationId, userId }
  });
  return Boolean(membership);
};

router.get("/:organizationId/members", async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Authentication required" });

  const { organizationId } = req.params;
  if (!organizationId) return res.status(400).json({ message: "organizationId is required" });

  const allowed = await ensureUserInOrganization(organizationId, req.user.id);
  if (!allowed) return res.status(403).json({ message: "Access denied" });

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

  const allowed = await ensureUserInOrganization(organizationId, req.user.id);
  if (!allowed) return res.status(403).json({ message: "Access denied" });

  try {
    const membership = await addMemberToOrganization(organizationId, email, normalizedRole, req.user);
    return res.status(201).json({ member: membership });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível adicionar membro";
    return res.status(400).json({ message });
  }
});

export default router;
