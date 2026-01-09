import { Router } from "express";
import { prisma } from "@gestao/database";
import { MembershipRole, OrganizationStatus } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import {
  attachOrgMembership,
  requireCanDeleteOrganization,
  requireCanManageOrgSettings
} from "../middleware/organization";
import { getActiveSubscriptionForUser } from "../services/subscriptions";

export const organizationsRouter = Router();

organizationsRouter.use(authMiddleware);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40) || "org";

const ensureUniqueSlug = async (baseSlug: string) => {
  let suffix = 0;
  let candidate = baseSlug;

  while (true) {
    const exists = await prisma.organization.findUnique({ where: { slug: candidate } });
    if (!exists) {
      return candidate;
    }
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
};

const getOrgLimitForPlan = (code?: string | null): number | null => {
  switch (code) {
    case "START":
      return 1;
    case "BUSINESS":
      return 3;
    case "ENTERPRISE":
      return null;
    default:
      return 1;
  }
};

const countOrganizationsForUser = async (userId: string) => {
  const memberships = await prisma.organizationMembership.findMany({
    where: {
      userId,
      organization: { status: { in: [OrganizationStatus.ACTIVE, OrganizationStatus.DEACTIVATED] } }
    },
    select: { id: true }
  });
  return memberships.length;
};

organizationsRouter.post("/", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { name, domain } = req.body ?? {};
  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Nome da organizacao e obrigatorio" });
  }

  const slug = await ensureUniqueSlug(slugify(name));

  const organization = await prisma.organization.create({
    data: {
      name: name.trim(),
      slug,
      domain: typeof domain === "string" && domain.trim() ? domain.trim() : null,
      status: OrganizationStatus.ACTIVE,
      isActive: true,
      memberships: {
        create: {
          userId: req.user.id,
          role: MembershipRole.OWNER
        }
      }
    }
  });

  return res.status(201).json({ organization });
});

organizationsRouter.get("/", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { status } = req.query as { status?: string };
  const validStatuses = Object.values(OrganizationStatus);
  const statusFilter =
    status && validStatuses.includes(status as OrganizationStatus)
      ? (status as OrganizationStatus)
      : OrganizationStatus.ACTIVE;

  const memberships = await prisma.organizationMembership.findMany({
    where: {
      userId: req.user.id,
      organization: { status: statusFilter }
    },
    include: { organization: true }
  });

  const organizations = memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    domain: membership.organization.domain,
    createdAt: membership.organization.createdAt,
    status: membership.organization.status,
    deletedAt: membership.organization.deletedAt,
    role: membership.role
  }));

  return res.json({ organizations });
});

organizationsRouter.patch(
  "/:organizationId",
  attachOrgMembership,
  requireCanManageOrgSettings,
  async (req, res) => {
    const { organizationId } = req.params;
    const { name, domain } = req.body as {
      name?: string;
      domain?: string | null;
    };

    if (!name && typeof domain === "undefined") {
      return res.status(400).json({ message: "Nenhuma alteracao informada." });
    }

    try {
      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          ...(typeof name === "string" && name.trim().length > 0 ? { name: name.trim() } : {}),
          ...(typeof domain !== "undefined" ? { domain: domain || null } : {})
        }
      });

      return res.json({ organization: updated });
    } catch (error) {
      console.error("Error updating organization", error);
      return res.status(500).json({ message: "Erro ao atualizar organizacao." });
    }
  }
);

organizationsRouter.patch(
  "/:organizationId/deactivate",
  attachOrgMembership,
  requireCanManageOrgSettings,
  async (req, res) => {
    const { organizationId } = req.params;

    try {
      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: { status: OrganizationStatus.DEACTIVATED, deletedAt: null, isActive: false }
      });

      return res.json({ organization: updated });
    } catch (error) {
      console.error("Error deactivating organization", error);
      return res.status(500).json({ message: "Erro ao desativar organizacao." });
    }
  }
);

organizationsRouter.patch(
  "/:organizationId/trash",
  attachOrgMembership,
  requireCanManageOrgSettings,
  async (req, res) => {
    const { organizationId } = req.params;

    try {
      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: { status: OrganizationStatus.SOFT_DELETED, deletedAt: new Date(), isActive: false }
      });

      return res.json({ organization: updated });
    } catch (error) {
      console.error("Error sending organization to trash", error);
      return res.status(500).json({ message: "Erro ao excluir organizacao." });
    }
  }
);

organizationsRouter.patch(
  "/:organizationId/restore",
  attachOrgMembership,
  requireCanManageOrgSettings,
  async (req, res) => {
    const { organizationId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!organization) {
        return res.status(404).json({ message: "Organizacao nao encontrada." });
      }

      const restorableStatuses: OrganizationStatus[] = [
        OrganizationStatus.DEACTIVATED,
        OrganizationStatus.SOFT_DELETED
      ];
      if (!restorableStatuses.includes(organization.status)) {
        return res.status(400).json({ message: "Esta organizacao nao pode ser restaurada." });
      }

      const subscription = await getActiveSubscriptionForUser(req.user.id);
      const planCode = subscription?.product?.code ?? null;
      const limit = getOrgLimitForPlan(planCode);

      if (limit !== null) {
        const currentCount = await countOrganizationsForUser(req.user.id);
        if (currentCount >= limit) {
          return res.status(409).json({
            code: "ORG_LIMIT_REACHED",
            message:
              "Voce ja atingiu o limite de organizacoes do seu plano. Para restaurar, exclua outra definitivamente ou faca upgrade."
          });
        }
      }

      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: { status: OrganizationStatus.ACTIVE, deletedAt: null, isActive: true }
      });

      return res.json({ organization: updated });
    } catch (error) {
      console.error("Error restoring organization", error);
      return res.status(500).json({ message: "Erro ao restaurar organizacao." });
    }
  }
);

organizationsRouter.delete(
  "/:organizationId",
  attachOrgMembership,
  requireCanDeleteOrganization,
  async (req, res) => {
    const { organizationId } = req.params;

    try {
      await prisma.organization.delete({
        where: { id: organizationId }
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting organization", error);
      return res.status(500).json({ message: "Erro ao excluir organizacao." });
    }
  }
);
